export type Point = { x: number; y: number };

export type BoardMark = {
  type: "text" | "path" | "rect" | "ellipse";
  x?: number; y?: number; w?: number; h?: number;
  d?: string; text?: string; color?: string; fill?: string;
  size?: number; weight?: number; strokeWidth?: number;
  rotate?: number; dashed?: boolean; opacity?: number;
};

export type BoardPage = {
  id: string; title: string; marks: BoardMark[]; ink: BoardMark[]; cursor: Point;
  narration?: string; seconds?: number;
  cues?: LessonCue[];
};
export type LessonCue = { from: number; to: number; text: string; firstMark: number; endMark: number; hold?: boolean };
export type Lecture = { title: string; totalSeconds: number; startIndex: number; sceneCount: number };
export type ChatMessage = { role: "user" | "assistant"; content: string };
export type Quiz = { answer: string; explanation: string; hint: string };
export type SessionData = {
  title: string; subject: string; lessonKey: string;
  pages: BoardPage[]; pageIndex: number; messages: ChatMessage[];
  suggestions: string[]; saved: boolean; mode: "guided" | "llm"; quiz: Quiz | null;
  lecture?: Lecture | null;
  recordingInk?: Record<string, BoardMark[]>;
};
export const MAX_LECTURE_SECONDS = 120;
export type StudySession = {
  id: string; data: SessionData; createdAt: string; updatedAt: string;
};
export type TutorTurn = {
  explanation: string; page: BoardPage | null; pages?: BoardPage[]; lecture?: Lecture | null; suggestions: string[];
  quiz: Quiz | null; mode: "guided" | "llm"; title?: string; subject?: string;
};
export type Preferences = { name: string; paper: "dots" | "grid" | "plain"; narration: boolean };
export const defaultPreferences: Preferences = { name: "Alex Morgan", paper: "dots", narration: true };
export const starterSuggestions = ["Show me an example", "Explain it simply", "Quiz me"];
