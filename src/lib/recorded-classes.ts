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
  "water-cycle": [
    [
      [...head("From puddle to vapor", 405), txt(55, 124, "A puddle shrinks after a storm.", 28), dot(813, 88, 27, 27, "#fae4a4", "#bf9348"), line("M812 51 v-13 M849 87 h13 M839 61 l10 -9 M784 61 l-10 -9 M777 89 h-12", orange, 2), water(214)],
      [txt(55, 174, "Sunlight supplies energy.", 30, orange), arrow(606, 201, 615, 124, orange), arrow(650, 203, 671, 106, orange), txt(566, 92, "invisible vapor", 27, orange)],
      [...highlight(55, 217, 377, "Liquid → gas: evaporation", 34), txt(55, 306, "It can happen without boiling.", 25, green), txt(567, 287, "Same water, a new state", 28, blue)],
    ],
    [
      [...head("Clouds, then rain", 347), txt(55, 117, "Rising moist air cools.", 31), ...highlight(55, 140, 368, "Gas → liquid: condensation", 30), arrow(602, 210, 643, 139, orange)],
      [txt(55, 230, "Clouds contain liquid or ice.", 26, purple), cloud(), ...[0, 1, 2, 3].map(i => dot(677 + i * 28, 97 - i % 2 * 10, 4, 4, sky, blue))],
      [txt(55, 281, "Larger drops fall: precipitation", 27, blue), ...[0, 1, 2, 3].map(i => arrow(674 + i * 43, 138, 658 + i * 43, 203 + i % 2 * 11, blue)), water(237), txt(734, 284, "gravity ↓", 27, blue)],
    ],
    [
      [...head("Mystery of a cold glass", 427), txt(55, 121, "Droplets appear on the outside.", 28), txt(55, 171, "Where did the water come from?", 28, purple), line("M650 72 L674 249 Q742 266 813 249 L837 72 Z", blue, 3, "#edf5fb"), line("M667 163 Q743 176 825 161", blue, 2.2), txt(704, 224, "cold water", 26, blue), dot(645, 187, 6, 10, sky, blue), dot(837, 162, 5, 8, sky, blue), dot(833, 204, 7, 11, sky, blue)],
      [],
      [arrow(572, 143, 642, 174, purple), txt(557, 118, "moist air", 25, purple), ...highlight(55, 217, 383, "Vapor → droplets: condensation", 29)],
      [txt(55, 305, "The glass isn’t leaking.", 26, green), arrow(852, 204, 841, 186, blue), txt(648, 300, "droplets form on the surface", 26, green)],
    ],
    [
      [...head("Follow the water home", 425), txt(55, 119, "Runoff flows downhill.", 31, blue), line("M555 159 L639 92 L719 189 Q770 205 892 210 L892 259 L555 259 Z", "#719271", 2.5, "#eaf3e1"), arrow(656, 138, 745, 214, blue), line("M751 222 Q804 212 896 227 L896 255 L751 255 Z", blue, 2.5, sky), txt(796, 288, "ocean", 27, blue)],
      [txt(55, 174, "Infiltration: water enters soil.", 28, purple), arrow(602, 166, 602, 232, purple), arrow(643, 172, 643, 238, purple), txt(553, 291, "into the ground", 24, purple)],
      [...highlight(55, 223, 366, "Sun lifts · gravity returns", 34), arrow(871, 196, 871, 111, orange), txt(748, 94, "evaporation again", 28, orange)],
    ],
  ],
  "linear-equations": [
    [
      [...head("What equality means", 415), txt(55, 122, "An equation is a balance.", 31), ...scale()],
      [txt(55, 177, "x + 3 = 7", 42, purple), txt(556, 104, "x + 3", 31, purple), txt(821, 104, "7", 31, orange), txt(55, 221, "Remove 3 from each side.", 29)],
      [...highlight(55, 241, 372, "x + 3 − 3 = 7 − 3", 32), txt(565, 291, "x = 4", 33, green), txt(733, 291, "still balanced", 25, green)],
    ],
    [
      [...head("Solve in two steps", 373), txt(55, 123, "2x + 3 = 11", 40), txt(55, 170, "Undo the outside step first.", 27, purple), txt(561, 99, "Undo +3", 30, purple), arrow(629, 110, 629, 147, purple)],
      [txt(55, 218, "2x + 3 − 3 = 11 − 3", 31), txt(558, 183, "2x = 8", 40), txt(686, 184, "subtract on both sides", 23, purple)],
      [...highlight(55, 239, 318, "x = 8 ÷ 2 = 4", 35), txt(558, 235, "Divide both sides by 2.", 28), txt(558, 283, "Check: 2(4) + 3 = 11", 28, green)],
    ],
    [
      [...head("Try the reverse operation", 455), txt(55, 123, "3x − 2 = 10", 41), txt(55, 172, "How do you undo −2?", 29, purple), txt(554, 108, "Keep both sides equal.", 29, purple), line("M559 125 L835 125", purple, 2)],
      [],
      [txt(55, 219, "3x − 2 + 2 = 10 + 2", 30), txt(557, 175, "3x = 12", 40, blue), ...highlight(55, 242, 308, "x = 12 ÷ 3 = 4", 36)],
      [txt(556, 219, "Divide both sides by 3.", 29), txt(556, 273, "Check: 3(4) − 2 = 10", 30, green)],
    ],
    [
      [...head("Remember the method", 425), txt(55, 128, "1. Read the operations on x.", 28), txt(567, 114, "+  ↔  −", 47, purple)],
      [txt(55, 184, "2. Undo in reverse order.", 28), txt(55, 226, "Apply each step to both sides.", 27), txt(567, 183, "×  ↔  ÷", 47, blue)],
      [...highlight(55, 247, 384, "3. Substitute into the original", 30), txt(567, 254, "Never divide by zero.", 27, green)],
    ],
  ],
  "gravity-friction": [
    [
      [...head("Gravity pulls all masses", 410), txt(55, 120, "Falling in a vacuum: same rate", 28), box(650, 100, 50, 50, mint, "#456b49"), arrow(675, 155, 675, 230, blue), txt(690, 195, "g = 9.8 m/s²", 26, blue)],
      [txt(55, 172, "Weight force: F_g = m · g", 31, purple), txt(55, 218, "5 kg block → 49 N downward", 28, purple), line("M550 250 L850 250", green, 4)],
      [box(650, 200, 50, 50, mint, "#456b49"), arrow(675, 200, 675, 130, green), txt(690, 150, "F_N = 49 N", 26, green), arrow(675, 250, 675, 320, blue), txt(690, 290, "F_g = 49 N", 26, blue), ...highlight(55, 240, 360, "F_N = F_g : Balanced at rest", 31)],
    ],
    [
      [...head("Friction resists the slide", 410), txt(55, 120, "Pulling sideways on the surface", 28), line("M550 240 L880 240", green, 3.5), box(640, 190, 65, 50, cream, orange), arrow(705, 215, 810, 215, orange), txt(735, 195, "F_pull →", 26, orange)],
      [arrow(640, 215, 555, 215, purple), txt(560, 195, "← friction", 26, purple), txt(55, 172, "Static friction grips while at rest.", 27, purple), txt(55, 215, "Kinetic friction resists sliding.", 27, purple), box(560, 275, 140, 42, sky, blue), line("M565 295 Q575 285 585 295 T605 295 T625 295 T645 295", blue, 2.5), txt(570, 310, "microscopic roughness", 21, blue)],
      [...highlight(55, 242, 345, "f_friction = μ · F_N", 36), txt(560, 258, "Rougher surface or heavier mass = more friction.", 24, green)],
    ],
    [
      [...head("Calculate the friction force", 435), txt(55, 120, "10 kg crate on floor with μ = 0.4", 29), txt(55, 165, "What is the friction force?", 29, blue), line("M570 230 L870 230", green, 3), box(670, 175, 75, 55, mint, green), txt(695, 210, "10 kg", 27, green)],
      [],
      [txt(55, 210, "F_N = 10 · 9.8 = 98 N", 31, purple), ...highlight(55, 235, 360, "f = 0.4 · 98 = 39.2 N", 35)],
      [txt(570, 275, "Push > 39.2 N to slide the crate.", 27, green), arrow(745, 202, 840, 202, orange), txt(765, 185, "> 39.2 N", 23, orange), arrow(670, 202, 590, 202, purple), txt(600, 185, "39.2 N", 23, purple)],
    ],
    [
      [...head("Forces in everyday life", 380), txt(55, 120, "1. Gravity acts at a distance.", 28), txt(575, 115, "Gravity: F_g = m · g", 28, blue)],
      [txt(55, 175, "2. Friction needs contact.", 28), txt(55, 218, "Lubricants & wheels reduce friction.", 27, purple), txt(575, 185, "Friction: f = μ · F_N", 28, purple)],
      [...highlight(55, 245, 380, "Balance forces to control motion.", 30), txt(575, 255, "Check study notes for inclined planes.", 23, green)],
    ],
  ],
  "human-cell": [
    [
      [...head("Inside the Human Cell", 380), txt(55, 120, "Flexible lipid bilayer membrane", 28), dot(740, 175, 165, 115, mint, "#3e6f47"), line("M575 175 C575 80 905 80 905 175 S575 270 575 175 Z", "#78a983", 1.8, "none", true), txt(750, 75, "Cell Membrane", 26, green)],
      [txt(55, 172, "Cytoplasm: water & nutrient jelly", 28, purple), txt(55, 215, "Supports all cellular organelles", 28, blue), txt(610, 140, "Cytoplasm", 26, purple), dot(625, 220, 12, 12, sky, blue), dot(840, 210, 14, 14, sky, blue)],
      [...highlight(55, 240, 360, "Dynamic animal cell structure", 32), txt(575, 310, "No rigid cell wall · highly flexible", 24, green)],
    ],
    [
      [...head("Nucleus & Powerhouses", 390), txt(55, 118, "Nucleus: master DNA instruction library", 28, purple), dot(740, 175, 165, 115, mint, "#3e6f47"), dot(690, 165, 46, 44, lilac, "#6b478f"), dot(685, 160, 16, 16, "#553275", "#3a1e54"), line("M668 152 Q678 178 702 165", "#7e52a8", 1.8), txt(640, 95, "Nucleus (DNA)", 27, purple)],
      [txt(55, 168, "Mitochondria produce ATP energy.", 28, orange), txt(55, 212, "Uses glucose and oxygen.", 28, orange), dot(820, 130, 32, 18, cream, "#c4752b"), line("M795 130 Q805 120 815 130 T835 130", "#c4752b", 2.2), dot(640, 230, 26, 15, cream, "#c4752b"), line("M620 230 Q630 222 640 230 T655 230", "#c4752b", 2), txt(815, 95, "Mitochondria", 26, orange)],
      [...highlight(55, 240, 375, "Glucose + O₂ → ATP Energy", 33), txt(575, 312, "Folded cristae provide massive surface area.", 23, orange)],
    ],
    [
      [...head("Identify the protein factories", 440), txt(55, 120, "Ribbon-like channels with dots", 29), txt(55, 165, "Which organelle builds proteins?", 29, blue), dot(740, 175, 165, 115, mint, "#3e6f47"), dot(690, 165, 46, 44, lilac, "#6b478f"), line("M715 130 C735 110 765 125 750 145", purple, 2.5), line("M725 145 C750 135 775 150 760 170", purple, 2.5)],
      [],
      [txt(55, 212, "Tiny dots: Ribosomes", 31, purple), ...highlight(55, 238, 360, "Rough ER & Ribosomes", 36), dot(732, 122, 2.5, 2.5, "#462166"), dot(745, 138, 2.5, 2.5, "#462166"), dot(758, 155, 2.5, 2.5, "#462166")],
      [txt(570, 265, "Golgi packages into vesicles.", 27, green), line("M795 210 Q825 215 815 235", green, 3), line("M800 225 Q830 230 820 250", green, 3), dot(835, 230, 4, 4, sky, blue), txt(790, 280, "Golgi Apparatus", 24, green)],
    ],
    [
      [...head("Organelle Symphony", 345), txt(55, 120, "1. Nucleus sends mRNA codes.", 28), txt(570, 110, "DNA instructions", 27, purple)],
      [txt(55, 172, "2. Ribosomes build proteins.", 28), txt(55, 215, "3. Mitochondria supply fuel.", 28), txt(570, 185, "Protein synthesis + ATP", 27, orange)],
      [...highlight(55, 245, 380, "Trillions of cells, one system.", 31), txt(570, 265, "Explore study notes for plant comparison.", 22, green)],
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
