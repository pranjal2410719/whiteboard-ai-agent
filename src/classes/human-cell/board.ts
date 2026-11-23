import type { BoardMark, BoardPage, LayoutPatternType, LessonCue } from "@/lib/types";
import { head, txt, circle, arrow, penHighlight, green, blue, orange, purple, box } from "../helpers";
import { cellBoardRegions, cellRegions, mitochondriaBoardRegions } from "./intelligence";
import { buildPageWithLayout, LayoutPatternEngine } from "@/lib/layout";
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
  layoutPattern: "classic-split",
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
  // Scene 1: Inside the Human Cell (28s total) - Layout: classic-split
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
  // Scene 2: Nucleus & Powerhouses (34s total) - Layout: multi-panel-comparison
  [
    // Cue 1 (10s: Nucleus & DNA - Left Comparative Panel)
    [
      ...head("Nucleus & Powerhouses", 390),
      box(45, 75, 435, 235, "#f7f1fb", purple),
      box(55, 84, 110, 18, purple, purple),
      txt(110, 97, "NUCLEUS (DNA)", 11, "#ffffff", 700, "middle"),
      { type: "image", src: "/assets/human_cell_diagram.png", x: 520, y: 20, w: 195, h: 260, alt: "The Human Cell Anatomy" },
      txt(55, 118, "Nucleus: master DNA instruction library", 28, purple),
      circle(618, 136, 33, 28, purple, 2.8),
      arrow(510, 136, 578, 136, purple),
      txt(505, 141, "Nucleus (DNA)", 16, purple, 650, "end"),
    ],
    // Cue 2 (12s: Mitochondria & ATP - Right Comparative Panel)
    [
      box(505, 75, 450, 235, "#fbf4ec", orange),
      box(515, 84, 135, 18, orange, orange),
      txt(582, 97, "MITOCHONDRIA (ATP)", 11, "#ffffff", 700, "middle"),
      mitochondriaImg(735, 32, 225, 178),
      txt(55, 168, "Mitochondria produce ATP energy.", 28, orange),
      circle(575, 192, 25, 18, orange, 2.8, -25),
      arrow(605, 192, 730, 130, orange),
      txt(668, 150, "Zoom In", 15, orange, 600, "middle"),
      txt(55, 212, "Cellular respiration: Glucose + O₂", 27, orange),
    ],
    // Cue 3 (12s: Cristae & ATP takeaway + Central VS Badge)
    [
      box(468, 170, 36, 30, "#ffffff", green),
      txt(486, 191, "VS", 15, green, 700, "middle"),
      circle(855, 122, 46, 26, orange, 2.6),
      arrow(955, 75, 902, 106, orange),
      txt(955, 72, "Folded Cristae", 15, orange, 650, "end"),
      ...penHighlight(55, 248, 375, "Glucose + O₂ → ATP Energy", 33),
      txt(55, 305, "Folded cristae maximize surface area", 24, orange),
    ],
  ],
  // Scene 3: Identify the protein factories (34s total) - Layout: top-diagram-bottom-timeline
  [
    // Cue 1 (8s: Question prompt banner)
    [
      ...head("Identify the protein factories", 440),
      cellImg(),
      txt(55, 120, "Ribbon-like channels around nucleus", 29),
      txt(55, 165, "Which organelle builds proteins?", 29, blue),
    ],
    // Cue 2 (5s: Hold for thought)
    [],
    // Cue 3 (11s: Timeline Step 1: Ribosomes & Rough ER)
    [
      box(45, 190, 230, 120, "#f7f1fb", purple),
      box(55, 198, 28, 18, purple, purple),
      txt(69, 211, "01", 12, "#ffffff", 700, "middle"),
      txt(55, 212, "Specks: Ribosomes · Highway: Rough ER", 28, purple),
      circle(677, 156, 30, 42, purple, 2.8),
      arrow(576, 156, 642, 156, purple),
      txt(570, 161, "Rough ER & Ribosomes", 16, purple, 650, "end"),
      ...penHighlight(55, 245, 360, "Rough ER & Ribosomes", 34),
    ],
    // Cue 4 (10s: Timeline Step 2: Golgi Apparatus shipping)
    [
      arrow(277, 248, 291, 248, purple),
      box(293, 190, 230, 120, "#eef6f0", green),
      box(303, 198, 28, 18, green, green),
      txt(317, 211, "02", 12, "#ffffff", 700, "middle"),
      circle(755, 114, 30, 24, green, 2.8),
      arrow(850, 114, 790, 114, green),
      txt(855, 119, "Golgi Apparatus", 16, green, 650, "start"),
      txt(55, 290, "Golgi sorts & packages into vesicles", 24, green),
    ],
  ],
  // Scene 4: Organelle Symphony (24s total) - Layout: centered-focal-hero
  [
    // Cue 1 (8s: Left Flank Callout: DNA instructions)
    [
      ...head("Organelle Symphony", 345),
      box(45, 78, 300, 145, "#f7f1fb", purple),
      box(55, 86, 100, 18, purple, purple),
      txt(105, 99, "1. DNA CODES", 11, "#ffffff", 700, "middle"),
      cellImg(),
      txt(55, 118, "1. Nucleus sends mRNA codes.", 27, purple),
      circle(726, 152, 38, 33, purple, 2.8),
      arrow(850, 152, 770, 152, purple),
      txt(855, 156, "1. DNA instructions", 16, purple, 650, "start"),
    ],
    // Cue 2 (8s: Right Flank Callout: Ribosomes & Mitochondria cooperation)
    [
      box(660, 78, 290, 145, "#eff4fb", blue),
      box(670, 86, 110, 18, blue, blue),
      txt(725, 99, "2. PROTEIN & ATP", 11, "#ffffff", 700, "middle"),
      txt(55, 160, "2. Ribosomes build proteins.", 27, blue),
      circle(677, 156, 30, 42, purple, 2.8),
      arrow(576, 156, 642, 156, purple),
      txt(570, 161, "2. Ribosomes (ER)", 16, purple, 650, "end"),
      txt(55, 202, "3. Mitochondria supply ATP fuel.", 27, orange),
      circle(676, 219, 32, 22, orange, 2.8, -25),
      arrow(576, 224, 638, 224, orange),
      txt(570, 229, "3. ATP fuel", 16, orange, 650, "end"),
    ],
    // Cue 3 (8s: Symphony summary takeaway)
    [
      ...penHighlight(55, 245, 380, "Trillions of cells, one system.", 31),
      txt(55, 305, "Explore study notes & ask any doubt.", 23, green),
    ],
  ],
];

export const CELL_SCENE_PATTERNS: LayoutPatternType[] = [
  "classic-split",
  "multi-panel-comparison",
  "top-diagram-bottom-timeline",
  "centered-focal-hero",
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
      layoutPattern: CELL_SCENE_PATTERNS[index] || "classic-split",
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

export function buildDynamicCellScenes(
  patternOverrides?: Partial<Record<number, LayoutPatternType>>
): BoardPage[] {
  const baseScenes = buildCellScenes();
  if (!patternOverrides) return baseScenes;
  return baseScenes.map((scene, idx) => {
    const override = patternOverrides[idx];
    if (!override) return scene;
    return {
      ...scene,
      layoutPattern: override,
    };
  });
}

export function buildCellHeroRadialBoard(): BoardPage {
  return buildPageWithLayout({
    id: "cell-hero-radial",
    title: "Inside the Living Cell (Symphony)",
    pattern: "centered-focal-hero",
    narration: "A panoramic exploration of the cell's internal coordination between genetic code, energy, and protein transport.",
    diagramAsset: {
      src: "/assets/human_cell_diagram.png",
      alt: "Human Cell Anatomy",
      naturalBounds: { x: 610, y: 14, w: 232, h: 310 },
    },
    leftCallouts: [
      { label: "1. DNA Library", text: "Nucleus stores master instructions", color: purple, targetY: 120 },
      { label: "2. Protein Factory", text: "Ribosomes and Rough ER assemble proteins", color: blue, targetY: 170 },
      { label: "3. Gateway Barrier", text: "Lipid membrane controls all transit", color: green, targetY: 240 },
    ],
    rightCallouts: [
      { label: "4. ATP Powerhouse", text: "Mitochondria fuel cellular respiration", color: orange, targetY: 130 },
      { label: "5. Shipping Center", text: "Golgi sorts and packages into vesicles", color: green, targetY: 190 },
      { label: "6. Fluid Cytosol", text: "Jelly suspension supports biochemical flow", color: blue, targetY: 250 },
    ],
    regions: cellBoardRegions,
  });
}

export function buildCellTimelinePipelineBoard(): BoardPage {
  return buildPageWithLayout({
    id: "cell-timeline-pipeline",
    title: "The Protein Synthesis Pipeline",
    pattern: "top-diagram-bottom-timeline",
    narration: "Track how biological messages move sequentially from nucleus DNA to secreted protein vesicles.",
    diagramAsset: {
      src: "/assets/human_cell_diagram.png",
      alt: "Human Cell Anatomy",
      naturalBounds: { x: 610, y: 14, w: 232, h: 310 },
    },
    timelineSteps: [
      { step: 1, title: "Nucleus", subtitle: "DNA Transcription", detail: "mRNA copies genetic code", color: purple },
      { step: 2, title: "Rough ER", subtitle: "Ribosome Assembly", detail: "Translates amino acids into chains", color: blue },
      { step: 3, title: "Golgi Body", subtitle: "Sorting & Folding", detail: "Modifies proteins with tags", color: orange },
      { step: 4, title: "Membrane", subtitle: "Vesicle Exocytosis", detail: "Secretes protein outside cell", color: green },
    ],
    regions: cellBoardRegions,
  });
}

export function buildCellOrganelleComparisonBoard(): BoardPage {
  return buildPageWithLayout({
    id: "cell-organelle-comparison",
    title: "Organelle Contrast: Nucleus vs Mitochondria",
    pattern: "multi-panel-comparison",
    narration: "Contrasting the information center and the powerhouse of the human cell.",
    comparisonPanels: [
      {
        id: "nucleus",
        title: "The Nucleus (Information)",
        subtitle: "Directs all cellular functions",
        color: purple,
        equation: "DNA → mRNA → Ribosome Signals",
        points: [
          "Stores double-stranded chromatin DNA",
          "Surrounded by nuclear envelope pores",
          "Transcription of messenger RNA",
        ],
      },
      {
        id: "mitochondria",
        title: "Mitochondria (Energy)",
        subtitle: "Fuels all cellular operations",
        color: orange,
        equation: "Glucose + O₂ → ATP Chemical Energy",
        points: [
          "Double membrane with folded cristae",
          "Inner matrix with circular mtDNA",
          "F0F1-ATP synthase molecular motor",
        ],
      },
    ],
    regions: cellBoardRegions,
  });
}

export function buildMitochondriaBoard(example = false): BoardPage {
  return {
    id: "mitochondria-deep-dive",
    title: "Mitochondria: The Powerhouse of the Cell",
    layoutPattern: "classic-split",
    seconds: 0,
    narration: "Mitochondria generate ATP chemical energy through cellular respiration using folded inner cristae and ATP synthase.",
    cues: [],
    ink: [],
    cursor: { x: 852, y: 250 },
    regions: mitochondriaBoardRegions,
    marks: [
      ...head(example ? "Mitochondria ATP Synthesis" : "The Mitochondria (Powerhouse)", 380),
      txt(55, 115, "Cellular Respiration & ATP Generation", 28, orange),
      txt(55, 160, "C₆H₁₂O₆ + 6 O₂ → 6 CO₂ + 6 H₂O + ATP", 25, orange),
      txt(55, 205, "1. Double Membrane: Outer smooth + Inner folded", 24, green),
      txt(55, 240, "2. Cristae: Folds expand surface area for ATP machines", 24, purple),
      txt(55, 275, "3. Matrix: Viscous interior with mtDNA & ribosomes", 24, blue),
      txt(55, 305, "4. F0F1-ATPase: Rotary motor generating ATP fuel", 24, orange),
      mitochondriaImg(550, 12, 390, 310),
    ],
  };
}
