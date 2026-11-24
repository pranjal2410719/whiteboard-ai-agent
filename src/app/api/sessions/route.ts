import { isDiagramKey } from "@/lib/diagrams";
import { createCustomLesson, createLesson, findLesson } from "@/lib/lessons";
import { PreparationEngine } from "@/lib/curriculum/preparation-engine";
import { CurriculumTaxonomy } from "@/lib/curriculum/taxonomy";
import { fail, listSessions, saveSession, workspaceId } from "@/lib/store";
import { connectionInfo, modelTurn, serverKey, type TabKeys } from "@/lib/tutor";

export const dynamic = "force-dynamic";

export async function GET() {
  const owner = await workspaceId();
  const sessions = await listSessions(owner);
  return Response.json(
    { sessions, ...connectionInfo(), serverKeyConfigured: Boolean(serverKey("gemini")) },
    { headers: { "Cache-Control": "private, no-store" } }
  );
}

export async function POST(request: Request) {
  const owner = await workspaceId();
  const body = await request.json().catch(() => ({}));
  const rawTopic = typeof body.topic === "string" ? body.topic.trim().slice(0, 600) : "";
  const topicId = typeof body.topicId === "string" ? body.topicId.trim() : "";
  const lessonKey = typeof body.lessonKey === "string" ? body.lessonKey.trim() : "";
  const subjectId = typeof body.subjectId === "string" ? body.subjectId.trim() : "";
  const chapterId = typeof body.chapterId === "string" ? body.chapterId.trim() : "";
  const studentLevel = body.studentLevel === "beginner" || body.studentLevel === "advanced" ? body.studentLevel : "intermediate";

  const effectiveTopic = rawTopic || (topicId ? topicId.replace(/-/g, " ") : "") || (lessonKey ? lessonKey.replace(/-/g, " ") : "");
  if (!effectiveTopic) return fail("Choose a lesson or enter a topic first.");

  const key = lessonKey || findLesson(effectiveTopic);
  const keys: TabKeys = { gemini: request.headers.get("x-gemini-key"), openai: request.headers.get("x-openai-key") };

  // Check if topic matches curriculum taxonomy or has explicit subject/chapter/topic
  const curriculumMatch = topicId || subjectId || chapterId || (lessonKey ? false : CurriculumTaxonomy.findTopic(effectiveTopic));
  let data = lessonKey
    ? createLesson(lessonKey)
    : curriculumMatch
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

  const session = await saveSession(owner, data);
  return Response.json({ ...session, session, notice }, { status: 201 });
}
