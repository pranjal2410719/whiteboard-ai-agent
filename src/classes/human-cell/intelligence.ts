import type { DiagramRegion } from "@/lib/types";

export const cellRegions: DiagramRegion[] = [
  { id: "membrane", label: "Cell membrane", x: 16, y: 20, w: 200, h: 270, aliases: ["plasma membrane", "boundary", "wall", "membrane", "cell_membrane"], note: "The cell membrane is the outer lipid bilayer. It holds the cell together and controls what enters and leaves, letting nutrients in and waste out." },
  { id: "nucleus", label: "Nucleus (DNA)", x: 78, y: 105, w: 76, h: 66, aliases: ["dna", "nucleolus", "genetic blueprint", "nucleus"], note: "The nucleus stores the cell’s DNA and acts as master control: it directs protein synthesis and cellular replication." },
  { id: "mitochondria", label: "Mitochondria", x: 34, y: 183, w: 64, h: 44, aliases: ["powerhouse", "atp", "cristae", "mitochondrion"], note: "Mitochondria are the power plants. They carry out cellular respiration, turning glucose and oxygen into ATP energy." },
  { id: "rough-er", label: "Rough ER & Ribosomes", x: 37, y: 114, w: 60, h: 84, aliases: ["er", "endoplasmic reticulum", "ribosome", "ribosomes", "rough_er"], note: "The rough ER is studded with ribosomes. Proteins are assembled on those ribosomes and folded inside the ER before shipping." },
  { id: "golgi", label: "Golgi body", x: 115, y: 78, w: 60, h: 48, aliases: ["golgi apparatus", "golgi sacs", "packaging", "golgi_body"], note: "The Golgi body is the cell’s post office. It packages finished proteins into vesicles and addresses them to their destination." },
  { id: "cytoplasm", label: "Cytoplasm", x: 20, y: 30, w: 192, h: 250, aliases: ["cytosol", "jelly", "cytoplasm"], note: "The cytoplasm is the jelly-like fluid that suspends the organelles and hosts most of the cell’s chemical reactions." },
];
