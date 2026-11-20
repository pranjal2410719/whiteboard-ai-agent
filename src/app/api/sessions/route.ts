import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { studySessions } from "@/db/schema";
import { isDiagramKey } from "@/lib/diagrams";
import { catalog, createCustomLesson, createLesson, findLesson } from "@/lib/lessons";
import { PreparationEngine } from "@/lib/curriculum/preparation-engine";
import { CurriculumTaxonomy } from "@/lib/curriculum/taxonomy";
import { fail, serialize, workspaceId } from "@/lib/store";
import { TutorError, connectionInfo, modelTurn, serverKey, type TabKeys } from "@/lib/tutor";

export const dynamic = "force-dynamic";
export async function GET() {
  const owner = await workspaceId();
  let rows = await db.select().from(studySessions).where(eq(studySessions.workspaceId, owner)).orderBy(desc(studySessions.updatedAt)).limit(100);
  if (!rows.length) {
    rows = await db.insert(studySessions).values(catalog.map(({ key }, i) => ({ workspaceId: owner, data: createLesson(key), updatedAt: new Date(Date.now() - i * 86400000), createdAt: new Date(Date.now() - i * 86400000) }))).returning();
  }
  return Response.json({ sessions: rows.map(serialize), ...connectionInfo(), serverKeyConfigured: Boolean(serverKey("gemini")) }, { headers: { "Cache-Control": "private, no-store" } });
}
export async function POST(request: Request) {
  const owner = await workspaceId();
  const body = await request.json().catch(() => ({}));
  const rawTopic = typeof body.topic === "string" ? body.topic.trim().slice(0, 600) : "";
  const topicId = typeof body.topicId === "string" ? body.topicId.trim() : "";
  const subjectId = typeof body.subjectId === "string" ? body.subjectId.trim() : "";
  const chapterId = typeof body.chapterId === "string" ? body.chapterId.trim() : "";
  const studentLevel = body.studentLevel === "beginner" || body.studentLevel === "advanced" ? body.studentLevel : "intermediate";

  const effectiveTopic = rawTopic || (topicId ? topicId.replace(/-/g, " ") : "");
  if (!effectiveTopic) return fail("Choose a lesson or enter a topic first.");

  const key = findLesson(effectiveTopic);
  const keys: TabKeys = { gemini: request.headers.get("x-gemini-key"), openai: request.headers.get("x-openai-key") };

  // Check if topic matches curriculum taxonomy or has explicit subject/chapter/topic
  const curriculumMatch = topicId || subjectId || chapterId || CurriculumTaxonomy.findTopic(effectiveTopic);
  let data = curriculumMatch
    ? PreparationEngine.prepareClassroom({ topic: effectiveTopic, topicId, subjectId, chapterId, studentLevel }).sessionData
    : createCustomLesson(effectiveTopic, key);

  let notice = "";
  try {
    // If not a diagram or curriculum-guided lesson, use dynamic LLM model turn if connected
    const isDiagram = isDiagramKey(data.lessonKey || "") || Boolean(data.classroomContext?.assetKey);
    if (connectionInfo(keys).connected && !isDiagram) {
      const turn = await modelTurn(`Start a new visual lesson about: ${effectiveTopic}`, null, keys);
      if (turn && turn.page) {
        data = {
          ...data,
          title: turn.title || effectiveTopic,
          subject: turn.subject || data.subject || "Learning",
          lessonKey: key || "custom",
          pages: [turn.page],
          mode: "llm",
          messages: [{ role: "assistant", content: turn.explanation }],
          suggestions: turn.suggestions
        };
      }
    }
  } catch (error) {
    data = curriculumMatch
      ? PreparationEngine.prepareClassroom({ topic: effectiveTopic, topicId, subjectId, chapterId, studentLevel }).sessionData
      : createCustomLesson(effectiveTopic, key);
    notice = "Class generated with visual whiteboard demonstration.";
  }
  const [row] = await db.insert(studySessions).values({ workspaceId: owner, data }).returning();
  return Response.json({ session: serialize(row), notice }, { status: 201 });
}
