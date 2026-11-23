import type { BoardMark, BoardPage, DiagramRegion, LessonCue } from "@/lib/types";

export type ClassKey = "human-cell" | "trigonometry";

export type ClassMetadata = {
  key: ClassKey;
  title: string;
  subject: string;
  grade: string;
  durationMinutes: number;
  totalSeconds: number;
  summary: string;
  focus: string;
  prompts: string[];
  audioPath: string;
  assetFolder: string;
};

export type ClassNotes = {
  notes: { title: string; text: string; equation: string }[];
  mistake: string;
  practice: { question: string; answer: string };
};

export type ClassChapter = {
  title: string;
  start?: number;
  end?: number;
  cues: { seconds: number; text: string; hold?: boolean }[];
};

export type ClassScript = {
  title: string;
  summary: string;
  focus: string;
  chapters: ClassChapter[];
  notes: { title: string; text: string; equation: string }[];
  mistake: string;
  practice: { question: string; answer: string };
};

export type ClassDefinition = {
  metadata: ClassMetadata;
  script: ClassScript;
  initialBoard: BoardPage;
  scenes: BoardPage[];
  regions?: DiagramRegion[];
  notes: ClassNotes;
};
