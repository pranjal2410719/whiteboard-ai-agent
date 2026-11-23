import type { DiagramRegion } from "@/lib/types";

export const CELL_IMAGE_LAYOUT = { x: 610, y: 14, w: 232, h: 310 } as const;

export const cellRegions: DiagramRegion[] = [
  {
    id: "membrane",
    label: "Cell Membrane",
    color: "#2ed573", // Vibrant lime: stands out sharply against dark perimeter rim
    x: 19,
    y: 65,
    w: 192,
    h: 216,
    aliases: ["plasma membrane", "boundary", "outer membrane", "cell boundary", "membrane", "cell_membrane"],
    note: "The flexible lipid bilayer enclosing the human cell and regulating what enters and leaves."
  },
  {
    id: "nucleus",
    label: "Nucleus (DNA)",
    color: "#e74c3c", // Bright red: maximum contrast against purple/grey nucleus interior
    x: 78,
    y: 105,
    w: 76,
    h: 66,
    aliases: ["dna", "nucleolus", "genetic blueprint", "master control", "nucleus"],
    note: "The master control center storing genomic chromosomal DNA and coordinating gene expression."
  },
  {
    id: "mitochondria",
    label: "Mitochondria",
    color: "#2ed573", // Neon lime: never blends with orange-rust organelle interior
    x: 34,
    y: 183,
    w: 64,
    h: 44,
    aliases: ["powerhouse", "atp", "cristae", "mitochondrion", "microcondria", "mitochondria", "cellular respiration", "cell powerhouse", "powerhouse of the cell"],
    note: "The powerhouse organelle executing cellular respiration to generate ATP energy."
  },
  {
    id: "rough-er",
    label: "Rough ER & Ribosomes",
    color: "#8a6a9e", // Rich purple: maximum contrast on pale cream highway
    x: 37,
    y: 100,
    w: 60,
    h: 84,
    aliases: ["er", "endoplasmic reticulum", "ribosome", "ribosomes", "rough_er", "protein factories"],
    note: "Folded membranous highway studded with ribosomes that synthesize and fold secretory proteins."
  },
  {
    id: "golgi",
    label: "Golgi Apparatus",
    color: "#00d2d3", // Electric cyan: complementary contrast against rust/orange vesicles
    x: 115,
    y: 76,
    w: 60,
    h: 48,
    aliases: ["golgi body", "golgi", "vesicles", "packaging", "golgi_body"],
    note: "Flattened membranous sacs that sort, modify, and package proteins into vesicles."
  },
  {
    id: "cytoplasm",
    label: "Cytoplasm (Cytosol)",
    color: "#0984e3", // Electric blue: clear visibility against warm tan cytosol
    x: 63,
    y: 82,
    w: 48,
    h: 40,
    aliases: ["cytosol", "jelly", "cytoplasm", "cellular fluid"],
    note: "The water-rich nutrient jelly filling the cellular interior and suspending organelles."
  },
];

export const cellBoardRegions: DiagramRegion[] = cellRegions.map(r => ({
  ...r,
  x: r.x + CELL_IMAGE_LAYOUT.x,
  y: r.y + CELL_IMAGE_LAYOUT.y,
}));

export const MITOCHONDRIA_IMAGE_LAYOUT = { x: 550, y: 12, w: 390, h: 310 } as const;

export const mitochondriaDetailedRegions: DiagramRegion[] = [
  // --- Anatomical Structures ---
  {
    id: "outer-membrane",
    label: "Outer Membrane",
    category: "structure",
    color: "#00d2d3", // Electric cyan stands out sharply against red outer membrane
    x: 39, y: 85, w: 312, h: 157,
    aliases: ["outer membrane", "smooth outer membrane", "outer boundary", "porin membrane", "outer mitochondrial membrane", "boundary"],
    note: "Smooth, continuous phospholipid bilayer containing porin channels allowing nutrient passage."
  },
  {
    id: "inner-membrane",
    label: "Inner Membrane",
    category: "structure",
    color: "#ff2a7a", // Vivid magenta/rose pops distinctly against yellow membrane folds
    x: 66, y: 117, w: 275, h: 104,
    aliases: ["inner membrane", "inner mitochondrial membrane", "cardiolipin membrane", "inner lipid bilayer"],
    note: "Selectively permeable inner lipid bilayer housing electron transport chain complexes."
  },
  {
    id: "cristae",
    label: "Cristae (Inner Folds)",
    category: "structure",
    color: "#ff2a7a", // Vivid magenta
    x: 136, y: 122, w: 42, h: 63,
    aliases: ["cristae", "crista", "inner folds", "folds", "folded cristae", "fold", "cristae folds"],
    note: "Deep convoluted inward folds of the inner membrane maximizing surface area for ATP synthase machinery."
  },
  {
    id: "matrix",
    label: "Mitochondrial Matrix",
    category: "structure",
    color: "#00d2d3", // Electric cyan
    x: 174, y: 122, w: 87, h: 59,
    aliases: ["matrix", "mitochondrial matrix", "inner fluid", "cytosol of mitochondria", "matrix fluid"],
    note: "Enzyme-dense inner fluid hosting the Krebs citric acid cycle, circular mtDNA, and ribosomes."
  },
  {
    id: "intermembrane-space",
    label: "Intermembrane Space",
    category: "structure",
    color: "#00d2d3", // Electric cyan
    x: 59, y: 111, w: 289, h: 117,
    aliases: ["intermembrane space", "space between membranes", "outer compartment", "proton space"],
    note: "Narrow fluid compartment where protons (H+) accumulate to establish the chemiosmotic gradient."
  },
  {
    id: "dna",
    label: "Mitochondrial DNA (mtDNA)",
    category: "structure",
    color: "#2ed573", // Neon lime green pops vividly against purple DNA loops
    x: 76, y: 139, w: 29, h: 33,
    aliases: ["dna", "mtdna", "circular dna", "mitochondrial dna", "genome"],
    note: "Maternally inherited circular genome encoding essential respiratory chain proteins."
  },
  {
    id: "ribosomes",
    label: "Mitochondrial Ribosomes",
    category: "structure",
    color: "#ff2a7a", // Vivid magenta against green dots and brown granules
    x: 275, y: 153, w: 22, h: 22,
    aliases: ["ribosomes", "70s ribosomes", "mitoribosomes", "granules"],
    note: "Specialized 70S ribosomes synthesizing hydrophobic subunits of respiratory complexes."
  },
  {
    id: "atp-synthase",
    label: "F0F1-ATPase (ATP Synthase)",
    category: "structure",
    color: "#00d2d3", // Electric cyan
    x: 193, y: 215, w: 42, h: 42,
    aliases: ["atp synthase", "atpase", "f0f1", "f0f1-atpase", "f0 portion", "f1 portion", "power generator", "atp powerhouse motor"],
    note: "Rotary nanomachine driven by proton motive force to synthesize ATP from ADP and phosphate."
  },

  // --- Printed Naming Conventions / Text Labels in Diagram ---
  {
    id: "label-inner-membrane",
    label: "Inner Membrane Label",
    category: "label",
    color: "#00d2d3",
    x: 6, y: 42, w: 68, h: 31,
    aliases: ["inner membrane label", "label inner membrane", "inner membrane naming", "inner membrane text", "naming convention of inner membrane", "inner membrane convention", "inner membrane name"],
    note: "Printed naming convention 'Inner membrane' positioned at top left of diagram."
  },
  {
    id: "label-intermembrane-space",
    label: "Intermembrane Space Label",
    category: "label",
    color: "#00d2d3",
    x: 115, y: 42, w: 91, h: 31,
    aliases: ["intermembrane space label", "label intermembrane space", "intermembrane space naming", "intermembrane space text", "naming convention of intermembrane space", "intermembrane space convention", "intermembrane space name"],
    note: "Printed naming convention 'Intermembrane space' positioned at top center-left of diagram."
  },
  {
    id: "label-matrix",
    label: "Matrix Label",
    category: "label",
    color: "#00d2d3",
    x: 256, y: 42, w: 28, h: 26,
    aliases: ["matrix label", "label matrix", "matrix naming", "matrix text", "naming convention of matrix", "matrix convention", "matrix name"],
    note: "Printed naming convention 'Matrix' positioned at top center-right of diagram."
  },
  {
    id: "label-outer-membrane",
    label: "Outer Membrane Label",
    category: "label",
    color: "#00d2d3",
    x: 316, y: 42, w: 68, h: 31,
    aliases: ["outer membrane label", "label outer membrane", "outer membrane naming", "outer membrane text", "naming convention of outer membrane", "outer membrane convention", "outer membrane name"],
    note: "Printed naming convention 'Outer membrane' positioned at top right of diagram."
  },
  {
    id: "label-dna",
    label: "DNA Label",
    category: "label",
    color: "#00d2d3",
    x: 7, y: 163, w: 35, h: 24,
    aliases: ["dna label", "label dna", "dna naming", "dna text", "mtdna label", "naming convention of dna", "dna convention", "dna name"],
    note: "Printed naming convention 'DNA' positioned at mid-left of diagram."
  },
  {
    id: "label-cristae",
    label: "Cristae Label",
    category: "label",
    color: "#00d2d3",
    x: 113, y: 244, w: 61, h: 28,
    aliases: ["cristae label", "label cristae", "cristae naming", "cristae text", "naming convention of cristae", "cristae convention", "cristae name"],
    note: "Printed naming convention 'Cristae' positioned at bottom center-left of diagram."
  },
  {
    id: "label-ribosomes",
    label: "Ribosomes Label",
    category: "label",
    color: "#00d2d3",
    x: 311, y: 223, w: 72, h: 15,
    aliases: ["ribosomes label", "label ribosomes", "ribosomes naming", "ribosomes text", "naming convention of ribosomes", "ribosomes convention", "ribosomes name"],
    note: "Printed naming convention 'Ribosomes' positioned at mid-right of diagram."
  },
  {
    id: "label-atp-synthase",
    label: "F0F1-ATPase Label",
    category: "label",
    color: "#00d2d3",
    x: 15, y: 265, w: 125, h: 24,
    aliases: ["atp synthase label", "label atp synthase", "f0f1-atpase label", "atp synthase naming", "atp synthase text", "naming convention of atp synthase", "atp synthase convention", "atpase label"],
    note: "Printed naming convention 'F0F1-ATPase' (and F0/F1 portion) positioned at bottom left of diagram."
  },
];

export const mitochondriaBoardRegions: DiagramRegion[] = mitochondriaDetailedRegions.map(r => ({
  ...r,
  x: r.x + MITOCHONDRIA_IMAGE_LAYOUT.x,
  y: r.y + MITOCHONDRIA_IMAGE_LAYOUT.y,
}));
