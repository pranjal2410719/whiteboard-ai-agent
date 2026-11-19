import { db } from "@/db";
import { studySessions } from "@/db/schema";
import { guidedLectureTurn, guidedTurn } from "@/lib/lessons";
import { isRecordedClassKey } from "@/lib/recorded-classes";
import { fail, getSession, ownedSession, serialize, validId, workspaceId } from "@/lib/store";
import { isConnected, modelTurn, TutorError, type TabKeys } from "@/lib/tutor";
import type { TutorTurn } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const owner = await workspaceId();
  const body = await request.json().catch(() => ({}));
  const sessionId = body.sessionId;
  const message = typeof body.message === "string" ? body.message.trim() : "";
  const lecture = Boolean(body.lecture);

  if (!validId(sessionId)) return fail("Session ID is required");
  if (!message) return fail("Message is required");

  const row = await getSession(sessionId, owner);
  if (!row) return fail("Session not found", 404);

  const keys: TabKeys = {
    gemini: request.headers.get("x-gemini-key"),
    openai: request.headers.get("x-openai-key"),
  };

  const data = { ...row.data };
  let turn: TutorTurn;
  let notice: string | undefined;

  try {
    if (lecture) {
      if (isRecordedClassKey(data.lessonKey)) {
        turn = guidedLectureTurn(data);
      } else if (isConnected(keys)) {
        turn = await modelTurn(message, data, keys, { lecture: true });
      } else {
        return fail("Custom topics need a connected Gemini API key.", 422);
      }
    } else if (data.mode === "guided" && (!isConnected(keys) || data.quiz || /example|quiz|hint|simply|work through|practice/i.test(message))) {
      turn = guidedTurn(data, message);
    } else if (isConnected(keys)) {
      try {
        turn = await modelTurn(message, data, keys);
      } catch (err) {
        if (data.mode === "guided") {
          turn = guidedTurn(data, message);
          notice = err instanceof Error ? `${err.message} I answered using the guided lesson.` : undefined;
        } else {
          throw err;
        }
      }
    } else {
      if (data.mode === "guided") {
        turn = guidedTurn(data, message);
      } else {
        return fail("Connect your Gemini API key in Settings to explore a custom topic.", 422);
      }
    }
  } catch (err) {
    if (err instanceof TutorError) {
      return fail(err.message, err.status);
    }
    return fail(err instanceof Error ? err.message : "The tutor could not complete the response.", 502);
  }

  // Update session data
  data.messages = [...data.messages, { role: "user", content: message }, { role: "assistant", content: turn.explanation }];
  data.suggestions = turn.suggestions || data.suggestions;
  data.quiz = turn.quiz !== undefined ? turn.quiz : data.quiz;

  if (turn.lecture) {
    data.lecture = turn.lecture;
  }

  if (turn.pages && turn.pages.length) {
    data.pages = turn.pages;
    data.pageIndex = 0;
  } else if (turn.page) {
    const existingIndex = data.pages.findIndex(p => p.id === turn.page!.id);
    if (existingIndex >= 0) {
      data.pages[existingIndex] = turn.page;
      data.pageIndex = existingIndex;
    } else {
      data.pages.push(turn.page);
      data.pageIndex = data.pages.length - 1;
    }
  }

  const drew = Boolean(turn.page || (turn.pages && turn.pages.length));

  const [updated] = await db
    .update(studySessions)
    .set({ data, updatedAt: new Date() })
    .where(ownedSession(sessionId, owner))
    .returning();

  return Response.json({
    session: serialize(updated),
    drew,
    ...(notice ? { notice } : {}),
  });
}
