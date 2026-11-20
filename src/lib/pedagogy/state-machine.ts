import type { ClassroomContext } from "../curriculum/types";
import { PersonaManager } from "./personas";
import type { PedagogyEvaluation, PedagogyStage, PedagogyState, TeachingAction, TeachingPersona } from "./types";

export class PedagogyStateMachine {
  /**
   * Initializes a fresh pedagogy state for a classroom context.
   */
  static initialState(context?: ClassroomContext, requestedPersona?: TeachingPersona): PedagogyState {
    const persona = requestedPersona || PersonaManager.resolveDefaultPersona(context?.studentLevel);
    const landmarks = context?.keyLandmarks ? [...context.keyLandmarks] : [];

    return {
      stage: "INTRODUCE",
      persona,
      turnCount: 0,
      coveredLandmarks: [],
      uncoveredLandmarks: landmarks,
      studentUnderstandingScore: 0.5,
      activeMisconceptions: [],
      lastQuestionAsked: undefined,
      lastRemediatedElement: undefined
    };
  }

  /**
   * Evaluates student message and determines pedagogical progression,
   * detecting misconceptions and recommending next visual teaching actions.
   */
  static evaluateStep(
    studentMessage: string,
    currentState: PedagogyState,
    context?: ClassroomContext
  ): PedagogyEvaluation {
    const text = studentMessage.toLowerCase().trim();

    // 1. Check for known misconceptions from curriculum context
    let detectedMisconception: string | undefined;
    if (context?.misconceptions) {
      for (const misc of context.misconceptions) {
        const lowerMisc = misc.toLowerCase();
        if (lowerMisc.includes("blue") && (text.includes("blue") || text.includes("blue blood"))) {
          detectedMisconception = misc;
          break;
        }
        if (lowerMisc.includes("used up") && (text.includes("used up") || text.includes("consumed"))) {
          detectedMisconception = misc;
          break;
        }
        if (lowerMisc.includes("vapor") && (text.includes("gas") || text.includes("steam"))) {
          detectedMisconception = misc;
          break;
        }
        if (lowerMisc.includes("normal force") && text.includes("always mg")) {
          detectedMisconception = misc;
          break;
        }
      }
    }

    // 2. Evaluate stage transition
    if (detectedMisconception) {
      const remedialActions: TeachingAction[] = [];
      if (currentState.lastQuestionAsked?.includes("ventricle") || detectedMisconception.includes("blood")) {
        remedialActions.push({ type: "circle", elementId: "septum" });
        remedialActions.push({ type: "highlight", elementId: "left-ventricle" });
      }

      return {
        isCorrect: false,
        confidence: 0.85,
        misconceptionDetected: detectedMisconception,
        recommendedNextStage: "EVALUATE_AND_REMEDIATE",
        recommendedActions: remedialActions,
        feedbackNotes: `Student showed misconception: ${detectedMisconception}. Provide targeted clarification and visual contrast.`
      };
    }

    // Determine correct understanding indicators
    const isAffirmative =
      text.includes("because") ||
      text.includes("pumps") ||
      text.includes("higher pressure") ||
      text.includes("systemic") ||
      text.includes("body") ||
      text.includes("lungs") ||
      text.includes("thicker") ||
      text.includes("resistance") ||
      text.includes("current") ||
      text.includes("voltage") ||
      text.includes("gravity") ||
      text.includes("normal") ||
      text.includes("right atrium") ||
      text.includes("left atrium") ||
      text.includes("correct") ||
      text.includes("yes");

    if (currentState.stage === "CHECKPOINT") {
      if (isAffirmative) {
        return {
          isCorrect: true,
          confidence: 0.9,
          recommendedNextStage: currentState.uncoveredLandmarks.length > 2 ? "VISUAL_DEMO" : "SYNTHESIS",
          recommendedActions: [],
          feedbackNotes: "Student answered checkpoint correctly. Advance to next visual landmark or synthesis."
        };
      } else {
        return {
          isCorrect: false,
          confidence: 0.6,
          recommendedNextStage: "EVALUATE_AND_REMEDIATE",
          recommendedActions: [{ type: "highlight", elementId: currentState.coveredLandmarks[currentState.coveredLandmarks.length - 1] }],
          feedbackNotes: "Student provided unclear or partial response. Provide hint and re-explain."
        };
      }
    }

    // Default progression from INTRODUCE or VISUAL_DEMO
    if (currentState.stage === "INTRODUCE") {
      return {
        isCorrect: true,
        confidence: 1.0,
        recommendedNextStage: "VISUAL_DEMO",
        recommendedActions: currentState.uncoveredLandmarks.length > 0
          ? [{ type: "highlight", elementId: currentState.uncoveredLandmarks[0] }]
          : [],
        feedbackNotes: "Introduction acknowledged. Proceed to visual demonstration."
      };
    }

    if (currentState.stage === "VISUAL_DEMO") {
      return {
        isCorrect: true,
        confidence: 1.0,
        recommendedNextStage: "CHECKPOINT",
        recommendedActions: [],
        feedbackNotes: "Visual demo delivered. Pose Socratic checkpoint question."
      };
    }

    return {
      isCorrect: true,
      confidence: 1.0,
      recommendedNextStage: currentState.uncoveredLandmarks.length === 0 ? "SYNTHESIS" : "VISUAL_DEMO",
      recommendedActions: [],
      feedbackNotes: "Proceed with classroom dialogue."
    };
  }

  /**
   * Advances the state machine to the next state after a teaching step.
   */
  static transition(
    currentState: PedagogyState,
    evaluation: PedagogyEvaluation,
    demonstratedElements: string[] = []
  ): PedagogyState {
    const covered = new Set(currentState.coveredLandmarks);
    demonstratedElements.forEach(elem => covered.add(elem));

    const uncovered = currentState.uncoveredLandmarks.filter(elem => !covered.has(elem));

    let score = currentState.studentUnderstandingScore;
    if (evaluation.isCorrect) {
      score = Math.min(1.0, score + 0.15);
    } else {
      score = Math.max(0.0, score - 0.2);
    }

    const misconceptions = [...currentState.activeMisconceptions];
    if (evaluation.misconceptionDetected && !misconceptions.includes(evaluation.misconceptionDetected)) {
      misconceptions.push(evaluation.misconceptionDetected);
    } else if (evaluation.isCorrect && misconceptions.length > 0) {
      misconceptions.pop();
    }

    return {
      stage: evaluation.recommendedNextStage,
      persona: currentState.persona,
      turnCount: currentState.turnCount + 1,
      coveredLandmarks: Array.from(covered),
      uncoveredLandmarks: uncovered,
      studentUnderstandingScore: Math.round(score * 100) / 100,
      activeMisconceptions: misconceptions,
      lastQuestionAsked: evaluation.recommendedNextStage === "CHECKPOINT" ? currentState.lastQuestionAsked : undefined,
      lastRemediatedElement: evaluation.recommendedActions[0]?.elementId || currentState.lastRemediatedElement
    };
  }
}
