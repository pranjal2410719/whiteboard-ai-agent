import scripts from "./class-scripts.json";
import { MAX_LECTURE_SECONDS, type BoardMark, type BoardPage, type LessonCue } from "./types";

export type RecordedClassKey = keyof typeof scripts;
export type StudyNotes = { notes: { title: string; text: string; equation: string }[]; mistake: string; practice: { question: string; answer: string } };
export type RecordedClass = { key: RecordedClassKey; title: string; summary: string; focus: string; audio: string; totalSeconds: number; scenes: BoardPage[]; notes: StudyNotes };
export const RECORDED_CLASS_EDITION = 2;
export function isRecordedClassKey(value: string): value is RecordedClassKey { return Object.hasOwn(scripts, value); }
export function recordingPageKey(key: RecordedClassKey, chapter: number) { return `${key}-${chapter + 1}`; }
export function recordedClassAudio(key: RecordedClassKey) { return `/class-audio/${key}-v${RECORDED_CLASS_EDITION}.mp3`; }

const ink = "#293b32", green = "#3b805c", blue = "#507aaf", orange = "#ad6a3a", purple = "#8868a0", mint = "#e9f4e8", sky = "#e7eef9", lilac = "#f0eafa", cream = "#fcf1dc";
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
const box = (x: number, y: number, w: number, h: number, fill: string, color = green): BoardMark => ({ type: "rect", x, y, w, h, fill, color, strokeWidth: 2 });
const dot = (x: number, y: number, w: number, h: number, fill: string, color = green): BoardMark => ({ type: "ellipse", x, y, w, h, fill, color, strokeWidth: 2.2 });
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
const highlight = penHighlight;
const arrow = (x1: number, y1: number, x2: number, y2: number, color = green): BoardMark => {
  const angle = Math.atan2(y2 - y1, x2 - x1), t = (a: number) => Math.round(a * 10) / 10;
  return line(`M${x1} ${y1} L${x2} ${y2} M${t(x2 - 12 * Math.cos(angle - .46))} ${t(y2 - 12 * Math.sin(angle - .46))} L${x2} ${y2} L${t(x2 - 12 * Math.cos(angle + .46))} ${t(y2 - 12 * Math.sin(angle + .46))}`, color, 2.8);
};
const triangle = () => [line("M608 89 L608 245 L853 245 Z", "#486747", 3, mint), line("M609 225 L629 225 L629 245", "#547351", 2.1), txt(639, 234, "90°", 20, green)];
const labels = (a: string, b: string, c: string) => [txt(552, 175, a, 31, purple), txt(703, 278, b, 31, blue), txt(749, 150, c, 31, orange)];
const segments = (y: number, count: number, filled: number, fill = mint, offset = 0): BoardMark[] => Array.from({ length: count }, (_, i) => box(568 + i * (304 / count), y, 304 / count, 40, i >= offset && i < offset + filled ? fill : "#fbfcf6", "#75936e"));
const cloud = () => line("M665 118 Q633 118 640 96 Q648 79 668 85 Q675 56 698 76 Q710 47 738 59 Q760 67 761 83 Q787 72 803 90 Q829 120 797 120 Z", "#7b91a1", 2.6, "#e9f0f5");
const water = (y: number): BoardMark => line(`M562 ${y} Q585 ${y - 12} 611 ${y} T660 ${y} T710 ${y} L710 ${y + 21} L562 ${y + 21} Z`, blue, 2.4, "#dfedf5");
const scale = () => [line("M552 123 L881 123 M718 124 L718 241 M661 243 L775 243", green, 3), line("M596 124 L554 205 L641 205 Z M840 124 L796 205 L887 205 Z", "#80a27d", 2.5, mint)];
const heartImg = (): BoardMark => ({ type: "image", src: "/assets/human-heart_med-removebg-preview.png", x: 580, y: 16, w: 270, h: 298, alt: "Human Heart Anatomy and Blood Circulation" });
const cellImg = (): BoardMark => ({ type: "image", src: "/assets/human_cell_diagram.png", x: 610, y: 14, w: 232, h: 310, alt: "The Human Cell Anatomy" });

type Boards = BoardMark[][][];
const diagrams: Record<RecordedClassKey, Boards> = {
  pythagoras: [
    [
      [...head("Read the triangle"), txt(55, 119, "Find the square corner first."), ...triangle()],
      [txt(55, 166, "a and b: the two legs", 27, purple), txt(55, 205, "c: opposite the right angle", 27, orange), ...labels("a", "b", "c"), arrow(842, 89, 759, 132, orange), txt(803, 82, "hypotenuse", 24, orange)],
      [...highlight(55, 235, 290, "a² + b² = c²", 39), txt(592, 312, "leg square areas = hypotenuse area", 23, green)],
    ],
    [
      [...head("Find the ladder length"), txt(55, 112, "Wall: 4 m   ·   Ground: 3 m", 28), ...triangle(), ...labels("4 m", "3 m", "c")],
      [txt(55, 160, "3² = 9 m²", 30, blue), txt(232, 160, "4² = 16 m²", 30, purple), txt(55, 205, "c² = 9 + 16 = 25 m²", 31)],
      [...highlight(55, 230, 295, "c = √25 = 5 m", 37), txt(804, 128, "5 m", 26, green), txt(580, 314, "The ladder is a length, not an area.", 23, green)],
    ],
    [
      [...head("Try six and eight", 344), txt(55, 121, "The legs are 6 m and 8 m.", 30), txt(55, 160, "What is the diagonal?", 29, blue), ...triangle(), ...labels("6 m", "8 m", "?")],
      [],
      [txt(55, 201, "6² + 8² = 36 + 64 = 100", 29, blue), ...highlight(55, 222, 298, "c = √100 = 10 m", 35)],
      [txt(787, 143, "10 m", 31, green), txt(57, 308, "Check: 10² = 100", 24, green), txt(575, 314, "3, 4, 5 → 6, 8, 10: double every side", 22, blue)],
    ],
    [
      [...head("Use the rule again", 385), txt(56, 118, "1. Check for a right angle.", 29), ...triangle(), ...labels("a", "b", "c")],
      [txt(56, 168, "2. Add squares to find c.", 29), txt(56, 211, "Missing a leg? Subtract squares.", 27, purple), txt(568, 311, "Missing leg: b² = c² − a²", 27, purple)],
      [...highlight(55, 238, 374, "3. Square root → side length", 32), txt(56, 308, "Check that c is longest.", 24, green)],
    ],
  ],
  fractions: [
    [
      [...head("Name the equal parts", 396), txt(55, 119, "One bar = one whole", 31), txt(575, 92, "Four equal pieces", 30, purple), ...segments(117, 4, 0)],
      [txt(55, 169, "Denominator → all equal parts", 28, purple), txt(55, 216, "Numerator → selected parts", 28, blue), ...[0, 1, 2, 3].map(i => txt(590 + i * 76, 194, "¼", 29, purple))],
      [...segments(117, 4, 3), ...highlight(55, 243, 356, "3 of 4 equal pieces = ¾", 33), txt(574, 250, "3 shaded · 1 unshaded", 29, green)],
    ],
    [
      [...head("Add unlike fractions", 405), txt(55, 125, "½ + ¼ = ?", 42), txt(55, 181, "First, make the pieces match.", 27), txt(572, 98, "One half", 28, blue), ...segments(112, 2, 1, sky)],
      [txt(572, 198, "Two quarters", 28, purple), ...segments(211, 4, 2, lilac), line("M720 105 L720 263", purple, 2, "none", true), txt(55, 220, "½ is the same length as 2/4.", 29, purple)],
      [...highlight(55, 244, 352, "2/4 + 1/4 = 3/4", 38), ...segments(211, 4, 1, mint, 2).slice(2, 3), txt(573, 289, "Three equal quarters in all.", 26, green)],
    ],
    [
      [...head("Try adding eighths", 380), txt(55, 119, "3/8 + 1/4 = ?", 40), txt(55, 172, "How many eighths make ¼?", 29, purple), txt(571, 104, "The same whole, in eighths", 28, purple), ...segments(123, 8, 3, sky)],
      [],
      [txt(55, 215, "1/4 = 2/8", 33, purple), txt(570, 221, "Two more pieces = one quarter", 25, purple), ...segments(123, 8, 2, lilac, 3).slice(3, 5)],
      [...highlight(55, 240, 356, "3/8 + 2/8 = 5/8", 36), txt(568, 276, "Count five shaded boxes.", 29, green), line("M571 178 L756 178", green, 3)],
    ],
    [
      [...head("Check the size", 300), txt(55, 121, "1. Start with the same whole.", 28), txt(571, 100, "Two bars of equal length", 27, purple), ...segments(115, 8, 4, sky)],
      [txt(55, 174, "2. Match the piece sizes.", 28), txt(55, 221, "3. Add only the top numbers.", 27), ...segments(195, 8, 5, mint)],
      [...highlight(55, 243, 374, "4/8 < 5/8 < 8/8", 38), line("M720 103 L720 245", blue, 2, "none", true), txt(570, 285, "More than half, less than a whole", 24, green)],
    ],
  ],
  "human-cell": [
    [
      [...head("Inside the Human Cell", 380), txt(55, 120, "Flexible lipid bilayer membrane", 28), cellImg()],
      [
        txt(55, 172, "Cell membrane controls substance entry", 28, green),
        circle(726, 171, 98, 108, green, 2.8),
        arrow(850, 78, 804, 102, green),
        txt(855, 82, "Cell Membrane", 16, green, 650, "start"),
        circle(697, 116, 24, 20, blue, 2.8),
        arrow(576, 116, 668, 116, blue),
        txt(570, 121, "Cytoplasm (Cytosol)", 16, blue, 650, "end"),
        txt(55, 215, "Cytosol jelly supports all organelles", 27, blue),
      ],
      [
        ...penHighlight(55, 240, 360, "Dynamic animal cell structure", 32),
        txt(580, 312, "No rigid cell wall · highly flexible membrane.", 22, green),
      ],
    ],
    [
      [
        ...head("Nucleus & Powerhouses", 390),
        txt(55, 118, "Nucleus: master DNA instruction library", 28, purple),
        cellImg(),
        circle(726, 152, 38, 33, purple, 2.8),
        arrow(850, 152, 770, 152, purple),
        txt(855, 156, "Nucleus (DNA)", 16, purple, 650, "start"),
      ],
      [
        txt(55, 168, "Mitochondria produce ATP energy.", 28, orange),
        circle(676, 219, 32, 22, orange, 2.8, -25),
        arrow(576, 224, 638, 224, orange),
        txt(570, 229, "Mitochondria (ATP)", 16, orange, 650, "end"),
        txt(55, 212, "Cellular respiration: Glucose + O₂", 27, orange),
      ],
      [
        ...penHighlight(55, 240, 375, "Glucose + O₂ → ATP Energy", 33),
        txt(580, 312, "Folded cristae provide massive surface area.", 22, orange),
      ],
    ],
    [
      [
        ...head("Identify the protein factories", 440),
        txt(55, 120, "Ribbon-like channels around nucleus", 29),
        txt(55, 165, "Which organelle builds proteins?", 29, blue),
        cellImg(),
      ],
      [],
      [
        txt(55, 212, "Specks: Ribosomes · Highway: Rough ER", 30, purple),
        ...penHighlight(55, 238, 360, "Rough ER & Ribosomes", 36),
        circle(677, 156, 30, 42, purple, 2.8),
        arrow(576, 156, 642, 156, purple),
        txt(570, 161, "Rough ER & Ribosomes", 16, purple, 650, "end"),
      ],
      [
        circle(755, 114, 30, 24, green, 2.8),
        arrow(850, 114, 790, 114, green),
        txt(855, 119, "Golgi Apparatus", 16, green, 650, "start"),
        txt(580, 312, "Golgi sorts & packages proteins into vesicles.", 22, green),
      ],
    ],
    [
      [
        ...head("Organelle Symphony", 345),
        txt(55, 120, "1. Nucleus sends mRNA codes.", 28),
        cellImg(),
        circle(726, 152, 38, 33, purple, 2.8),
        arrow(850, 152, 770, 152, purple),
        txt(855, 156, "1. DNA instructions", 16, purple, 650, "start"),
      ],
      [
        txt(55, 172, "2. Ribosomes build proteins.", 28),
        txt(55, 215, "3. Mitochondria supply ATP fuel.", 28, orange),
        circle(676, 219, 32, 22, orange, 2.8, -25),
        arrow(576, 224, 638, 224, orange),
        txt(570, 229, "3. ATP fuel", 16, orange, 650, "end"),
        circle(677, 156, 30, 42, purple, 2.8),
        arrow(576, 156, 642, 156, purple),
        txt(570, 161, "2. Ribosomes (ER)", 16, purple, 650, "end"),
      ],
      [
        ...penHighlight(55, 245, 380, "Trillions of cells, one system.", 31),
        txt(580, 312, "Explore study notes for plant comparison.", 22, green),
      ],
    ],
  ],
  "heart-diagram": [
    [
      [...head("The Four Heart Chambers", 430), txt(55, 120, "Dual-pump muscular organ", 28), heartImg()],
      [
        txt(55, 172, "Atria: receiving chambers (top)", 28, purple),
        circle(654, 140, 32, 42, "#3b6cb5", 2.8),
        arrow(576, 140, 622, 140, "#3b6cb5"),
        txt(570, 145, "RA (Right Atrium)", 16, "#285294", 650, "end"),
        circle(744, 124, 32, 28, "#c0504d", 2.8),
        arrow(848, 124, 780, 124, "#c0504d"),
        txt(852, 129, "LA (Left Atrium)", 16, "#a83836", 650, "start"),
        txt(55, 215, "Right = deoxygenated · Left = oxygenated", 26, blue),
      ],
      [
        circle(685, 222, 38, 28, "#3b6cb5", 2.8),
        arrow(576, 222, 644, 222, "#3b6cb5"),
        txt(570, 227, "RV (Right Ventricle)", 16, "#285294", 650, "end"),
        circle(768, 202, 36, 40, "#c0504d", 2.8),
        arrow(848, 202, 806, 202, "#c0504d"),
        txt(852, 207, "LV (Left Ventricle)", 16, "#a83836", 650, "start"),
        ...penHighlight(55, 240, 360, "Four chambers: RA, RV, LA, LV", 32),
        txt(580, 312, "Left ventricle wall is 3× thicker than right.", 23, green),
      ],
    ],
    [
      [
        ...head("Pathway to the Lungs", 410),
        txt(55, 120, "Deoxygenated blood returns from body", 28),
        heartImg(),
        circle(649, 63, 26, 27, "#3b6cb5", 2.8),
        arrow(576, 63, 621, 63, "#3b6cb5"),
        txt(570, 68, "SVC (Superior Vena Cava)", 16, "#285294", 650, "end"),
        circle(642, 249, 23, 27, "#3b6cb5", 2.8),
        arrow(576, 249, 617, 249, "#3b6cb5"),
        txt(570, 254, "IVC (Inferior Vena Cava)", 16, "#285294", 650, "end"),
      ],
      [
        txt(55, 170, "Flows: Vena Cava → Right Atrium", 28, blue),
        arrow(649, 86, 654, 132, "#3b6cb5"),
        circle(678, 192, 28, 20, "#3b805c", 2.8),
        arrow(576, 192, 648, 192, "#3b805c"),
        txt(570, 197, "Tricuspid Valve", 16, "#2b6846", 650, "end"),
        txt(55, 215, "Tricuspid valve prevents backflow.", 27, green),
      ],
      [
        arrow(676, 222, 706, 142, "#3b6cb5"),
        circle(735, 114, 38, 30, "#3b6cb5", 2.8),
        arrow(848, 114, 775, 114, "#3b6cb5"),
        txt(852, 119, "Pulmonary Artery (to lungs)", 16, "#285294", 650, "start"),
        ...penHighlight(55, 242, 380, "SVC/IVC → RA → RV → Lungs", 34),
        txt(580, 312, "Only artery carrying deoxygenated blood!", 23, blue),
      ],
    ],
    [
      [
        ...head("Systemic Flow to the Body", 420),
        txt(55, 120, "Oxygen-rich blood returns from lungs", 28),
        heartImg(),
        circle(796, 118, 30, 24, "#c0504d", 2.8),
        arrow(858, 118, 828, 118, "#c0504d"),
        txt(862, 123, "Pulmonary Veins", 16, "#a83836", 650, "start"),
      ],
      [
        txt(55, 168, "Which valve guards the left ventricle?", 28, purple),
        circle(761, 160, 24, 18, "#d97706", 2.8),
        txt(757, 166, "?", 24, "#d97706", 700),
      ],
      [
        txt(55, 212, "Bicuspid (Mitral) valve opens into LV.", 28, orange),
        circle(761, 160, 26, 18, "#d97706", 2.8),
        arrow(848, 160, 790, 160, "#d97706"),
        txt(852, 165, "Bicuspid (Mitral) Valve", 16, "#b45309", 650, "start"),
        arrow(748, 128, 764, 188, "#c0504d"),
      ],
      [
        circle(707, 65, 42, 36, "#c0504d", 2.8),
        arrow(848, 65, 752, 65, "#c0504d"),
        txt(852, 70, "Aorta (Systemic Arch)", 16, "#a83836", 650, "start"),
        arrow(766, 192, 712, 75, "#c0504d"),
        ...penHighlight(55, 242, 385, "Pulm. Veins → LA → LV → Aorta", 34),
        txt(580, 312, "Delivers high-pressure blood to whole body.", 23, "#c0504d"),
      ],
    ],
    [
      [
        ...head("Double Circulation Summary", 435),
        txt(55, 120, "1. Pulmonary circuit (low pressure)", 28, blue),
        heartImg(),
        circle(714, 224, 22, 34, "#3b805c", 2.8),
        arrow(848, 244, 740, 244, "#3b805c"),
        txt(852, 249, "Interventricular Septum", 16, "#2b6846", 650, "start"),
      ],
      [
        txt(55, 172, "2. Systemic circuit (high pressure)", 28, "#c0504d"),
        txt(55, 215, "Septum prevents mixing of blood.", 27, green),
        line("M714 192 L714 257", "#3b805c", 2.8, "none", true),
      ],
      [
        ...penHighlight(55, 245, 380, "Right = Lungs · Left = Body", 35),
        txt(580, 312, "Check study notes to master cardiac cycle.", 23, green),
      ],
    ],
  ],
};

export function recordedClass(key: RecordedClassKey): RecordedClass {
  const script = scripts[key];
  const scenes = script.chapters.map((chapter, index): BoardPage => {
    let seconds = 0;
    const marks: BoardMark[] = [];
    const cues = chapter.cues.map((cue, i): LessonCue => {
      const from = seconds, firstMark = marks.length;
      marks.push(...diagrams[key][index][i]);
      seconds += cue.seconds;
      return { from, to: seconds, firstMark, endMark: marks.length, text: cue.text, ...("hold" in cue ? { hold: true } : {}) };
    });
    return { id: recordingPageKey(key, index), title: chapter.title, seconds, marks, cues, narration: chapter.cues.map(c => c.text).join(" "), ink: [], cursor: { x: 852, y: 250 } };
  });
  return { key, title: script.title, summary: script.summary, focus: script.focus, audio: recordedClassAudio(key), totalSeconds: MAX_LECTURE_SECONDS,
    scenes, notes: { notes: script.notes, mistake: script.mistake, practice: script.practice } };
}

export function drawingAtCue(cues: LessonCue[], elapsedSeconds: number) {
  const seconds = Math.max(0, elapsedSeconds);
  const cue = cues.find(item => item.to > seconds) ?? cues[cues.length - 1];
  if (!cue) return { caption: "", markProgress: 0, holding: false };
  const local = Math.max(0, seconds - cue.from);
  // Draw synchronously alongside spoken narration throughout each cue sentence.
  const writing = Math.min(1, local / Math.max(0.5, (cue.to - cue.from) * 0.90));
  return { caption: cue.text, markProgress: cue.firstMark + (cue.endMark - cue.firstMark) * writing, holding: cue.hold === true };
}
