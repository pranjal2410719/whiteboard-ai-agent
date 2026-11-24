import scripts from "./class-scripts.json";
import { MAX_LECTURE_SECONDS, type BoardMark, type BoardPage, type LessonCue, type SupportedLanguage } from "./types";
import { getClass, cellSceneBoards, trigSceneBoards } from "@/classes";

export type RecordedClassKey = keyof typeof scripts;
export type StudyNotes = { notes: { title: string; text: string; equation: string }[]; mistake: string; practice: { question: string; answer: string } };
export type RecordedClass = { key: RecordedClassKey; title: string; summary: string; focus: string; audio: string; totalSeconds: number; scenes: BoardPage[]; notes: StudyNotes };
export const RECORDED_CLASS_EDITION = 2;
export function isRecordedClassKey(value: string): value is RecordedClassKey { return Object.hasOwn(scripts, value); }
export function recordingPageKey(key: RecordedClassKey, chapter: number) { return `${key}-${chapter + 1}`; }

const MULTILINGUAL_CLASSES = new Set<string>(["human-cell", "trigonometry"]);

export function recordedClassAudio(key: RecordedClassKey, language: SupportedLanguage = "en") {
  if (MULTILINGUAL_CLASSES.has(key)) {
    if (language === "hi") return `/class-audio/${key}-hi.mp3`;
    if (language === "hinglish") return `/class-audio/${key}-hinglish.mp3`;
  }
  return `/class-audio/${key}-v${RECORDED_CLASS_EDITION}.mp3`;
}

type Boards = BoardMark[][][];
const diagrams: Record<RecordedClassKey, Boards> = {
  "human-cell": cellSceneBoards,
  "trigonometry": trigSceneBoards,
};

export function recordedClass(key: string = "human-cell", language: SupportedLanguage = "en"): RecordedClass {
  const safeKey: RecordedClassKey = isRecordedClassKey(key) ? key : "human-cell";
  const cls = getClass(safeKey, language);
  if (cls) {
    const totalSeconds = cls.scenes.reduce((sum, s) => sum + (s.seconds || 0), 0) || MAX_LECTURE_SECONDS;
    return {
      key: safeKey,
      title: cls.metadata.title,
      summary: cls.metadata.summary,
      focus: cls.metadata.focus,
      audio: cls.metadata.audioPath,
      totalSeconds,
      scenes: cls.scenes,
      notes: cls.notes,
    };
  }
  const script = scripts[safeKey];
  const scenes = script.chapters.map((chapter, index): BoardPage => {
    let seconds = 0;
    const marks: BoardMark[] = [];
    const cues = chapter.cues.map((cue, i): LessonCue => {
      const from = seconds, firstMark = marks.length;
      marks.push(...diagrams[safeKey][index][i]);
      seconds += cue.seconds;
      return { from, to: seconds, firstMark, endMark: marks.length, text: cue.text, ...("hold" in cue ? { hold: true } : {}) };
    });
    return { id: recordingPageKey(safeKey, index), title: chapter.title, seconds, marks, cues, narration: chapter.cues.map(c => c.text).join(" "), ink: [], cursor: { x: 852, y: 250 } };
  });
  const totalSeconds = scenes.reduce((sum, s) => sum + (s.seconds || 0), 0) || MAX_LECTURE_SECONDS;
  return { key: safeKey, title: script.title, summary: script.summary, focus: script.focus, audio: recordedClassAudio(safeKey, language), totalSeconds,
    scenes, notes: { notes: script.notes, mistake: script.mistake, practice: script.practice } };
}

export function drawingAtCue(cues: LessonCue[], elapsedSeconds: number) {
  const seconds = Math.max(0, elapsedSeconds);
  const cue = cues.find(item => item.to > seconds) ?? cues[cues.length - 1];
  if (!cue) return { caption: "", markProgress: 0, holding: false };
  const local = Math.max(0, seconds - cue.from);
  const rawWriting = Math.min(1, local / Math.max(0.5, (cue.to - cue.from) * 0.90));
  const writing = rawWriting < 1 ? rawWriting * rawWriting * (3 - 2 * rawWriting) : 1;
  return { caption: cue.text, markProgress: cue.firstMark + (cue.endMark - cue.firstMark) * writing, holding: cue.hold === true };
}
