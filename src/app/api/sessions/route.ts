import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { studySessions } from "@/db/schema";
import { isDiagramKey } from "@/lib/diagrams";
import { catalog, createCustomLesson, createLesson, findLesson } from "@/lib/lessons";
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
  const topic = typeof body.topic === "string" ? body.topic.trim().slice(0, 600) : "";
  if (!topic) return fail("Choose a lesson or enter a topic first.");
  const key = findLesson(topic);
  const keys: TabKeys = { gemini: request.headers.get("x-gemini-key"), openai: request.headers.get("x-openai-key") };
  let data = createCustomLesson(topic, key);
  let notice = "";
  try {
    // Diagram lessons ship with their own labelled board and regions; let the tutor
    // annotate that board instead of replacing it with a freehand drawing.
    if (connectionInfo(keys).connected && !isDiagramKey(key || "")) {
      const turn = await modelTurn(`Start a new visual lesson about: ${topic}`, null, keys);
      if (turn && turn.page) {
        data = { ...data, title: turn.title || topic, subject: turn.subject || "Learning", lessonKey: key || "custom", pages: [turn.page], mode: "llm", messages: [{ role: "assistant", content: turn.explanation }], suggestions: turn.suggestions };
      }
    }
  } catch (error) {
    data = createCustomLesson(topic, key);
    notice = "Class generated with visual whiteboard demonstration.";
  }
  const [row] = await db.insert(studySessions).values({ workspaceId: owner, data }).returning();
  return Response.json({ session: serialize(row), notice }, { status: 201 });
}
