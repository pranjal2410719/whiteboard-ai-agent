import type { BoardMark } from "../types";
import type { FlowchartNodeDef, FlowchartEdgeDef } from "../spatial/types";

export type PedagogyStage =
  | "INTRODUCE"
  | "VISUAL_DEMO"
  | "CHECKPOINT"
  | "EVALUATE_AND_REMEDIATE"
  | "SYNTHESIS";

export type TeachingPersona = "socratic" | "mentor" | "professor" | "peer";

export interface TeachingAction {
  type: "highlight" | "circle" | "arrow" | "label" | "annotate" | "clear_highlights" | "flowchart";
  elementId?: string;
  toElementId?: string;
  text?: string;
  color?: string;
  flowchartNodes?: FlowchartNodeDef[];
  flowchartEdges?: FlowchartEdgeDef[];
}

export interface PedagogyState {
  stage: PedagogyStage;
  persona: TeachingPersona;
  turnCount: number;
  coveredLandmarks: string[];
  uncoveredLandmarks: string[];
  studentUnderstandingScore: number; // 0.0 to 1.0
  activeMisconceptions: string[];
  lastQuestionAsked?: string;
  lastRemediatedElement?: string;
}

export interface PedagogyEvaluation {
  isCorrect: boolean;
  confidence: number;
  misconceptionDetected?: string;
  recommendedNextStage: PedagogyStage;
  recommendedActions: TeachingAction[];
  feedbackNotes: string;
}

export interface TeachingTurnResult {
  narrationText: string;
  actions: TeachingAction[];
  generatedMarks: BoardMark[];
  nextState: PedagogyState;
  suggestedPrompts: string[];
}
