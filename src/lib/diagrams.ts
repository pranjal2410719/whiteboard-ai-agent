import type { BoardMark, BoardPage, DiagramRegion } from "./types";
import { cellBoardRegions, mitochondriaDetailedRegions, trigBoardRegions, TRIG_IMAGE_LAYOUT } from "@/classes";

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
  /** Regions in image-local coordinates (0,0 = image top-left) or board coordinates. */
  regions: DiagramRegion[];
};

const ink = "#293b32", green = "#3b805c", blue = "#507aaf", orange = "#bc7948", purple = "#8a6a9e";

export const mitochondriaRegions: DiagramRegion[] = mitochondriaDetailedRegions;

export const diagrams: Record<string, DiagramDefinition> = {
  "human-cell": {
    key: "human-cell",
    title: "Human Cell",
    subject: "Biology",
    src: "/assets/human_cell_diagram.png",
    alt: "Human Cell Anatomy and Organelles",
    intro: "Tour the organelles inside a living human cell.",
    prompts: ["“Circle the nucleus”", "“Highlight the mitochondria”", "“Underline the cell membrane”", "“Locate rough ER & ribosomes”"],
    image: { x: 610, y: 14, w: 232, h: 310 },
    regions: cellBoardRegions,
  },
  "cell-diagram": {
    key: "cell-diagram",
    title: "Human Cell",
    subject: "Biology",
    src: "/assets/human_cell_diagram.png",
    alt: "Human Cell Anatomy and Organelles",
    intro: "Tour the organelles inside a living human cell.",
    prompts: ["“Circle the nucleus”", "“Highlight the mitochondria”", "“Underline the cell membrane”", "“Locate rough ER & ribosomes”"],
    image: { x: 610, y: 14, w: 232, h: 310 },
    regions: cellBoardRegions,
  },
  "mitochondria": {
    key: "mitochondria",
    title: "Mitochondria (The Cell's Powerhouse)",
    subject: "Biology",
    src: "/assets/Mitochondria.png",
    alt: "Mitochondria Anatomy & ATP Synthesis",
    intro: "Explore double membrane structure, folded cristae, and ATP cellular respiration.",
    prompts: ["“Highlight the cristae”", "“Circle the outer membrane”", "“Where is the matrix?”", "“Underline the Cristae label”"],
    image: { x: 550, y: 12, w: 390, h: 310 },
    regions: mitochondriaRegions,
  },
  "mitochondria-diagram": {
    key: "mitochondria-diagram",
    title: "Mitochondria (The Cell's Powerhouse)",
    subject: "Biology",
    src: "/assets/Mitochondria.png",
    alt: "Mitochondria Anatomy & ATP Synthesis",
    intro: "Explore double membrane structure, folded cristae, and ATP cellular respiration.",
    prompts: ["“Highlight the cristae”", "“Circle the outer membrane”", "“Where is the matrix?”", "“Underline the Cristae label”"],
    image: { x: 550, y: 12, w: 390, h: 310 },
    regions: mitochondriaRegions,
  },
  "trigonometry": {
    key: "trigonometry",
    title: "Trigonometry & Right Triangles",
    subject: "Mathematics",
    src: "/assets/trigonometry-triangle.svg",
    alt: "Right-Angled Triangle Trigonometry & SOH-CAH-TOA",
    intro: "Master sine, cosine, tangent (SOH-CAH-TOA) and Pythagorean identities.",
    prompts: ["“Highlight the hypotenuse”", "“Circle angle theta”", "“Explain SOH-CAH-TOA”", "“Where is the opposite side?”"],
    image: TRIG_IMAGE_LAYOUT,
    regions: trigBoardRegions,
  },
  "trigonometry-diagram": {
    key: "trigonometry-diagram",
    title: "Trigonometry & Right Triangles",
    subject: "Mathematics",
    src: "/assets/trigonometry-triangle.svg",
    alt: "Right-Angled Triangle Trigonometry & SOH-CAH-TOA",
    intro: "Master sine, cosine, tangent (SOH-CAH-TOA) and Pythagorean identities.",
    prompts: ["“Highlight the hypotenuse”", "“Circle angle theta”", "“Explain SOH-CAH-TOA”", "“Where is the opposite side?”"],
    image: TRIG_IMAGE_LAYOUT,
    regions: trigBoardRegions,
  },
};

export const isDiagramKey = (key: string): key is keyof typeof diagrams => Object.hasOwn(diagrams, key);

const hand = (x: number, y: number, text: string, size = 25, color = ink): BoardMark =>
  ({ type: "text", x, y, text, size, color, weight: 500 });

export function diagramPage(key: string): BoardPage {
  const def = diagrams[key] || diagrams["human-cell"];
  const { x, y, w, h } = def.image;
  const isAlreadyBoardCoords = def.regions === cellBoardRegions || def.regions === trigBoardRegions;
  const regions: DiagramRegion[] = def.regions.map(r => ({
    ...r,
    x: isAlreadyBoardCoords ? r.x : r.x + x,
    y: isAlreadyBoardCoords ? r.y : r.y + y,
  }));
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
