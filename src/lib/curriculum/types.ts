import type { BoardMark, BoardPage, SessionData } from "../types";
import type { AssetCanvasMap } from "../canvas-intelligence/types";

export type StudentLevel = "beginner" | "intermediate" | "advanced";

export interface CurriculumTopic {
  id: string;
  title: string;
  description: string;
  assetKey: string | null;
  learningObjectives: string[];
  mandatoryConcepts: string[];
  defaultLevel: StudentLevel;
  keyLandmarks: string[];
  formulas?: string[];
  misconceptions?: string[];
  suggestedPrompts: string[];
}

export interface CurriculumChapter {
  id: string;
  title: string;
  description: string;
  topics: CurriculumTopic[];
}

export interface CurriculumSubject {
  id: string;
  name: string;
  icon: string;
  description: string;
  color: "purple" | "blue" | "green" | "orange";
  chapters: CurriculumChapter[];
}

export interface ClassroomContext {
  subject: string;
  subjectId: string;
  chapter: string;
  chapterId: string;
  topic: string;
  topicId: string;
  studentLevel: StudentLevel;
  learningObjectives: string[];
  mandatoryConcepts: string[];
  assetKey: string | null;
  assetTitle?: string;
  keyLandmarks: string[];
  formulas: string[];
  misconceptions: string[];
  suggestedPrompts: string[];
  preparedAt: string;
}

export interface PreparationRequest {
  subjectId?: string;
  chapterId?: string;
  topicId?: string;
  topic?: string;
  studentLevel?: StudentLevel;
}

export interface PreparationResult {
  sessionData: SessionData;
  classroomContext: ClassroomContext;
  assetMap?: AssetCanvasMap;
}
