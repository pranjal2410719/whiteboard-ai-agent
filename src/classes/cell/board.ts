import type { BoardMark, BoardPage, LessonCue } from "@/lib/types";
import { txt, line, box, circle, arrow, penHighlight, ink, green, blue, orange, purple } from "../helpers";
import { cellBoardRegions, CELL_BASE_LAYOUT } from "./intelligence";
import script from "./script.json";

// High-contrast educational pen palette
const RED     = "#e74c3c"; // Vibrant red: nucleus & DNA
const CRIMSON = "#c0392b"; // Deep crimson: nucleolus
const BLUE    = "#0984e3"; // Electric blue: cytoplasm & vesicles
const PURPLE  = "#8a6a9e"; // Purple: cell membrane & rough ER
const ORANGE  = "#d35400"; // Warm orange: mitochondria
const CYAN    = "#00d2d3"; // Electric cyan: smooth ER
const EMERALD = "#16a34a"; // Vivid emerald: Golgi apparatus
const ROSE    = "#ff2a7a"; // Rose pink: ribosomes

export const cellBaseImg = (
  x = CELL_BASE_LAYOUT.x,
  y = CELL_BASE_LAYOUT.y,
  w = CELL_BASE_LAYOUT.w,
  h = CELL_BASE_LAYOUT.h
): BoardMark => ({
  type: "image",
  src: "/assets/cell_diagram_base.png",
  x,
  y,
  w,
  h,
  alt: "Animal Cell Scientific Illustration",
});

// Common header bar for TOP region
const topHeader = (): BoardMark[] => [
  txt(45, 34, "ANIMAL CELL", 28, "#293b32", 750),
  line("M45 42 L240 42", PURPLE, 3.2),
  txt(295, 28, "The basic structural and functional unit of life", 15, "#507aaf", 600),
];

// Helper to create an annotation card
const card = (
  num: number,
  title: string,
  desc: string,
  x: number,
  y: number,
  accentColor: string,
  bgColor: string,
  w = 225,
  h = 50
): BoardMark[] => [
  box(x, y, w, h, bgColor, accentColor),
  txt(x + 10, y + 20, `${num}. ${title}`, 15, accentColor, 700),
  txt(x + 10, y + 38, desc, 12, "#293b32", 500),
];

// Standard Cards & Leaders
// LEFT REGION: Cards 1–4 (x: 45..270)
const card1 = () => card(1, "CELL MEMBRANE", "Controls what enters & leaves cell", 45, 56, PURPLE, "#faf5ff");
const leader1 = () => arrow(270, 81, 322, 95, PURPLE);

const card2 = () => card(2, "CYTOPLASM", "Jelly-like fluid housing organelles", 45, 114, BLUE, "#f0f9ff");
const leader2 = () => arrow(270, 139, 355, 142, BLUE);

const card3 = () => card(3, "NUCLEUS", "Control center; contains master DNA", 45, 172, RED, "#fef2f2");
const leader3 = () => arrow(270, 197, 460, 155, RED);

const card4 = () => card(4, "MITOCHONDRIA", "Powerhouse: produces ATP energy", 45, 230, ORANGE, "#fffbeb");
const leader4 = () => arrow(270, 255, 385, 244, ORANGE);

// RIGHT REGION: Cards 5–8 (x: 730..955)
const card5 = () => card(5, "ROUGH ER (RER)", "Ribosome-studded; makes proteins", 730, 56, PURPLE, "#faf5ff");
const leader5 = () => arrow(730, 81, 482, 124, PURPLE);

const card6 = () => card(6, "SMOOTH ER (SER)", "Synthesizes lipids & detoxifies", 730, 114, CYAN, "#ecfeff");
const leader6 = () => arrow(730, 139, 478, 198, CYAN);

const card7 = () => card(7, "GOLGI APPARATUS", "Modifies, sorts & packages materials", 730, 172, EMERALD, "#f0fdf4");
const leader7 = () => arrow(730, 197, 570, 218, EMERALD);

const card8 = () => card(8, "RIBOSOMES & VESICLES", "Protein synthesis & cargo transport", 730, 230, ROSE, "#fff1f2");
const leader8 = () => arrow(730, 255, 545, 175, ROSE);

// BOTTOM REGION: Banner helper (y: 292..322)
const bottomBanner = (text: string, bgColor = "#f8fafc", strokeColor = "#cbd5e1", textColor = "#334155"): BoardMark[] => [
  box(45, 292, 910, 30, bgColor, strokeColor),
  txt(55, 312, text, 13, textColor, 600),
];

export const cellInitialBoard: BoardPage = {
  id: "cell-initial",
  title: "Animal Cell",
  seconds: 0,
  narration: "Welcome to Qrie AI Classroom. Today we explore the animal cell: cell membrane, cytoplasm, nucleus, mitochondria, endoplasmic reticulum, Golgi apparatus, and ribosomes.",
  cues: [],
  ink: [],
  cursor: { x: 500, y: 160 },
  regions: cellBoardRegions,
  marks: [
    ...topHeader(),
    cellBaseImg(),
    ...card1(),
    ...card2(),
    ...card3(),
    ...card4(),
    ...card5(),
    ...card6(),
    ...card7(),
    ...card8(),
    ...bottomBanner("🎯 Learning Objective: Understand animal cell architecture, organelle functions, energy generation, and protein synthesis.", "#eff6ff", "#3b82f6", "#1e40af"),
  ],
};

// Scene boards indexed per chapter (7 chapters: 35s, 40s, 40s, 40s, 60s, 40s, 45s = 300s)
export const cellSceneBoards: BoardMark[][][] = [
  // Scene 1: Introduction: The Animal Cell (00:00–00:35, 35s)
  [
    // Cue 0 (18s: Welcome & animal cell framing)
    [
      ...topHeader(),
      cellBaseImg(),
      box(45, 75, 225, 175, "#faf5ff", PURPLE),
      txt(55, 102, "Classroom Overview", 16, PURPLE, 700),
      txt(55, 128, "• Microscopic living unit", 13, "#293b32", 500),
      txt(55, 150, "• 8 Essential organelles", 13, "#293b32", 500),
      txt(55, 172, "• Energy & protein pathways", 13, "#293b32", 500),
      txt(55, 194, "• Digital pen annotations", 13, "#293b32", 500),
      txt(55, 222, "Let's explore each structure!", 13, BLUE, 600),
      box(730, 75, 225, 175, "#f0fdf4", EMERALD),
      txt(740, 102, "Anatomy Preview", 16, EMERALD, 700),
      txt(740, 128, "1. Cell Membrane (Boundary)", 13, "#293b32", 500),
      txt(740, 150, "2. Cytoplasm (Cytosol)", 13, "#293b32", 500),
      txt(740, 172, "3. Nucleus (DNA Library)", 13, "#293b32", 500),
      txt(740, 194, "4. Mitochondria (ATP Energy)", 13, "#293b32", 500),
      txt(740, 222, "5-8. ER, Golgi & Ribosomes", 13, PURPLE, 600),
    ],
    // Cue 1 (17s: Reveal cell drawing & objective)
    [
      circle(450, 160, 135, 105, PURPLE, 2.2, 0),
      ...bottomBanner("🎯 Learning Objective: Understand animal cell architecture, organelle functions, energy generation, and protein synthesis.", "#eff6ff", "#3b82f6", "#1e40af"),
    ],
  ],

  // Scene 2: Cell Boundary and Cytoplasm (00:35–01:15, 40s)
  [
    // Cue 0 (20s: Cell Membrane)
    [
      ...topHeader(),
      cellBaseImg(),
      circle(450, 160, 138, 108, PURPLE, 2.8, -2),
      ...card1(),
      leader1(),
    ],
    // Cue 1 (20s: Cytoplasm & cytosol)
    [
      circle(375, 140, 32, 24, BLUE, 2.5, 5),
      ...card2(),
      leader2(),
      ...bottomBanner("💡 Selective Permeability: Phospholipid bilayer maintains homeostasis by regulating ions, nutrients, and waste.", "#f0f9ff", "#0984e3", "#0369a1"),
    ],
  ],

  // Scene 3: The Nucleus and Genetic Blueprint (01:15–01:55, 40s)
  [
    // Cue 0 (22s: Nucleus & master DNA)
    [
      ...topHeader(),
      cellBaseImg(),
      ...card1(),
      leader1(),
      ...card2(),
      leader2(),
      circle(500, 155, 42, 36, RED, 2.8, 0),
      ...card3(),
      leader3(),
    ],
    // Cue 1 (18s: Nucleolus sub-structure)
    [
      circle(502, 160, 12, 12, CRIMSON, 2.4, 0),
      arrow(502, 120, 502, 148, CRIMSON),
      txt(502, 114, "Nucleolus (rRNA assembly)", 12, CRIMSON, 600, "middle"),
      ...bottomBanner("🧬 Master Control: Chromosomal DNA transcribes mRNA inside the nucleus; mRNA exits via nuclear pores.", "#fef2f2", "#f87171", "#991b1b"),
    ],
  ],

  // Scene 4: Mitochondria: The Powerhouses (01:55–02:35, 40s)
  [
    // Cue 0 (20s: Mitochondria & ATP powerhouse)
    [
      ...topHeader(),
      cellBaseImg(),
      ...card1(),
      leader1(),
      ...card2(),
      leader2(),
      ...card3(),
      leader3(),
      circle(408, 242, 24, 18, ORANGE, 2.8, -12),
      ...card4(),
      leader4(),
      txt(408, 218, "Powerhouse of the Cell", 13, ORANGE, 700, "middle"),
    ],
    // Cue 1 (20s: Cristae folds & energy production)
    [
      circle(357, 173, 20, 14, ORANGE, 2.2, 15),
      arrow(357, 138, 357, 158, ORANGE),
      txt(357, 132, "Cristae Folds (Max ATP Area)", 12, ORANGE, 600, "middle"),
      ...bottomBanner("⚡ Cellular Respiration: Glucose + 6 O₂ ➔ 6 CO₂ + 6 H₂O + ATP (Usable cellular energy currency).", "#fffbeb", "#f59e0b", "#9a3412"),
    ],
  ],

  // Scene 5: Endoplasmic Reticulum and Golgi Apparatus (02:35–03:35, 60s)
  [
    // Cue 0 (20s: Rough ER)
    [
      ...topHeader(),
      cellBaseImg(),
      ...card1(),
      leader1(),
      ...card2(),
      leader2(),
      ...card3(),
      leader3(),
      ...card4(),
      leader4(),
      circle(455, 128, 26, 20, PURPLE, 2.6, -10),
      ...card5(),
      leader5(),
    ],
    // Cue 1 (20s: Smooth ER)
    [
      circle(455, 202, 22, 16, CYAN, 2.6, 12),
      ...card6(),
      leader6(),
    ],
    // Cue 2 (20s: Golgi Apparatus & packaging)
    [
      circle(542, 218, 28, 20, EMERALD, 2.6, 5),
      ...card7(),
      leader7(),
      ...bottomBanner("📦 Protein Processing Pipeline: Ribosomes synthesize ➔ RER folds ➔ Golgi modifies, sorts & packages.", "#ecfdf5", "#34d399", "#065f46"),
    ],
  ],

  // Scene 6: Ribosomes and Cellular Logistics (03:35–04:15, 40s)
  [
    // Cue 0 (20s: Ribosomes)
    [
      ...topHeader(),
      cellBaseImg(),
      ...card1(),
      leader1(),
      ...card2(),
      leader2(),
      ...card3(),
      leader3(),
      ...card4(),
      leader4(),
      ...card5(),
      leader5(),
      ...card6(),
      leader6(),
      ...card7(),
      leader7(),
      circle(448, 142, 14, 14, ROSE, 2.6, 0),
      ...card8(),
      leader8(),
    ],
    // Cue 1 (20s: Transport vesicles & cellular logistics)
    [
      circle(552, 165, 12, 12, BLUE, 2.4, 0),
      arrow(552, 135, 552, 152, BLUE),
      txt(552, 130, "Transport Vesicle", 12, BLUE, 600, "middle"),
      ...bottomBanner("🔬 Cellular Logistics: Vesicles pinch off from Golgi and membrane to deliver enzymes and hormones safely.", "#fdf2f8", "#f472b6", "#831843"),
    ],
  ],

  // Scene 7: Quick Recap and Knowledge Check (04:15–05:00, 45s)
  [
    // Cue 0 (25s: Full Classroom Master Notes)
    [
      ...topHeader(),
      cellBaseImg(),
      ...card1(),
      leader1(),
      ...card2(),
      leader2(),
      ...card3(),
      leader3(),
      ...card4(),
      leader4(),
      ...card5(),
      leader5(),
      ...card6(),
      leader6(),
      ...card7(),
      leader7(),
      ...card8(),
      leader8(),
      circle(450, 160, 138, 108, PURPLE, 2, -2),
      circle(500, 155, 42, 36, RED, 2.2, 0),
      circle(408, 242, 24, 18, ORANGE, 2.2, -12),
      ...bottomBanner("📝 Classroom Master Notes: 1.Membrane  2.Cytoplasm  3.Nucleus  4.Mitochondria  5.RER  6.SER  7.Golgi  8.Ribosomes", "#f8fafc", "#94a3b8", "#1e293b"),
    ],
    // Cue 1 (10s: Knowledge Check Question - hold)
    [
      box(45, 290, 910, 34, "#fef3c7", "#f59e0b"),
      txt(55, 312, "❓ Quick Question: Which organelle is known as the powerhouse of the cell? [Thinking time...]", 14, "#92400e", 700),
      circle(408, 242, 28, 22, ORANGE, 3.2, -12),
    ],
    // Cue 2 (10s: Answer Reveal & Completion)
    [
      box(45, 290, 910, 34, "#dcfce7", "#16a34a"),
      txt(55, 312, "✅ That's right! MITOCHONDRIA is the powerhouse of the cell! Outstanding work — lesson complete!", 14, "#166534", 750),
      txt(500, 30, "★ 5-MINUTE LESSON COMPLETE ★", 14, "#16a34a", 750, "middle"),
    ],
  ],
];

export function buildCellScenes(): BoardPage[] {
  return script.chapters.map((chapter, index) => {
    const sceneCues = cellSceneBoards[index] || [];
    let seconds = 0;
    const marks: BoardMark[] = [];
    const cues: LessonCue[] = chapter.cues.map((cue, cueIdx) => {
      const firstMark = marks.length;
      const cueMarks = sceneCues[cueIdx] || [];
      marks.push(...cueMarks);
      const from = seconds;
      seconds += cue.seconds;
      return {
        from,
        to: seconds,
        firstMark,
        endMark: marks.length,
        text: cue.text,
        ...("hold" in cue ? { hold: true } : {}),
      };
    });
    return {
      id: `cell-scene-${index + 1}`,
      title: chapter.title,
      seconds,
      marks,
      cues,
      narration: chapter.cues.map(c => c.text).join(" "),
      ink: [],
      cursor: { x: 500, y: 160 },
      regions: cellBoardRegions,
    };
  });
}
