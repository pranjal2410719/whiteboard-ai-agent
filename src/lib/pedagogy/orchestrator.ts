import type { BoardMark, BoardPage, SessionData, SupportedLanguage, TutorTurn } from "../types";
import type { ClassroomContext } from "../curriculum/types";
import { PersonaManager } from "./personas";
import { PedagogyStateMachine } from "./state-machine";
import { ActionDispatcher } from "./action-dispatcher";
import type { PedagogyStage, PedagogyState, TeachingAction, TeachingPersona } from "./types";
import { isConnected, modelTurn, type TabKeys } from "../tutor";
import { LearnerAdaptiveModel } from "../lam/adaptive-model";

export class TeachingOrchestrator {
  /**
   * Orchestrates a pedagogical teaching turn, adapting persona, advancing the state machine,
   * resolving semantic CIE actions, and generating the whiteboard response.
   */
  static async orchestrateTurn(
    message: string,
    sessionData: SessionData,
    keys: TabKeys = {},
    options: { language?: SupportedLanguage; requestedPersona?: TeachingPersona; workspaceId?: string } = {}
  ): Promise<TutorTurn> {
    const context = sessionData.classroomContext;
    const currentPage = sessionData.pages[sessionData.pageIndex] || sessionData.pages[0];

    // 1. Initialize or retrieve pedagogy state
    const currentState: PedagogyState = (currentPage as any).pedagogyState ||
      PedagogyStateMachine.initialState(context, options.requestedPersona);

    // Check if the student explicitly asked to switch personas
    const explicitPersona = PersonaManager.resolveDefaultPersona(context?.studentLevel, message);
    if (explicitPersona !== currentState.persona && /professor|socratic|mentor|peer|switch to/i.test(message)) {
      currentState.persona = explicitPersona;
    }

    // 2. Evaluate student input using State Machine
    const evaluation = PedagogyStateMachine.evaluateStep(message, currentState, context);

    // 2b. Fetch student's prior mastery profiles and generate adaptive cognitive directives
    let adaptiveDirective = "";
    if (options.workspaceId && context) {
      try {
        const profiles = await LearnerAdaptiveModel.getProfiles(options.workspaceId, context.subject, context.topic);
        adaptiveDirective = LearnerAdaptiveModel.generateAdaptiveDirectives(profiles);
      } catch {
        // Graceful fallback if database unavailable
      }
    }

    let explanation = "";
    let actionsToDispatch: TeachingAction[] = [...evaluation.recommendedActions];
    let suggestions: string[] = [];

    // 3. If live LLM connection is available, query model with injected pedagogical directives
    if (isConnected(keys)) {
      try {
        const personaDirective = PersonaManager.getPromptDirective(currentState.persona);
        const stageDirective = `[PEDAGOGY STAGE: ${evaluation.recommendedNextStage}]\n` +
          `Context: Subject=${context?.subject}, Chapter=${context?.chapter}, Topic=${context?.topic}.\n` +
          `Key Landmarks available: ${context?.keyLandmarks.join(", ") || "none"}.\n` +
          `Rules: When resolving a student question or doubt: 1. Clearly acknowledge and state what the student's question is. 2. Provide a simple, clear, and minimalistic explanation directly answering the question without rambling. 3. Keep whiteboard marks minimalistic. 4. Emit semantic actions in text where appropriate: [ACTION:highlight element="..."] or [ACTION:circle element="..."] or [ACTION:arrow from="..." to="..."] or [ACTION:label element="..." text="..."]. Keep speech natural.`;

        const promptAugmentation = `\n${personaDirective}\n${adaptiveDirective ? adaptiveDirective + "\n" : ""}${stageDirective}\nStudent says: "${message}"`;
        const turn = await modelTurn(promptAugmentation, sessionData, keys, { language: options.language });

        if (turn) {
          const parsed = ActionDispatcher.parseActionsFromText(turn.explanation);
          explanation = parsed.narrationText;
          if (parsed.actions.length > 0) {
            actionsToDispatch.push(...parsed.actions);
          }
          suggestions = turn.suggestions || [];
        }
      } catch (err) {
        // Fallback to deterministic pedagogy engine below
      }
    }

    // 4. Deterministic pedagogical response generator if LLM was offline or as fallback
    if (!explanation) {
      const generated = this.generateDeterministicTurn(
        message,
        currentState,
        evaluation.recommendedNextStage,
        context,
        options.language || "en"
      );
      explanation = generated.explanation;
      if (generated.actions.length > 0) {
        actionsToDispatch.push(...generated.actions);
      }
      suggestions = generated.suggestions;
    }

    // 5. Dispatch actions to CIE and create verified BoardMarks
    const { marks: newMarks, executedActions } = ActionDispatcher.dispatchActions(
      actionsToDispatch,
      currentPage,
      context?.assetKey
    );

    // 6. Transition state machine
    const demonstratedElements = executedActions
      .map(a => a.elementId)
      .filter((id): id is string => Boolean(id));

    const nextState = PedagogyStateMachine.transition(currentState, evaluation, demonstratedElements);

    // 6b. Record Learner Adaptive Model assessment
    if (options.workspaceId && context) {
      try {
        if (evaluation.misconceptionDetected) {
          await LearnerAdaptiveModel.recordAssessment({
            workspaceId: options.workspaceId,
            subjectId: context.subject,
            topicId: context.topic,
            conceptId: context.keyLandmarks[0] || "core_concept",
            isCorrect: false,
            misconception: evaluation.misconceptionDetected,
          });
        } else if (evaluation.recommendedNextStage === "SYNTHESIS" || nextState.studentUnderstandingScore >= 0.75) {
          await LearnerAdaptiveModel.recordAssessment({
            workspaceId: options.workspaceId,
            subjectId: context.subject,
            topicId: context.topic,
            conceptId: context.keyLandmarks[0] || "core_concept",
            isCorrect: true,
          });
        }
      } catch {
        // Non-blocking assessment persistence
      }
    }

    // 7. Update current BoardPage with new marks and attach updated pedagogy state
    const updatedPage: BoardPage = {
      ...currentPage,
      marks: [...currentPage.marks, ...newMarks]
    };
    (updatedPage as any).pedagogyState = nextState;

    return {
      explanation,
      page: updatedPage,
      suggestions: suggestions.length > 0 ? suggestions : context?.suggestedPrompts?.slice(0, 3) || ["Show next step", "Quiz me", "Explain simply"],
      quiz: null,
      mode: "guided",
      title: context?.topic || sessionData.title,
      subject: context?.subject || sessionData.subject
    };
  }

  private static generateDeterministicTurn(
    message: string,
    state: PedagogyState,
    nextStage: PedagogyState["stage"],
    context?: ClassroomContext,
    lang: SupportedLanguage = "en"
  ): { explanation: string; actions: TeachingAction[]; suggestions: string[] } {
    const persona = PersonaManager.getPersona(state.persona);
    const actions: TeachingAction[] = [];
    let explanation = "";
    let suggestions: string[] = [];

    const isHi = lang === "hi";
    const isHinglish = lang === "hinglish";
    const topic = context?.topic || "this concept";

    if (nextStage === "VISUAL_DEMO") {
      const targetLandmark = state.uncoveredLandmarks[0] || context?.keyLandmarks[0] || "right-atrium";
      actions.push({ type: "highlight", elementId: targetLandmark });

      if (state.persona === "socratic") {
        explanation = `Look closely at the highlighted region on the diagram (**${targetLandmark.replace(/-/g, " ")}**).\n\nNotice where it is situated in the pathway. What role do you think this structure plays in directing flow through the system?`;
        suggestions = ["How does blood move here?", "What connects to it?", "Show next part"];
      } else if (state.persona === "professor") {
        explanation = `Observe the highlighted structure: **${targetLandmark.replace(/-/g, " ")}**.\n\nFrom a physiological and hemodynamic standpoint, this region establishes the initial pressure gradient required for systemic transmission. Note the wall morphology and directional valve orientation.`;
        suggestions = ["Explain pressure gradient", "Trace flow to next valve", "Test my knowledge"];
      } else {
        explanation = `Here is the **${targetLandmark.replace(/-/g, " ")}** highlighted on our whiteboard!\n\nThis is where the journey begins. Think of it like the reception area welcoming incoming flow before pumping it forward. Let's see what connects to it next!`;
        suggestions = ["Where does it pump next?", "Show me the valve", "Quiz me on this"];
      }
    } else if (nextStage === "CHECKPOINT") {
      const landmark = state.coveredLandmarks[state.coveredLandmarks.length - 1] || "the highlighted structure";
      explanation = `Quick checkpoint! We've examined **${landmark.replace(/-/g, " ")}**.\n\nWhy is it essential that this chamber maintains a separate, one-way directional gate rather than open diffusion? Give it your best shot!`;
      suggestions = ["Prevents backflow", "Maintains pressure", "Give me a hint"];
    } else if (nextStage === "EVALUATE_AND_REMEDIATE") {
      const remediateLandmark = state.lastRemediatedElement || "septum";
      actions.push({ type: "circle", elementId: remediateLandmark });
      explanation = `That's a very common intuition, but let's look at the anatomical reality!\n\nNotice the circled partition (**${remediateLandmark.replace(/-/g, " ")}**). It physically divides the left and right halves to guarantee that high-pressure oxygenated flow never mixes with deoxygenated venous return. See how clean the separation is?`;
      suggestions = ["I see it now", "Trace the full loop", "Ask me another question"];
    } else if (nextStage === "SYNTHESIS") {
      explanation = `Excellent work! You've navigated through all core structures of **${topic}**.\n\nEvery component—from inflow, directional valve gating, ventricular pressurization, to systemic distribution—operates in precise coordination. Would you like to review the formulas or tackle a final practice challenge?`;
      suggestions = ["Review key formulas", "Start practice challenge", "Explore related topic"];
    } else {
      explanation = `Welcome! Today we are studying **${topic}**.\n\nI have pre-rendered the high-resolution interactive diagram on the board. Let's inspect each structure one by one. Where would you like to start?`;
      suggestions = context?.suggestedPrompts?.slice(0, 3) || ["Start at the beginning", "Show blood flow", "Explain simply"];
    }

    const cleanMsg = message.trim();
    const isQuestion = /\?$/.test(cleanMsg) || /^(where|what|how|why|which|can|is|tell me|explain)/i.test(cleanMsg);
    if (isQuestion && !explanation.startsWith("You asked:") && !explanation.startsWith("आपने पूछा:") && !explanation.startsWith("Aapne poocha:")) {
      const ack = isHi
        ? `आपने पूछा: "${cleanMsg}"। `
        : isHinglish
        ? `Aapne poocha: "${cleanMsg}". `
        : `You asked: "${cleanMsg}". `;
      explanation = `${ack}${explanation}`;
    }

    return { explanation, actions, suggestions };
  }
}
