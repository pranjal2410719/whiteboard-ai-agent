import { isDiagramKey } from "@/lib/diagrams";
import { answerCurriculumDoubt } from "@/lib/curriculum-answers";
import { guidedLectureTurn, guidedTurn } from "@/lib/lessons";
import { isRecordedClassKey } from "@/lib/recorded-classes";
import { fail, getSession, updateSession, validId, workspaceId } from "@/lib/store";
import { isConnected, modelTurn, TutorError, type TabKeys } from "@/lib/tutor";
import { TeachingOrchestrator } from "@/lib/pedagogy/orchestrator";
import type { SupportedLanguage, TutorTurn } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const owner = await workspaceId();
  const body = await request.json().catch(() => ({}));
  const sessionId = body.sessionId;
  const message = typeof body.message === "string" ? body.message.trim() : "";
  const lecture = Boolean(body.lecture);
  const language: SupportedLanguage = typeof body.language === "string" && ["en", "hi", "hinglish"].includes(body.language) ? (body.language as SupportedLanguage) : "en";
  const lectureContext = body.lectureContext && typeof body.lectureContext === "object" ? body.lectureContext : undefined;

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
        turn = await modelTurn(message, data, keys, { lecture: true, language });
      } else if (isDiagramKey(data.lessonKey)) {
        return fail("To generate a 2-minute visual lecture for this diagram, connect a Gemini API key. In the live whiteboard, you can ask the tutor to circle, highlight, wire, or explain any part directly!", 422);
      } else {
        return fail("Custom topics need a connected Gemini API key.", 422);
      }
    } else if (lectureContext) {
      // In-class query resolution: student interrupted or paused the lecture to ask a doubt
      // First verify relevance to the active lecture topic, current screen diagram, whiteboard content & syllabus
      const { isQuestionRelevantToTopic, answerCurriculumDoubt } = await import("@/lib/curriculum-answers");
      const fullContext = {
        ...lectureContext,
        topic: lectureContext.topic || data.title,
        sessionData: data,
        currentMarks: data.pages[data.pageIndex]?.marks,
        currentRegions: data.pages[data.pageIndex]?.regions,
        allPages: data.pages,
        lessonKey: data.lessonKey,
      };
      const isRelevant = isQuestionRelevantToTopic(message, fullContext);
      if (!isRelevant) {
        turn = answerCurriculumDoubt(message, fullContext, language);
      } else if (isConnected(keys)) {
        try {
          turn = await modelTurn(message, data, keys, { language, lectureContext });
        } catch {
          turn = answerCurriculumDoubt(message, fullContext, language);
        }
      } else {
        turn = answerCurriculumDoubt(message, fullContext, language);
      }
    } else if (data.classroomContext) {
      turn = await TeachingOrchestrator.orchestrateTurn(message, data, keys, { language, workspaceId: owner });
    } else if (data.mode === "guided" && (!isConnected(keys) || data.quiz || /example|quiz|hint|simply|work through|practice/i.test(message))) {
      turn = guidedTurn(data, message, language);
    } else if (isConnected(keys)) {
      try {
        turn = await modelTurn(message, data, keys, { language, lectureContext });
      } catch (err) {
        turn = guidedTurn(data, message, language);
        const isCreditsIssue = err instanceof Error && (/prepayment|credit|billing|402/i.test(err.message));
        notice = isCreditsIssue
          ? "Your Gemini key is valid, but prepayment credits are depleted. Professor answered using built-in curriculum intelligence."
          : undefined;
      }
    } else {
      turn = guidedTurn(data, message, language);
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

  if (!lectureContext) {
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
  }

  const drew = !lectureContext && Boolean(turn.page || (turn.pages && turn.pages.length));

  const updated = await updateSession(sessionId, owner, data);

  return Response.json({
    session: updated,
    drew,
    // Which engine answered, so the client can report the provider state truthfully.
    mode: turn.mode,
    doubtMarks: turn.doubtMarks,
    isIrrelevant: Boolean(turn.isIrrelevant),
    ...(notice ? { notice } : {}),
  });
}
