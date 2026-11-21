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
const heartImg = (asset: "chambers" | "circulation" | "cycle" = "chambers"): BoardMark => {
  if (asset === "cycle") {
    return {
      type: "image",
      src: "/assets/heart/Cardiac_cycle.jpeg",
      x: 540,
      y: 40,
      w: 390,
      h: 226,
      alt: "Cardiac Cycle Three Stages",
    };
  }
  if (asset === "circulation") {
    return {
      type: "image",
      src: "/assets/heart/Double_circulation.png",
      x: 565,
      y: 25,
      w: 340,
      h: 270,
      alt: "Human Double Circulation Systemic and Pulmonary",
    };
  }
  return {
    type: "image",
    src: "/assets/heart/Demonstration_A_four_chambers.png",
    x: 550,
    y: 32,
    w: 360,
    h: 240,
    alt: "Human Heart Four Chambers and Valves",
  };
};
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
      [...head("The Heart Never Stops", 410), txt(55, 120, "Beats ~100,000 times every day, 24/7.", 28), heartImg("chambers")],
      [
        txt(55, 168, "How does it pump continuously?", 28, purple),
        txt(55, 205, "How does blood know where to go?", 28, blue),
        line("M55 240 L110 240 L120 215 L132 265 L144 210 L155 240 L240 240 M240 240 L295 240 L305 215 L317 265 L329 210 L340 240 L420 240", "#e74c3c", 3.2),
      ],
      [
        ...penHighlight(55, 255, 385, "4 Chambers · 4 Valves · 2 Loops", 33),
        txt(580, 312, "Inside the body's ultimate double pump.", 22, green),
      ],
    ],
    [
      [...head("The Four Heart Chambers", 430), txt(55, 118, "Atria (top) receive · Ventricles (bottom) pump", 28), heartImg("chambers")],
      [
        txt(55, 165, "Anatomical Right = Patient's Right", 27, blue),
        txt(55, 202, "Blue: Deoxygenated · Red: Oxygenated", 27, "#c0392b"),
        circle(645, 135, 28, 36, "#3b6cb5", 2.8),
        arrow(576, 135, 617, 135, "#3b6cb5"),
        txt(570, 140, "Right Atrium (RA)", 16, "#285294", 650, "end"),
        circle(675, 215, 34, 26, "#3b6cb5", 2.8),
        arrow(576, 215, 641, 215, "#3b6cb5"),
        txt(570, 220, "Right Ventricle (RV)", 16, "#285294", 650, "end"),
      ],
      [
        circle(755, 120, 28, 25, "#c0504d", 2.8),
        arrow(848, 120, 783, 120, "#c0504d"),
        txt(852, 125, "Left Atrium (LA)", 16, "#a83836", 650, "start"),
        circle(775, 195, 32, 38, "#c0504d", 2.8),
        arrow(848, 195, 807, 195, "#c0504d"),
        txt(852, 200, "Left Ventricle (LV)", 16, "#a83836", 650, "start"),
        ...penHighlight(55, 240, 365, "Atria receive · Ventricles pump", 33),
        txt(580, 312, "Four distinct receiving and pumping zones.", 22, green),
      ],
    ],
    [
      [...head("The Four One-Way Valves", 420), txt(55, 118, "One-way doors: prevent backward leakage", 28), heartImg("chambers")],
      [
        txt(55, 166, "1. Tricuspid: RA → RV", 27, "#27ae60"),
        circle(665, 185, 24, 18, "#27ae60", 2.8),
        arrow(576, 185, 641, 185, "#27ae60"),
        txt(570, 190, "Tricuspid Valve", 16, "#1e8449", 650, "end"),
        txt(55, 205, "2. Pulmonary: RV → Pulm. Artery", 27, "#2980b9"),
        circle(700, 140, 22, 18, "#2980b9", 2.8),
        arrow(848, 140, 722, 140, "#2980b9"),
        txt(852, 145, "Pulmonary Valve", 16, "#1f618d", 650, "start"),
      ],
      [
        txt(55, 244, "3. Mitral (Bicuspid): LA → LV", 27, "#d35400"),
        circle(755, 160, 24, 18, "#d35400", 2.8),
        arrow(848, 160, 779, 160, "#d35400"),
        txt(852, 165, "Mitral (Bicuspid)", 16, "#a04000", 650, "start"),
        txt(55, 283, "4. Aortic: LV → Aorta (Systemic)", 27, "#c0392b"),
        circle(720, 100, 22, 18, "#c0392b", 2.8),
        arrow(848, 100, 742, 100, "#c0392b"),
        txt(852, 105, "Aortic Valve", 16, "#922b21", 650, "start"),
        ...penHighlight(55, 315, 360, "Strict Unidirectional Flow", 30),
      ],
    ],
    [
      [...head("Pulmonary Circulation", 400), txt(55, 118, "Deoxygenated blood returns from tissues", 28), heartImg("circulation"), arrow(590, 80, 630, 110, "#3b6cb5")],
      [
        txt(55, 168, "Enters RA → Passes Tricuspid → RV", 28, blue),
        txt(55, 210, "RV pumps blood into Pulmonary Artery", 28, blue),
        arrow(660, 120, 700, 80, "#3b6cb5"),
      ],
      [
        ...penHighlight(55, 245, 385, "Heart → Lungs → Heart", 34),
        txt(55, 310, "Lungs release CO₂ waste and absorb O₂", 24, green),
        txt(580, 312, "Pulmonary artery: only deoxygenated artery!", 22, blue),
      ],
    ],
    [
      [...head("Systemic Circulation", 380), txt(55, 118, "Oxygen-rich blood returns from lungs", 28), heartImg("circulation"), arrow(760, 80, 730, 110, "#c0392b")],
      [
        txt(55, 168, "Enters LA → Mitral Valve → LV", 28, "#c0392b"),
        txt(55, 210, "LV wall is 3× thicker for high systemic pressure", 26, orange),
        arrow(710, 120, 680, 60, "#c0392b"),
      ],
      [
        ...penHighlight(55, 245, 385, "Heart → Body Tissues → Heart", 34),
        txt(55, 310, "Delivers fuel and oxygen from head to toe", 24, green),
        txt(580, 312, "Systemic circuit serves entire human body.", 22, "#c0392b"),
      ],
    ],
    [
      [...head("The Cardiac Cycle (0.8s)", 420), txt(55, 118, "One sequence of contraction & relaxation", 28), heartImg("cycle"), txt(55, 165, "Systole = Contraction · Diastole = Relaxation", 26, purple)],
      [
        txt(55, 205, "1. Atrial Systole (0.1s): atria push blood", 26, blue),
        txt(55, 240, "2. Ventricular Systole (0.3s): ventricles pump", 26, orange),
        txt(55, 275, "AV valves shut with 'LUB' sound", 24, "#27ae60"),
      ],
      [
        txt(55, 310, "3. Joint Diastole (0.4s): chambers refill ('DUB')", 26, green),
        ...penHighlight(55, 335, 370, "0.8s Cycle at 75 bpm", 28),
        txt(560, 312, "Atrial Systole → Ventric Systole → Diastole", 22, purple),
      ],
    ],
    [
      [...head("Quick Knowledge Check", 400), txt(55, 118, "Q1: Which chamber pumps blood to the whole body?", 26), txt(55, 150, "→ Correct: Left Ventricle (LV)", 26, "#c0392b", 650), heartImg("chambers")],
      [txt(55, 185, "Q2: Which circuit carries blood to the lungs?", 26), txt(55, 215, "→ Correct: Pulmonary Circulation", 26, blue, 650)],
      [txt(55, 248, "Q3: Which valve lies between LA and LV?", 26), txt(55, 278, "→ Correct: Mitral (Bicuspid) Valve", 26, orange, 650)],
      [txt(55, 308, "Q4: What are the 3 cardiac cycle stages?", 24), txt(55, 335, "→ Atrial Systole · Ventricular Systole · Joint Diastole", 23, green, 650)],
    ],
    [
      [...head("Double Circulation Summary", 430), txt(55, 118, "Four Chambers · One-Way Valves · Two Circuits", 28), heartImg("circulation")],
      [
        txt(55, 168, "Septum completely separates left and right sides", 27, green),
        txt(55, 208, "Challenge: trace body → lungs → body from memory!", 26, purple),
      ],
      [
        ...penHighlight(55, 245, 385, "Mastered: The Human Heart", 34),
        txt(55, 310, "See you in the next Qrie biology class!", 25, blue),
        txt(580, 312, "Double circulation mastered.", 22, green),
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
  const totalSeconds = scenes.reduce((sum, s) => sum + (s.seconds || 0), 0) || MAX_LECTURE_SECONDS;
  return { key, title: script.title, summary: script.summary, focus: script.focus, audio: recordedClassAudio(key), totalSeconds,
    scenes, notes: { notes: script.notes, mistake: script.mistake, practice: script.practice } };
}

export function drawingAtCue(cues: LessonCue[], elapsedSeconds: number) {
  const seconds = Math.max(0, elapsedSeconds);
  const cue = cues.find(item => item.to > seconds) ?? cues[cues.length - 1];
  if (!cue) return { caption: "", markProgress: 0, holding: false };
  const local = Math.max(0, seconds - cue.from);
  // Draw synchronously alongside spoken narration throughout each cue sentence.
  const rawWriting = Math.min(1, local / Math.max(0.5, (cue.to - cue.from) * 0.90));
  // Smoothstep Hermite easing (3t^2 - 2t^3) creates authentic human stroke acceleration and deceleration
  const writing = rawWriting < 1 ? rawWriting * rawWriting * (3 - 2 * rawWriting) : 1;
  return { caption: cue.text, markProgress: cue.firstMark + (cue.endMark - cue.firstMark) * writing, holding: cue.hold === true };
}
