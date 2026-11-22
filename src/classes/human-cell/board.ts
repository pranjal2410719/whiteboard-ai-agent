import type { BoardMark, BoardPage, LessonCue } from "@/lib/types";
import { head, txt, circle, arrow, penHighlight, green, blue, orange, purple } from "../helpers";
import { cellBoardRegions, cellRegions } from "./intelligence";
import script from "./script.json";

export const cellImg = (): BoardMark => ({
  type: "image",
  src: "/assets/human_cell_diagram.png",
  x: 610,
  y: 14,
  w: 232,
  h: 310,
  alt: "The Human Cell Anatomy",
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

export const cellSceneBoards: BoardMark[][][] = [
  // Scene 1: Inside the Human Cell (28s total)
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
    [
      txt(55, 210, "Cytosol jelly supports all organelles", 27, blue),
      circle(697, 116, 24, 20, blue, 2.8),
      arrow(576, 116, 668, 116, blue),
      txt(570, 121, "Cytoplasm (Cytosol)", 16, blue, 650, "end"),
    ],
    // Cue 3 (10s: Dynamic animal cell structure)
    [
      ...penHighlight(55, 248, 360, "Dynamic animal cell structure", 32),
      txt(55, 305, "Flexible membrane with no rigid cell wall", 24, green),
    ],
  ],
  // Scene 2: Nucleus & Powerhouses (34s total)
  [
    // Cue 1 (10s: Nucleus & DNA)
    [
      ...head("Nucleus & Powerhouses", 390),
      cellImg(),
      txt(55, 118, "Nucleus: master DNA instruction library", 28, purple),
      circle(726, 152, 38, 33, purple, 2.8),
      arrow(850, 152, 770, 152, purple),
      txt(855, 156, "Nucleus (DNA)", 16, purple, 650, "start"),
    ],
    // Cue 2 (12s: Mitochondria & ATP)
    [
      txt(55, 168, "Mitochondria produce ATP energy.", 28, orange),
      circle(676, 219, 32, 22, orange, 2.8, -25),
      arrow(576, 224, 638, 224, orange),
      txt(570, 229, "Mitochondria (ATP)", 16, orange, 650, "end"),
      txt(55, 212, "Cellular respiration: Glucose + O₂", 27, orange),
    ],
    // Cue 3 (12s: Cristae & ATP takeaway)
    [
      ...penHighlight(55, 248, 375, "Glucose + O₂ → ATP Energy", 33),
      txt(55, 305, "Folded cristae maximize surface area", 24, orange),
    ],
  ],
  // Scene 3: Identify the protein factories (34s total)
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
    [
      txt(55, 212, "Specks: Ribosomes · Highway: Rough ER", 28, purple),
      circle(677, 156, 30, 42, purple, 2.8),
      arrow(576, 156, 642, 156, purple),
      txt(570, 161, "Rough ER & Ribosomes", 16, purple, 650, "end"),
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
  // Scene 4: Organelle Symphony (24s total)
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
      arrow(576, 156, 642, 156, purple),
      txt(570, 161, "2. Ribosomes (ER)", 16, purple, 650, "end"),
      txt(55, 202, "3. Mitochondria supply ATP fuel.", 27, orange),
      circle(676, 219, 32, 22, orange, 2.8, -25),
      arrow(576, 224, 638, 224, orange),
      txt(570, 229, "3. ATP fuel", 16, orange, 650, "end"),
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
      regions: cellBoardRegions,
    };
  });
}
