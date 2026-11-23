import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { studySessions } from "@/db/schema";
import { isDiagramKey } from "@/lib/diagrams";
import { catalog, createCustomLesson, createLesson, findLesson, getStaticClassPage } from "@/lib/lessons";
import { PreparationEngine } from "@/lib/curriculum/preparation-engine";
import { CurriculumTaxonomy } from "@/lib/curriculum/taxonomy";
import { fail, serialize, workspaceId } from "@/lib/store";
import { TutorError, connectionInfo, modelTurn, serverKey, type TabKeys } from "@/lib/tutor";

export const dynamic = "force-dynamic";
export async function GET() {
  const owner = await workspaceId();
  let rows = await db.select().from(studySessions).where(eq(studySessions.workspaceId, owner)).orderBy(desc(studySessions.updatedAt)).limit(100);
  
  // Filter out any obsolete demo classes
  const obsoleteKeys = new Set(["cell", "animal-cell", "heart-diagram", "circuit-diagram", "pythagoras", "fractions", "inclined-diagram", "water-diagram", "cell-diagram", "water-cycle", "dc-circuit", "heart", "human-heart"]);
  rows = rows.filter(r => {
    const lk = (r.data as any)?.lessonKey;
    const title = ((r.data as any)?.title || "").toLowerCase();
    if (obsoleteKeys.has(lk) || title.includes("animal") || title.includes("heart") || title.includes("circuit") || title.includes("inclined") || title.includes("water")) return false;
    return true;
  });

  if (!rows.length) {
    rows = await db.insert(studySessions).values(catalog.map(({ key }, i) => ({ workspaceId: owner, data: createLesson(key), updatedAt: new Date(Date.now() - i * 86400000), createdAt: new Date(Date.now() - i * 86400000) }))).returning();
  } else {
    // Ensure canonical 4 catalog entries exist and are deduplicated
    const catalogKeySet = new Set(catalog.map(c => c.key));
    const seenCatalog = new Set<string>();
    const deduplicatedCatalogRows: typeof rows = [];
    const customRows: typeof rows = [];

    for (const r of rows) {
      const key = (r.data as any)?.lessonKey;
      if (catalogKeySet.has(key)) {
        if (!seenCatalog.has(key)) {
          seenCatalog.add(key);
          // Sync canonical title, subject, and static page 0
          const entry = catalog.find(c => c.key === key);
          if (entry) {
            r.data.title = entry.title;
            r.data.subject = entry.subject;
            r.data.pages = [getStaticClassPage(key)];
            r.data.suggestions = createLesson(key).suggestions;
            r.data.pageIndex = 0;
            try {
              await db.update(studySessions).set({ data: r.data }).where(eq(studySessions.id, r.id));
            } catch {
              // Non-blocking if concurrent update
            }
          }
          deduplicatedCatalogRows.push(r);
        }
      } else {
        customRows.push(r);
      }
    }

    const missing = catalog.filter(({ key }) => !seenCatalog.has(key));
    if (missing.length > 0) {
      const inserted = await db.insert(studySessions).values(
        missing.map(({ key }, i) => ({
          workspaceId: owner,
          data: createLesson(key),
          updatedAt: new Date(Date.now() - (deduplicatedCatalogRows.length + i) * 86400000),
          createdAt: new Date(Date.now() - (deduplicatedCatalogRows.length + i) * 86400000),
        }))
      ).returning();
      deduplicatedCatalogRows.push(...inserted);
    }

    // Sort catalog rows in canonical catalog order
    const catalogOrderMap = new Map(catalog.map((c, i) => [c.key, i]));
    deduplicatedCatalogRows.sort((a, b) => {
      const orderA = catalogOrderMap.get((a.data as any)?.lessonKey) ?? 999;
      const orderB = catalogOrderMap.get((b.data as any)?.lessonKey) ?? 999;
      return orderA - orderB;
    });

    rows = [...deduplicatedCatalogRows, ...customRows];
  }
  return Response.json({ sessions: rows.map(serialize), ...connectionInfo(), serverKeyConfigured: Boolean(serverKey("gemini")) }, { headers: { "Cache-Control": "private, no-store" } });
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
  const [row] = await db.insert(studySessions).values({ workspaceId: owner, data }).returning();
  const serialized = serialize(row);
  return Response.json({ ...serialized, session: serialized, notice }, { status: 201 });
}
