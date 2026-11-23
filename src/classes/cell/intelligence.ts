import type { DiagramRegion } from "@/lib/types";

export const CELL_BASE_LAYOUT = { x: 295, y: 40, w: 410, h: 255 } as const;

export const cellRegions: DiagramRegion[] = [
  {
    id: "membrane",
    label: "Cell Membrane",
    color: "#8a6a9e", // Rich purple border
    x: 10,
    y: 15,
    w: 290,
    h: 235,
    aliases: ["plasma membrane", "cell membrane", "boundary", "outer membrane", "cell boundary", "membrane", "cell_membrane", "lipid bilayer"],
    note: "The flexible, selectively permeable lipid bilayer enclosing the animal cell and regulating molecular transport.",
  },
  {
    id: "cytoplasm",
    label: "Cytoplasm",
    color: "#0984e3", // Electric blue: clear visibility on interior cytosol
    x: 50,
    y: 60,
    w: 200,
    h: 140,
    aliases: ["cytosol", "jelly", "cytoplasm", "cellular fluid", "working space"],
    note: "The water-rich nutrient jelly filling the cellular interior where organelles suspend and chemical reactions occur.",
  },
  {
    id: "nucleus",
    label: "Nucleus",
    color: "#e74c3c", // Vibrant red: highest contrast against nucleus interior
    x: 165,
    y: 85,
    w: 80,
    h: 72,
    aliases: ["dna", "genetic blueprint", "master control", "nucleus", "control centre", "control center"],
    note: "The master control center containing chromosomal DNA that directs cellular activity and gene transcription.",
  },
  {
    id: "nucleolus",
    label: "Nucleolus",
    color: "#c0392b", // Deep crimson
    x: 195,
    y: 115,
    w: 26,
    h: 26,
    aliases: ["nucleolus", "ribosome synthesis", "rRNA", "nucleoli"],
    note: "Dense sub-organelle inside the nucleus responsible for synthesizing ribosomal RNA and assembling ribosome subunits.",
  },
  {
    id: "mitochondria",
    label: "Mitochondria",
    color: "#d35400", // Warm orange: matches mitochondrial respiration theme
    x: 90,
    y: 180,
    w: 55,
    h: 42,
    aliases: ["powerhouse", "powerhouse of the cell", "atp", "cristae", "mitochondrion", "microcondria", "mitochondria", "cellular respiration"],
    note: "The powerhouse of the cell: generates most cellular ATP energy through aerobic respiration.",
  },
  {
    id: "rough-er",
    label: "Rough Endoplasmic Reticulum (RER)",
    color: "#8a6a9e", // Purple
    x: 135,
    y: 70,
    w: 52,
    h: 60,
    aliases: ["rer", "rough er", "rough endoplasmic reticulum", "protein synthesis er"],
    note: "Membranous network studded with ribosomes; synthesizes, folds, and processes secretory proteins.",
  },
  {
    id: "smooth-er",
    label: "Smooth Endoplasmic Reticulum (SER)",
    color: "#00d2d3", // Electric cyan
    x: 140,
    y: 155,
    w: 45,
    h: 36,
    aliases: ["ser", "smooth er", "smooth endoplasmic reticulum", "lipid synthesis", "detoxification"],
    note: "Ribosome-free tubular membrane network synthesizing lipids and phospholipids, and detoxifying chemicals.",
  },
  {
    id: "golgi",
    label: "Golgi Apparatus",
    color: "#16a34a", // Vibrant emerald green
    x: 215,
    y: 160,
    w: 58,
    h: 42,
    aliases: ["golgi body", "golgi", "golgi apparatus", "vesicles", "packaging", "golgi_body", "golgi complex"],
    note: "Flattened membranous sacs that modify, sort, and package proteins and lipids for transport or secretion.",
  },
  {
    id: "ribosomes",
    label: "Ribosomes",
    color: "#ff2a7a", // Vivid rose
    x: 155,
    y: 95,
    w: 25,
    h: 25,
    aliases: ["ribosome", "ribosomes", "protein factory", "protein factories", "translation"],
    note: "Microscopic RNA-protein machines that translate genetic code into functional proteins.",
  },
  {
    id: "vesicles",
    label: "Vesicles & Lysosomes",
    color: "#0984e3", // Vivid blue
    x: 250,
    y: 120,
    w: 26,
    h: 26,
    aliases: ["vesicle", "vesicles", "lysosome", "lysosomes", "vacuole", "vacuoles", "transport vesicle"],
    note: "Small membrane-bound sacs functioning in cargo transport, cellular digestion, and waste management.",
  },
];

export const cellBoardRegions: DiagramRegion[] = cellRegions.map(r => ({
  ...r,
  x: r.x + CELL_BASE_LAYOUT.x,
  y: r.y + CELL_BASE_LAYOUT.y,
}));
