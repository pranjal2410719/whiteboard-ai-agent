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

const circuitRegions: DiagramRegion[] = [
  { id: "battery", label: "Battery (DC Source)", x: 30, y: 110, w: 65, h: 70, aliases: ["voltage source", "power supply", "cell", "positive plate"], note: "The battery supplies electromotive force (EMF) creating a potential difference across the circuit." },
  { id: "switch", label: "Control Switch", x: 150, y: 38, w: 70, h: 50, aliases: ["key", "switch s", "circuit breaker"], note: "The switch controls circuit continuity; when closed, conductive contact allows current to flow." },
  { id: "resistor", label: "Resistor (R)", x: 320, y: 110, w: 85, h: 55, aliases: ["resistance", "ohmic resistor", "load resistance"], note: "The resistor opposes electric current according to Ohm's Law (V = IR) and limits amperage." },
  { id: "lamp", label: "Lamp / Load", x: 170, y: 185, w: 65, h: 55, aliases: ["light bulb", "bulb", "load"], note: "The lamp converts electrical energy into light and thermal heat." },
  { id: "current", label: "Current Flow (I)", x: 95, y: 50, w: 60, h: 35, aliases: ["amperage", "conventional current", "i"], note: "Conventional current flows from the positive terminal toward the negative terminal." },
];

const inclinedRegions: DiagramRegion[] = [
  { id: "block", label: "Mass Block (m)", x: 160, y: 115, w: 70, h: 55, aliases: ["mass", "box", "sled", "object"], note: "The block of mass m rests on the inclined surface at slope angle θ." },
  { id: "normal-force", label: "Normal Force (F_N)", x: 160, y: 65, w: 55, h: 55, aliases: ["fn", "perpendicular force", "reaction force"], note: "Normal force acts perpendicular to the inclined plane: F_N = mg cos θ." },
  { id: "friction", label: "Kinetic Friction (f_k)", x: 115, y: 135, w: 55, h: 40, aliases: ["fk", "sliding friction", "resistance"], note: "Friction resists motion along the incline surface: f_k = μ · F_N." },
  { id: "gravity", label: "Gravity Force (F_g = mg)", x: 185, y: 145, w: 50, h: 70, aliases: ["weight", "fg", "gravitational force", "mg"], note: "Gravity pulls vertically straight down toward Earth's center: F_g = mg." },
  { id: "pull-force", label: "Pulling Force (F_pull)", x: 230, y: 95, w: 60, h: 45, aliases: ["tension", "fpull", "applied force"], note: "Applied force pulling the mass block up the incline." },
  { id: "incline-angle", label: "Incline Angle (θ)", x: 110, y: 185, w: 35, h: 35, aliases: ["theta", "slope angle", "ramp angle"], note: "The slope angle θ governs the vector decomposition of gravitational weight." },
];

const heartRegions: DiagramRegion[] = [
  { id: "superior-vena-cava", label: "Superior Vena Cava", x: 43, y: 20, w: 52, h: 55, aliases: ["svc", "upper vena cava", "superior cava"], note: "Vein delivering deoxygenated blood from upper body into the right atrium." },
  { id: "inferior-vena-cava", label: "Inferior Vena Cava", x: 40, y: 206, w: 45, h: 54, aliases: ["ivc", "lower vena cava", "inferior cava"], note: "Vein returning deoxygenated blood from lower body into right atrium." },
  { id: "right-atrium", label: "Right Atrium", x: 46, y: 83, w: 56, h: 82, aliases: ["ra", "right auricle"], note: "Receives deoxygenated venous blood and sends it through tricuspid valve into right ventricle." },
  { id: "tricuspid-valve", label: "Tricuspid Valve", x: 69, y: 158, w: 58, h: 36, aliases: ["tricuspid", "right av valve"], note: "Three-flap valve preventing backflow into right atrium during ventricular contraction." },
  { id: "right-ventricle", label: "Right Ventricle", x: 83, y: 175, w: 125, h: 56, aliases: ["rv", "pulmonary pump"], note: "Pumps deoxygenated blood through pulmonary valve into the pulmonary arteries toward lungs." },
  { id: "pulmonary-valve", label: "Pulmonary Valve", x: 92, y: 144, w: 48, h: 33, aliases: ["pulmonic valve", "pulmonary semilunar valve"], note: "Semilunar valve preventing backflow from pulmonary artery into right ventricle." },
  { id: "pulmonary-artery", label: "Pulmonary Artery", x: 96, y: 52, w: 119, h: 92, aliases: ["pulmonary trunk", "lung artery"], note: "Transports deoxygenated blood toward the lungs for re-oxygenation." },
  { id: "aorta", label: "Aorta Arch", x: 83, y: 9, w: 89, h: 80, aliases: ["aortic arch", "systemic artery"], note: "Main arterial trunk carrying high-pressure oxygenated blood from left ventricle to the entire body." },
  { id: "pulmonary-veins", label: "Pulmonary Veins", x: 185, y: 77, w: 63, h: 50, aliases: ["lung veins", "pulmonary vein"], note: "Bring oxygen-rich blood from lungs directly into left atrium." },
  { id: "left-atrium", label: "Left Atrium", x: 132, y: 80, w: 65, h: 56, aliases: ["la", "left auricle"], note: "Receives oxygenated blood from lungs and funnels it into left ventricle." },
  { id: "bicuspid-valve", label: "Bicuspid (Mitral) Valve", x: 155, y: 128, w: 52, h: 32, aliases: ["mitral valve", "bicuspid"], note: "Valve preventing backflow into left atrium when left ventricle contracts." },
  { id: "aortic-valve", label: "Aortic Valve", x: 135, y: 136, w: 32, h: 31, aliases: ["aortic semilunar valve"], note: "Semilunar valve preventing backflow into left ventricle." },
  { id: "left-ventricle", label: "Left Ventricle", x: 149, y: 140, w: 85, h: 82, aliases: ["lv", "systemic pump"], note: "Most muscular chamber generating systemic pressure to pump oxygenated blood into aorta." },
  { id: "septum", label: "Interventricular Septum", x: 114, y: 176, w: 40, h: 65, aliases: ["septum", "ventricular septum", "cardiac wall"], note: "Thick muscular partition preventing mixing of oxygenated (left) and deoxygenated (right) blood." },
];

export const diagrams: Record<string, DiagramDefinition> = {
  "cell-diagram": {
    key: "cell-diagram",
    title: "Annotated cell diagram",
    subject: "Biology",
    src: "/assets/human-cell.svg",
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
    src: "/assets/water-cycle.svg",
    alt: "labelled water cycle diagram",
    intro: "Follow one drop around the planet.",
    prompts: ["“Circle the cloud”", "“Highlight evaporation”", "“Point to the lake”"],
    image: IMAGE,
    regions: waterRegions,
  },
  "circuit-diagram": {
    key: "circuit-diagram",
    title: "DC Electric Circuit",
    subject: "Physics",
    src: "/assets/electric-circuit.svg",
    alt: "labelled DC electric circuit diagram",
    intro: "Explore voltage, current, resistance and load.",
    prompts: ["“Circle the battery”", "“Highlight the resistor”", "“Trace current flow”"],
    image: IMAGE,
    regions: circuitRegions,
  },
  "inclined-diagram": {
    key: "inclined-diagram",
    title: "Inclined Plane Mechanics",
    subject: "Physics",
    src: "/assets/inclined-plane.svg",
    alt: "labelled inclined plane physics diagram",
    intro: "Resolve forces on a mass block on an incline.",
    prompts: ["“Highlight normal force”", "“Circle the mass block”", "“Where is friction?”"],
    image: IMAGE,
    regions: inclinedRegions,
  },
  "heart-diagram": {
    key: "heart-diagram",
    title: "Human Heart & Blood Flow",
    subject: "Anatomy",
    src: "/assets/human-heart_med-removebg-preview.png",
    alt: "labelled diagram of human heart anatomy and blood flow",
    intro: "Follow blood flow through chambers, valves, and vessels.",
    prompts: ["“Circle the left ventricle”", "“Highlight the aorta”", "“Where is the tricuspid valve?”", "“Trace blood flow from vena cava”"],
    image: { x: 580, y: 16, w: 270, h: 298 },
    regions: heartRegions,
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
