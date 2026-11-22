import type { BoardMark, BoardPage, LessonCue } from "@/lib/types";
import { head, txt, circle, arrow, penHighlight, green, blue, orange, purple } from "../helpers";
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
  // Scene 1
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
  // Scene 2
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
  // Scene 3
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
  // Scene 4
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
    };
  });
}
