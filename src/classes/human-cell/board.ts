import type { BoardMark, BoardPage, LessonCue } from "@/lib/types";
import { head, txt, circle, arrow, box, path, penHighlight, green, blue, orange, purple } from "../helpers";
import { cellBoardRegions, cellRegions, mitochondriaBoardRegions } from "./intelligence";
import script from "./script.json";

// High-contrast colors chosen to never blend with diagram backgrounds
const RED     = "#e74c3c"; // bright red — used on purple nucleus (pure contrast)
const LIME    = "#2ed573"; // lime green — used on orange-brown organelles in cell
const MAGENTA = "#ff2a7a"; // vivid magenta/rose — maximum visibility on both mitochondria folds and whiteboard
const CYAN    = "#00d2d3"; // electric cyan — used on red outer membrane

export const cellImg = (): BoardMark => ({
  type: "image",
  src: "/assets/human_cell_diagram.png",
  x: 610,
  y: 14,
  w: 232,
  h: 310,
  alt: "The Human Cell Anatomy",
});

export const mitochondriaImg = (x = 550, y = 12, w = 390, h = 310): BoardMark => ({
  type: "image",
  src: "/assets/Mitochondria.png",
  x,
  y,
  w,
  h,
  alt: "Mitochondria Structure & ATP Synthesis",
});

export const cellInitialBoard: BoardPage = {
  id: "cell-initial",
  title: "Human Cell",
  seconds: 0,
  narration: "Welcome to the Human Cell class. Today we explore the cell membrane, nucleus, mitochondria, and the protein factory pipeline.",
  cues: [],
  ink: [],
  cursor: { x: 852, y: 250 },
  regions: cellBoardRegions,
  marks: [
    ...head("Human Cell", 360),
    txt(55, 120, "Interactive Anatomy & Organelles", 28, green),
    txt(55, 175, "1. Cell Membrane: Selective lipid bilayer", 25, green),
    txt(55, 215, "2. Nucleus: Master DNA genetic library", 25, purple),
    txt(55, 255, "3. Mitochondria: ATP cellular respiration", 25, orange),
    txt(55, 295, "4. Protein Factory: Ribosomes, ER & Golgi", 25, blue),
    cellImg(),
  ],
};

// Scene boards indexed per chapter (4 chapters: 28s, 34s, 34s, 24s = 120s)
export const cellSceneBoards: BoardMark[][][] = [
  // Chapter 1: Inside the Human Cell — cell membrane & cytoplasm (28s)
  [
    // Cue 1 (9s: Cell Membrane)
    [
      ...head("Inside the Human Cell", 380),
      cellImg(),
      txt(55, 120, "Flexible lipid bilayer membrane", 28, green),
      txt(55, 168, "Cell membrane controls substance entry", 26, green),
      circle(725, 187, 96, 108, green, 2.8, -2),
      arrow(850, 88, 804, 112, green),
      txt(855, 92, "Cell Membrane", 16, green, 650, "start"),
    ],
    // Cue 2 (9s: Cytoplasm & Cytosol)
    // Callout positioned on the right of the cell diagram (x=855) with textAnchor "start"
    // so it never overlaps or crowds the left-side lesson text
    [
      txt(55, 210, "Cytosol jelly supports all organelles", 27, blue),
      circle(697, 116, 24, 20, blue, 2.8),
      arrow(850, 130, 725, 120, blue),
      txt(855, 134, "Cytoplasm (Cytosol)", 16, blue, 650, "start"),
    ],
    // Cue 3 (10s: Dynamic human cell structure)
    [
      ...penHighlight(55, 248, 360, "Dynamic human cell structure", 32),
      txt(55, 305, "Flexible membrane with no rigid cell wall", 24, green),
    ],
  ],
  // Chapter 2: Nucleus & Powerhouses (34s)
  [
    // Cue 1 (10s: Nucleus & DNA)
    // Cell diagram at x: 465, w: 175; callout positioned at top-left (y=92) with zero text collision
    [
      ...head("Nucleus & Powerhouses", 390),
      { type: "image", src: "/assets/human_cell_diagram.png", x: 465, y: 28, w: 175, h: 250, alt: "The Human Cell Anatomy" },
      txt(55, 118, "Nucleus: master DNA instruction library", 28, RED),
      circle(553, 140, 30, 26, RED, 2.8),
      arrow(455, 95, 522, 125, RED),
      txt(450, 92, "Nucleus (DNA)", 15, RED, 650, "end"),
    ],
    // Cue 2 (12s: Mitochondria & ATP — zoom in with dedicated Mitochondria.png alongside)
    // 80px clear gutter between cell (x: 465..640) and zoomed mitochondria (x: 720..975)
    [
      mitochondriaImg(720, 25, 255, 210),
      txt(55, 168, "Mitochondria produce ATP energy.", 28, orange),
      txt(55, 208, "Smooth outer membrane encloses organelle", 24, CYAN),
      // 1. Circle the oval mitochondrion inside the cell diagram (center: 515, 193)
      circle(515, 193, 22, 16, orange, 2.8, -15),
      // 2. Pointing arrow accurately connects the circled cell mitochondrion directly to zoomed diagram
      arrow(538, 188, 720, 135, orange),
      // 3. Bold "Zoom In" tutor handwriting centered in the 80px gap, clearly above the arrow path
      txt(680, 128, "Zoom In", 16, orange, 750, "middle"),
      // 4. Underline the pre-labeled "Outer membrane" naming convention on the diagram (AI vision calibrated: x=927..971, y=74)
      path("M927 74 Q949 76 971 73", CYAN, 3.4),
    ],
    // Cue 3 (12s: Cristae & ATP takeaway — inner folds at top-left, matrix below)
    [
      // Cristae: top-left capsule fold callout (ends at x=770, y=46) — 85px gap from Outer Membrane!
      circle(822, 108, 34, 25, MAGENTA, 2.6),
      arrow(775, 54, 810, 92, MAGENTA),
      txt(770, 46, "Cristae (folds)", 13, MAGENTA, 650, "end"),
      // Matrix: callout placed in empty whiteboard space below capsule (y: 254), pointing up into interior
      arrow(845, 238, 845, 172, CYAN),
      txt(845, 254, "Matrix (ATP fluid)", 14, CYAN, 650, "middle"),
      ...penHighlight(55, 248, 375, "Glucose + O₂ → ATP Energy", 33),
      txt(55, 305, "Folded cristae maximize surface area", 24, orange),
    ],
  ],
  // Chapter 3: Identify the protein factories (34s)
  [
    // Cue 1 (8s: Question prompt)
    // Generous 52px baseline gap (20px clear margin) between line 1 (y=108) and line 2 (y=160)
    [
      ...head("Identify the protein factories", 440),
      cellImg(),
      txt(55, 108, "Ribbon-like channels around nucleus", 26),
      txt(55, 160, "Which organelle builds proteins?", 26, blue),
    ],
    // Cue 2 (5s: Hold for thought)
    [],
    // Cue 3 (11s: Ribosomes & Rough ER)
    // Rough ER callout positioned at y=88 in open zone above lesson text with 72px clearance from line 2
    // Highlighted "Rough ER & Ribosomes" centered at y=232 (baseline: 266)
    [
      txt(55, 206, "Specks: Ribosomes · Highway: Rough ER", 26, purple),
      circle(677, 156, 30, 42, purple, 2.8),
      arrow(560, 91, 642, 140, purple),
      txt(555, 88, "Rough ER & Ribosomes", 15, purple, 650, "end"),
      ...penHighlight(55, 232, 340, "Rough ER & Ribosomes", 28),
    ],
    // Cue 4 (10s: Golgi Apparatus & shipping)
    // "Golgi sorts & packages into vesicles" placed at y=308 with 42px baseline clearance (12px clear margin)
    // from "Rough ER & Ribosomes" (y=266), completely eliminating text overlap
    [
      circle(755, 114, 30, 24, green, 2.8),
      arrow(850, 114, 790, 114, green),
      txt(855, 119, "Golgi Apparatus", 16, green, 650, "start"),
      txt(55, 308, "Golgi sorts & packages into vesicles", 23, green),
    ],
  ],
  // Chapter 4: Organelle Symphony (24s)
  [
    // Cue 1 (8s: Nucleus instruction)
    [
      ...head("Organelle Symphony", 345),
      cellImg(),
      txt(55, 118, "1. Nucleus sends mRNA codes.", 27, purple),
      circle(726, 152, 38, 33, purple, 2.8),
      arrow(850, 152, 770, 152, purple),
      txt(855, 156, "1. DNA instructions", 16, purple, 650, "start"),
    ],
    // Cue 2 (8s: Ribosomes & Mitochondria cooperation)
    [
      txt(55, 160, "2. Ribosomes build proteins.", 27, blue),
      circle(677, 156, 30, 42, purple, 2.8),
      arrow(585, 130, 642, 150, purple),
      txt(580, 126, "2. Ribosomes (ER)", 15, purple, 650, "end"),
      txt(55, 202, "3. Mitochondria supply ATP fuel.", 27, LIME),
      circle(676, 219, 32, 22, LIME, 2.8, -25),
      arrow(585, 215, 638, 219, LIME),
      txt(580, 210, "3. ATP fuel", 15, LIME, 650, "end"),
    ],
    // Cue 3 (8s: Symphony summary)
    [
      ...penHighlight(55, 245, 380, "Trillions of cells, one system.", 31),
      txt(55, 305, "Explore study notes & ask any doubt.", 23, green),
    ],
  ],
];

export function buildCellScenes(): BoardPage[] {
  return script.chapters.map((chapter, index): BoardPage => {
    let seconds = 0;
    const marks: BoardMark[] = [];
    const cues = chapter.cues.map((cue, i): LessonCue => {
      const from = seconds;
      const firstMark = marks.length;
      if (cellSceneBoards[index] && cellSceneBoards[index][i]) {
        marks.push(...cellSceneBoards[index][i]);
      }
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
      id: `human-cell-${index + 1}`,
      title: chapter.title,
      seconds,
      marks,
      cues,
      narration: chapter.cues.map(c => c.text).join(" "),
      ink: [],
      cursor: { x: 852, y: 250 },
      regions: index === 1 ? [...cellBoardRegions, ...mitochondriaBoardRegions] : cellBoardRegions,
    };
  });
}

export function buildMitochondriaBoard(example = false): BoardPage {
  return {
    id: "mitochondria-deep-dive",
    title: "Mitochondria: The Powerhouse of the Cell",
    seconds: 0,
    narration: "Mitochondria generate ATP chemical energy through cellular respiration using folded inner cristae and ATP synthase.",
    cues: [],
    ink: [],
    cursor: { x: 740, y: 200 },
    regions: mitochondriaBoardRegions,
    marks: [
      ...head(example ? "Mitochondria ATP Synthesis" : "The Mitochondria (Powerhouse)", 380),
      txt(55, 115, "Cellular Respiration & ATP Generation", 28, orange),
      // FIX: white/cyan text on orange-brown mito background lines
      txt(55, 160, "C₆H₁₂O₆ + 6 O₂ → 6 CO₂ + 6 H₂O + ATP", 25, orange),
      txt(55, 205, "1. Double Membrane: Outer smooth + Inner folded", 24, CYAN),
      txt(55, 240, "2. Cristae: Folds expand surface area for ATP machines", 24, MAGENTA),
      txt(55, 275, "3. Matrix: Viscous interior with mtDNA & ribosomes", 24, LIME),
      txt(55, 305, "4. F0F1-ATPase: Rotary motor generating ATP fuel", 24, orange),
      mitochondriaImg(550, 12, 390, 310),
    ],
  };
}
