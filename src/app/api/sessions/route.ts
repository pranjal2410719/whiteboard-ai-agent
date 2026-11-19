import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { studySessions } from "@/db/schema";
import { catalog, createLesson, findLesson } from "@/lib/lessons";
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
  if (!key && !connectionInfo(keys).connected) return fail("Custom topics need a connected Gemini API key. Add one in Settings → Tutor connection, or choose one of the guided lessons below.", 422);
  const guidedFor = (lesson: string) => createLesson(catalog.some(item => item.key === lesson) ? lesson : "pythagoras");
  let data = guidedFor(key || "pythagoras");
  let notice = "";
  try {
    if (!connectionInfo(keys).connected) throw new TutorError("No model is connected.", 422);
    const turn = await modelTurn(`Start a new visual lesson about: ${topic}`, null, keys);
    data = { ...data, title: turn.title || topic, subject: turn.subject || "Learning", lessonKey: key || "custom", pages: [turn.page!], mode: "llm", messages: [{ role: "assistant", content: turn.explanation }], suggestions: turn.suggestions };
  } catch (error) {
    const message = error instanceof Error ? error.message : "The tutor could not create the lesson.";
    if (!key) return fail(message, error instanceof TutorError ? error.status : 502);
    data = guidedFor(key);
    notice = `${message} I’ve opened the matching guided lesson instead.`;
  }
  const [row] = await db.insert(studySessions).values({ workspaceId: owner, data }).returning();
  return Response.json({ session: serialize(row), notice }, { status: 201 });
}
