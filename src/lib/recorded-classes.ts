import scripts from "./class-scripts.json";
import { MAX_LECTURE_SECONDS, type BoardMark, type BoardPage, type LessonCue } from "./types";
import { getClass, trigSceneBoards } from "@/classes";

export type RecordedClassKey = keyof typeof scripts;
export type StudyNotes = { notes: { title: string; text: string; equation: string }[]; mistake: string; practice: { question: string; answer: string } };
export type RecordedClass = { key: RecordedClassKey; title: string; summary: string; focus: string; audio: string; totalSeconds: number; scenes: BoardPage[]; notes: StudyNotes };
export const RECORDED_CLASS_EDITION = 2;
export function isRecordedClassKey(value: string): value is RecordedClassKey { return Object.hasOwn(scripts, value); }
export function recordingPageKey(key: RecordedClassKey, chapter: number) { return `${key}-${chapter + 1}`; }
export function recordedClassAudio(key: RecordedClassKey) { return `/class-audio/${key}-v${RECORDED_CLASS_EDITION}.mp3`; }

const ink = "#293b32", green = "#3b805c", blue = "#507aaf", orange = "#ad6a3a", purple = "#8868a0";
const txt = (x: number, y: number, text: string, size = 28, color = ink, weight = 550, textAnchor?: "start" | "middle" | "end"): BoardMark => ({
  type: "text",
  x,
  y,
  text,
  size,
  color,
  weight,
  ...(textAnchor ? { textAnchor } : {}),
});
const line = (d: string, color = green, strokeWidth = 2.5, fill = "none", dashed = false): BoardMark => ({ type: "path", d, color, strokeWidth, fill, dashed });
const circle = (cx: number, cy: number, rx: number, ry: number, color = green, strokeWidth = 2.8, rotate = -3): BoardMark => ({
  type: "ellipse",
  x: cx,
  y: cy,
  w: rx,
  h: ry,
  fill: "none",
  color,
  strokeWidth,
  rotate,
});
const head = (text: string, right = 420): BoardMark[] => [txt(52, 54, text, 40, ink, 650), line(`M54 67 Q${Math.round(right * .56)} 63 ${right} 66`, "#8bb299", 3.4)];
const penHighlight = (x: number, y: number, width: number, value: string, size = 33, color = "#f7dc6f"): BoardMark[] => {
  const strokeY = y + 25;
  return [
    {
      type: "path",
      d: `M${x + 8} ${strokeY} L${x + width - 8} ${strokeY}`,
      color,
      fill: "none",
      strokeWidth: 32,
      opacity: 0.35,
    },
    txt(x + 12, y + 34, value, size, "#1e3d29", 650),
  ];
};
const arrow = (x1: number, y1: number, x2: number, y2: number, color = green): BoardMark => {
  const angle = Math.atan2(y2 - y1, x2 - x1), t = (a: number) => Math.round(a * 10) / 10;
  return line(`M${x1} ${y1} L${x2} ${y2} M${t(x2 - 12 * Math.cos(angle - .46))} ${t(y2 - 12 * Math.sin(angle - .46))} L${x2} ${y2} L${t(x2 - 12 * Math.cos(angle + .46))} ${t(y2 - 12 * Math.sin(angle + .46))}`, color, 2.8);
};
const cellImg = (): BoardMark => ({ type: "image", src: "/assets/human_cell_diagram.png", x: 610, y: 14, w: 232, h: 310, alt: "The Human Cell Anatomy" });
const mitochondriaImg = (x = 590, y = 20, w = 260, h = 210): BoardMark => ({ type: "image", src: "/assets/Mitochondria.png", x, y, w, h, alt: "Mitochondria Structure & ATP Synthesis" });

type Boards = BoardMark[][][];
const diagrams: Record<RecordedClassKey, Boards> = {
  "human-cell": [
    [
      [
        ...head("Inside the Human Cell", 380),
        cellImg(),
        txt(55, 120, "Flexible lipid bilayer membrane", 28, green),
        txt(55, 168, "Cell membrane controls substance entry", 26, green),
        circle(725, 187, 96, 108, green, 2.8, -2),
        arrow(850, 88, 804, 112, green),
        txt(855, 92, "Cell Membrane", 16, green, 650, "start"),
      ],
      [
        txt(55, 210, "Cytosol jelly supports all organelles", 27, blue),
        circle(697, 116, 24, 20, blue, 2.8),
        arrow(576, 116, 668, 116, blue),
        txt(570, 121, "Cytoplasm (Cytosol)", 16, blue, 650, "end"),
      ],
      [
        ...penHighlight(55, 248, 360, "Dynamic human cell structure", 32),
        txt(55, 305, "Flexible membrane with no rigid cell wall", 24, green),
      ],
    ],
    [
      [
        ...head("Nucleus & Powerhouses", 390),
        { type: "image", src: "/assets/human_cell_diagram.png", x: 520, y: 20, w: 195, h: 260, alt: "The Human Cell Anatomy" },
        txt(55, 118, "Nucleus: master DNA instruction library", 28, purple),
        circle(618, 136, 33, 28, purple, 2.8),
        arrow(510, 136, 578, 136, purple),
        txt(505, 141, "Nucleus (DNA)", 16, purple, 650, "end"),
      ],
      [
        mitochondriaImg(735, 32, 225, 178),
        txt(55, 168, "Mitochondria produce ATP energy.", 28, orange),
        circle(575, 192, 25, 18, orange, 2.8, -25),
        arrow(605, 192, 730, 130, orange),
        txt(668, 150, "Zoom In", 15, orange, 600, "middle"),
        txt(55, 212, "Cellular respiration: Glucose + O₂", 27, orange),
      ],
      [
        circle(855, 122, 46, 26, orange, 2.6),
        arrow(955, 75, 902, 106, orange),
        txt(955, 72, "Folded Cristae", 15, orange, 650, "end"),
        ...penHighlight(55, 248, 375, "Glucose + O₂ → ATP Energy", 33),
        txt(55, 305, "Folded cristae maximize surface area", 24, orange),
      ],
    ],
    [
      [
        ...head("Identify the protein factories", 440),
        cellImg(),
        txt(55, 120, "Ribbon-like channels around nucleus", 29),
        txt(55, 165, "Which organelle builds proteins?", 29, blue),
      ],
      [],
      [
        txt(55, 212, "Specks: Ribosomes · Highway: Rough ER", 28, purple),
        circle(677, 156, 30, 42, purple, 2.8),
        arrow(576, 156, 642, 156, purple),
        txt(570, 161, "Rough ER & Ribosomes", 16, purple, 650, "end"),
        ...penHighlight(55, 245, 360, "Rough ER & Ribosomes", 34),
      ],
      [
        circle(755, 114, 30, 24, green, 2.8),
        arrow(850, 114, 790, 114, green),
        txt(855, 119, "Golgi Apparatus", 16, green, 650, "start"),
        txt(55, 290, "Golgi sorts & packages into vesicles", 24, green),
      ],
    ],
    [
      [
        ...head("Organelle Symphony", 345),
        cellImg(),
        txt(55, 118, "1. Nucleus sends mRNA codes.", 27, purple),
        circle(726, 152, 38, 33, purple, 2.8),
        arrow(850, 152, 770, 152, purple),
        txt(855, 156, "1. DNA instructions", 16, purple, 650, "start"),
      ],
      [
        txt(55, 160, "2. Ribosomes build proteins.", 27, blue),
        circle(677, 156, 30, 42, purple, 2.8),
        arrow(576, 156, 642, 156, purple),
        txt(570, 161, "2. Ribosomes (ER)", 16, purple, 650, "end"),
        txt(55, 202, "3. Mitochondria supply ATP fuel.", 27, orange),
        circle(676, 219, 32, 22, orange, 2.8, -25),
        arrow(576, 224, 638, 224, orange),
        txt(570, 229, "3. ATP fuel", 16, orange, 650, "end"),
      ],
      [
        ...penHighlight(55, 245, 380, "Trillions of cells, one system.", 31),
        txt(55, 305, "Explore study notes & ask any doubt.", 23, green),
      ],
    ],
  ],
  "trigonometry": trigSceneBoards,
};

export function recordedClass(key: string = "human-cell"): RecordedClass {
  const safeKey: RecordedClassKey = isRecordedClassKey(key) ? key : "human-cell";
  const cls = getClass(safeKey);
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
  return { key: safeKey, title: script.title, summary: script.summary, focus: script.focus, audio: recordedClassAudio(safeKey), totalSeconds,
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
