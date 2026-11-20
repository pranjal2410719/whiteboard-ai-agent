export type Point = { x: number; y: number };

export type BoardMark = {
  type: "text" | "path" | "rect" | "ellipse" | "image";
  x?: number; y?: number; w?: number; h?: number;
  d?: string; text?: string; color?: string; fill?: string;
  size?: number; weight?: number; strokeWidth?: number;
  rotate?: number; dashed?: boolean; opacity?: number;
  src?: string; alt?: string;
  // Marks the tutor added to an existing diagram so they can be replaced or pruned.
  annotation?: boolean;
};

// A named area of a diagram on the board. Coordinates are board coordinates, so the
// tutor can point at a component without inventing geometry.
export type DiagramRegion = {
  id: string; label: string;
  x: number; y: number; w: number; h: number;
  aliases?: string[];
  note?: string;
};

export type BoardPage = {
  id: string; title: string; marks: BoardMark[]; ink: BoardMark[]; cursor: Point;
  narration?: string; seconds?: number;
  cues?: LessonCue[];
  regions?: DiagramRegion[];
};
export type LessonCue = { from: number; to: number; text: string; firstMark: number; endMark: number; hold?: boolean };
export type Lecture = { title: string; totalSeconds: number; startIndex: number; sceneCount: number };
export type LectureContext = { topic: string; chapter: number; chapterTitle?: string; timestamp: number; caption?: string };
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
export type SupportedLanguage = "en" | "hi" | "hinglish";
export type Preferences = { name: string; paper: "dots" | "grid" | "plain"; narration: boolean; language?: SupportedLanguage };
export const defaultPreferences: Preferences = { name: "Alex Morgan", paper: "dots", narration: true, language: "en" };
export const starterSuggestions = ["Show me an example", "Explain it simply", "Quiz me"];
export const localizedSuggestions: Record<SupportedLanguage, string[]> = {
  en: ["Show me an example", "Explain it simply", "Quiz me"],
  hi: ["एक उदाहरण दिखाएं", "सरल भाषा में समझाएं", "मुझसे सवाल पूछें"],
  hinglish: ["Ek example dikhao", "Simple bhasha me samjhao", "Mujhse quiz poocho"],
};
