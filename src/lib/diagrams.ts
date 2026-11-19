import type { BoardMark, BoardPage, DiagramRegion } from "./types";

/**
 * Diagram-backed lesson boards.
 *
 * Each definition pairs a bundled image with named regions declared in image-local
 * coordinates. At board time the image is placed at a fixed spot and every region is
 * shifted into board coordinates, so the tutor can address a component by name and the
 * router can draw an accurate circle, highlight, box, underline or arrow around it.
 */

export type DiagramDefinition = {
  key: string;
  title: string;
  subject: string;
  src: string;
  alt: string;
  intro: string;
  prompts: string[];
  image: { x: number; y: number; w: number; h: number };
  /** Regions in image-local coordinates (0,0 = image top-left). */
  regions: DiagramRegion[];
};

const IMAGE = { x: 515, y: 30, w: 430, h: 270 };
const ink = "#293b32", green = "#3b805c", blue = "#507aaf", orange = "#bc7948", purple = "#8a6a9e";

const cellRegions: DiagramRegion[] = [
  { id: "membrane", label: "Cell membrane", x: 10, y: 23, w: 320, h: 224, aliases: ["plasma membrane", "boundary", "wall"], note: "The cell membrane is the outer lipid bilayer. It holds the cell together and controls what enters and leaves, letting nutrients in and waste out." },
  { id: "nucleus", label: "Nucleus (DNA)", x: 68, y: 64, w: 88, h: 88, aliases: ["dna", "nucleolus", "genetic blueprint"], note: "The nucleus stores the cell’s DNA and acts as city hall: it decides which proteins the cell builds and when." },
  { id: "mitochondria", label: "Mitochondria", x: 207, y: 53, w: 86, h: 50, aliases: ["powerhouse", "atp", "cristae"], note: "Mitochondria are the power plants. They carry out cellular respiration, turning glucose and oxygen into ATP energy." },
  { id: "rough-er", label: "Rough ER", x: 154, y: 146, w: 82, h: 58, aliases: ["er", "endoplasmic reticulum", "ribosome", "ribosomes"], note: "The rough ER is studded with ribosomes. Proteins are assembled on those ribosomes and folded inside the ER before shipping." },
  { id: "golgi", label: "Golgi body", x: 34, y: 188, w: 66, h: 44, aliases: ["golgi apparatus", "golgi sacs", "packaging"], note: "The Golgi body is the cell’s post office. It packages finished proteins into vesicles and addresses them to their destination." },
  { id: "cytoplasm", label: "Cytoplasm", x: 24, y: 34, w: 292, h: 202, aliases: ["cytosol", "jelly"], note: "The cytoplasm is the jelly-like fluid that suspends the organelles and hosts most of the cell’s chemical reactions." },
];

const waterRegions: DiagramRegion[] = [
  { id: "sun", label: "Sun (heat)", x: 26, y: 22, w: 70, h: 70, aliases: ["heat", "energy", "sunlight"], note: "The Sun supplies the heat energy that drives the whole cycle. Without it, water would stay in the lake." },
  { id: "evaporation", label: "Evaporation", x: 100, y: 108, w: 88, h: 96, aliases: ["vapor", "vapour", "rising"], note: "Evaporation turns liquid water into vapour. Heated surface water escapes upward as an invisible gas." },
  { id: "condensation", label: "Condensation (cloud)", x: 186, y: 42, w: 146, h: 60, aliases: ["cloud", "clouds", "droplets"], note: "Condensation is vapour cooling back into tiny droplets. Those droplets gather into the cloud you see." },
  { id: "precipitation", label: "Precipitation", x: 198, y: 104, w: 104, h: 44, aliases: ["rain", "snow", "hail", "falling"], note: "Precipitation is water returning to Earth. When droplets grow heavy enough, gravity pulls them down as rain, snow or hail." },
  { id: "collection", label: "Collection (lake)", x: 36, y: 206, w: 352, h: 48, aliases: ["lake", "puddle", "groundwater", "runoff", "ocean"], note: "Collection is water gathering in lakes, rivers and oceans, ready to be heated and evaporated again." },
];

export const diagrams: Record<string, DiagramDefinition> = {
  "cell-diagram": {
    key: "cell-diagram",
    title: "Annotated cell diagram",
    subject: "Biology",
    src: "/diagrams/human-cell.svg",
    alt: "labelled human cell diagram",
    intro: "Every part of this cell has a job.",
    prompts: ["“Circle the nucleus”", "“Highlight the mitochondria”", "“Underline the cell membrane”"],
    image: IMAGE,
    regions: cellRegions,
  },
  "water-diagram": {
    key: "water-diagram",
    title: "Annotated water cycle",
    subject: "Science",
    src: "/diagrams/water-cycle.svg",
    alt: "labelled water cycle diagram",
    intro: "Follow one drop around the planet.",
    prompts: ["“Circle the cloud”", "“Highlight evaporation”", "“Point to the lake”"],
    image: IMAGE,
    regions: waterRegions,
  },
};

export const isDiagramKey = (key: string): key is keyof typeof diagrams => Object.hasOwn(diagrams, key);

const hand = (x: number, y: number, text: string, size = 25, color = ink): BoardMark =>
  ({ type: "text", x, y, text, size, color, weight: 500 });

export function diagramPage(key: string): BoardPage {
  const def = diagrams[key] || diagrams["cell-diagram"];
  const { x, y, w, h } = def.image;
  const regions: DiagramRegion[] = def.regions.map(r => ({ ...r, x: r.x + x, y: r.y + y }));
  const marks: BoardMark[] = [
    { type: "text", x: 53, y: 57, text: def.title, size: 42, color: ink, weight: 650 },
    { type: "path", d: "M55 69 Q255 65 470 68", color: "#84b998", strokeWidth: 3.6, fill: "none" },
    hand(55, 112, def.intro, 26),
    hand(55, 164, "Tap the mic and ask:", 21, purple),
    ...def.prompts.map((prompt, i) => hand(55, 197 + i * 29, prompt, 23, [green, blue, orange][i % 3])),
    { type: "image", x, y, w, h, src: def.src, alt: def.alt, color: "#a8c2ae", strokeWidth: 1.2 },
    hand(55, 300, "The tutor marks the exact part you name.", 19),
  ];
  return { id: def.key, title: def.title, marks, ink: [], cursor: { x: 905, y: 272 }, regions };
}
