import type { DiagramRegion } from "@/lib/types";

export const CELL_IMAGE_LAYOUT = { x: 610, y: 14, w: 232, h: 310 } as const;

export const cellRegions: DiagramRegion[] = [
  {
    id: "membrane",
    label: "Cell Membrane",
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
    x: 34,
    y: 183,
    w: 64,
    h: 44,
    aliases: ["powerhouse", "atp", "cristae", "mitochondrion", "cellular respiration"],
    note: "The powerhouse organelle executing cellular respiration to generate ATP energy."
  },
  {
    id: "rough-er",
    label: "Rough ER & Ribosomes",
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
