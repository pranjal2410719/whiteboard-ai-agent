import type { BoardMark, BoardPage, LessonCue } from "@/lib/types";
import { head, txt, circle, arrow, box, penHighlight, green, blue, orange, purple } from "../helpers";
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
    // Cue 3 (10s: Dynamic animal cell structure)
    [
      ...penHighlight(55, 248, 360, "Dynamic animal cell structure", 32),
      txt(55, 305, "Flexible membrane with no rigid cell wall", 24, green),
    ],
  ],
  // Chapter 2: Nucleus & Powerhouses (34s)
  [
    // Cue 1 (10s: Nucleus & DNA)
    // Cell diagram at x: 415, w: 130 (right edge: 545 <= 550 mito left boundary); callout at top-left
    [
      ...head("Nucleus & Powerhouses", 390),
      { type: "image", src: "/assets/human_cell_diagram.png", x: 415, y: 35, w: 130, h: 185, alt: "The Human Cell Anatomy" },
      txt(55, 118, "Nucleus: master DNA instruction library", 28, RED),
      circle(480, 117, 24, 20, RED, 2.8),
      arrow(410, 85, 460, 110, RED),
      txt(405, 82, "Nucleus (DNA)", 15, RED, 650, "end"),
    ],
    // Cue 2 (12s: Mitochondria & ATP — fade cell diagram, scale increase mitochondria diagram, write "Zoom In")
    [
      // Faded cell diagram in the background (opacity: 0.22, x: 415, w: 130)
      { type: "image", src: "/assets/human_cell_diagram.png", x: 415, y: 35, w: 130, h: 185, opacity: 0.22, alt: "The Human Cell Anatomy" },
      // "Zoom In" indicator written above the faded cell
      txt(420, 26, "🔍 Zoom In: Mitochondria", 14, orange, 700, "start"),
      // Scale-increased mitochondria diagram (scaled up to 420x308 starting at x: 550)
      mitochondriaImg(550, 12, 420, 308),
      txt(55, 168, "Mitochondria produce ATP energy.", 28, orange),
      txt(55, 208, "Smooth outer membrane encloses organelle", 24, CYAN),
      // Outer membrane: circle precisely traces the red capsule boundary (center: 760, 200, rx: 168, ry: 102)
      circle(760, 200, 168, 102, CYAN, 2.5),
      // Pointing arrow for outer membrane: accurately points to (850, 117) on the red outer capsule rim
      arrow(885, 48, 850, 117, CYAN),
      txt(895, 38, "Outer Membrane", 14, CYAN, 650, "end"),
    ],
    // Cue 3 (12s: Cristae & ATP takeaway — inner folds & matrix callouts at exact positions)
    [
      // Cristae: circle precisely encircles inner cristae fold at (725, 160)
      circle(725, 160, 36, 26, MAGENTA, 2.6),
      // Pointing arrow for cristae: accurately points directly into the folded inner cristae at (720, 157)
      arrow(665, 46, 720, 157, MAGENTA),
      txt(660, 38, "Cristae (folds)", 14, MAGENTA, 650, "end"),
      // Matrix: circle inside the matrix fluid at (810, 215)
      circle(810, 215, 24, 18, CYAN, 2.4),
      // Pointing arrow for matrix: accurately points directly into matrix interior fluid
      arrow(880, 240, 810, 215, CYAN),
      txt(885, 244, "Matrix (fluid)", 13, CYAN, 650, "start"),
      ...penHighlight(55, 248, 375, "Glucose + O₂ → ATP Energy", 33),
      txt(55, 305, "Folded cristae maximize surface area", 24, orange),
    ],
  ],
  // Chapter 3: Identify the protein factories (34s)
  [
    // Cue 1 (8s: Question prompt)
    [
      ...head("Identify the protein factories", 440),
      cellImg(),
      txt(55, 120, "Ribbon-like channels around nucleus", 29),
      txt(55, 165, "Which organelle builds proteins?", 29, blue),
    ],
    // Cue 2 (5s: Hold for thought)
    [],
    // Cue 3 (11s: Ribosomes & Rough ER)
    // Rough ER callout positioned at y=92 in open space above line 1 (y=120), completely free of line 2 (y=165)
    [
      txt(55, 212, "Specks: Ribosomes · Highway: Rough ER", 28, purple),
      circle(677, 156, 30, 42, purple, 2.8),
      arrow(560, 95, 642, 140, purple),
      txt(555, 92, "Rough ER & Ribosomes", 16, purple, 650, "end"),
      ...penHighlight(55, 245, 360, "Rough ER & Ribosomes", 34),
    ],
    // Cue 4 (10s: Golgi Apparatus & shipping)
    [
      circle(755, 114, 30, 24, green, 2.8),
      arrow(850, 114, 790, 114, green),
      txt(855, 119, "Golgi Apparatus", 16, green, 650, "start"),
      txt(55, 290, "Golgi sorts & packages into vesicles", 24, green),
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
