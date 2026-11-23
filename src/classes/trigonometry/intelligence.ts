import type { DiagramRegion } from "@/lib/types";

export const TRIG_IMAGE_LAYOUT = { x: 540, y: 25, w: 390, h: 275 } as const;

export const trigRegions: DiagramRegion[] = [
  {
    id: "hypotenuse",
    label: "Hypotenuse (H)",
    category: "structure",
    color: "#d35400", // Vibrant amber/orange: contrasts sharply against green line and pale green triangle
    x: 150,
    y: 80,
    w: 180,
    h: 150,
    aliases: [
      "hypotenuse",
      "hyp",
      "side c",
      "longest side",
      "slanted side",
      "diagonal",
      "diagonal side"
    ],
    note: "The longest side of a right-angled triangle, always situated directly opposite the 90-degree right angle."
  },
  {
    id: "opposite",
    label: "Opposite Side (O)",
    category: "structure",
    color: "#00d2d3", // Electric cyan: sharp complementary contrast against purple opposite leg
    x: 10,
    y: 45,
    w: 65,
    h: 215,
    aliases: [
      "opposite",
      "opp",
      "side a",
      "vertical side",
      "perpendicular",
      "height"
    ],
    note: "The side located strictly opposite the chosen acute reference angle theta."
  },
  {
    id: "adjacent",
    label: "Adjacent Side (A)",
    category: "structure",
    color: "#ff2a7a", // Vivid magenta/rose: sharp contrast against blue adjacent leg
    x: 70,
    y: 255,
    w: 280,
    h: 50,
    aliases: [
      "adjacent",
      "adj",
      "side b",
      "base",
      "horizontal side",
      "bottom side"
    ],
    note: "The side adjacent to (touching) the acute angle theta that is not the hypotenuse."
  },
  {
    id: "angle-theta",
    label: "Angle Theta (θ)",
    category: "structure",
    color: "#00d2d3", // Electric cyan: sharp contrast against terracotta arc
    x: 295,
    y: 230,
    w: 55,
    h: 45,
    aliases: [
      "theta",
      "angle",
      "acute angle",
      "reference angle",
      "angle theta",
      "θ"
    ],
    note: "The acute reference angle theta governing all trigonometric ratios."
  },
  {
    id: "right-angle",
    label: "Right Angle (90°)",
    category: "structure",
    color: "#e74c3c", // Bright red: sharp contrast against dark green right-angle square
    x: 70,
    y: 230,
    w: 35,
    h: 35,
    aliases: [
      "90 degrees",
      "right angle",
      "perpendicular angle",
      "square angle",
      "90°"
    ],
    note: "The 90-degree right angle defining the right-angled triangle."
  },
  {
    id: "soh-cah-toa",
    label: "SOH-CAH-TOA Mnemonic",
    category: "label",
    color: "#d35400", // Vibrant amber
    x: 235,
    y: 10,
    w: 175,
    h: 66,
    aliases: [
      "soh cah toa",
      "sohcahtoa",
      "mnemonic",
      "trig ratios",
      "formulas",
      "ratio badge"
    ],
    note: "The universal memory tool: Sine = Opp/Hyp, Cosine = Adj/Hyp, Tangent = Opp/Adj."
  }
];

export const trigBoardRegions: DiagramRegion[] = [
  // Mapped from diagram image coordinates to board space
  ...trigRegions.map(r => ({
    ...r,
    x: Math.round(TRIG_IMAGE_LAYOUT.x + (r.x * TRIG_IMAGE_LAYOUT.w) / 420),
    y: Math.round(TRIG_IMAGE_LAYOUT.y + (r.y * TRIG_IMAGE_LAYOUT.h) / 320),
    w: Math.round((r.w * TRIG_IMAGE_LAYOUT.w) / 420),
    h: Math.round((r.h * TRIG_IMAGE_LAYOUT.h) / 320),
  })),
  // Board-native formula regions on the left side
  {
    id: "sine-ratio",
    label: "Sine Ratio: sin(θ) = Opp / Hyp",
    category: "label",
    color: "#3b805c",
    x: 52,
    y: 110,
    w: 380,
    h: 42,
    aliases: ["sine", "sin", "sin theta", "sine ratio", "opposite over hypotenuse"],
    note: "sin(θ) = Opposite / Hypotenuse"
  },
  {
    id: "cosine-ratio",
    label: "Cosine Ratio: cos(θ) = Adj / Hyp",
    category: "label",
    color: "#507aaf",
    x: 52,
    y: 155,
    w: 380,
    h: 42,
    aliases: ["cosine", "cos", "cos theta", "cosine ratio", "adjacent over hypotenuse"],
    note: "cos(θ) = Adjacent / Hypotenuse"
  },
  {
    id: "tangent-ratio",
    label: "Tangent Ratio: tan(θ) = Opp / Adj",
    category: "label",
    color: "#8a6a9e",
    x: 52,
    y: 200,
    w: 380,
    h: 42,
    aliases: ["tangent", "tan", "tan theta", "tangent ratio", "opposite over adjacent", "slope"],
    note: "tan(θ) = Opposite / Adjacent"
  },
  {
    id: "pythagorean-identity",
    label: "Pythagorean Identity: sin²(θ) + cos²(θ) = 1",
    category: "label",
    color: "#bc7948",
    x: 52,
    y: 245,
    w: 380,
    h: 45,
    aliases: ["pythagorean identity", "identity", "sin squared plus cos squared", "unit circle identity"],
    note: "sin²(θ) + cos²(θ) = 1"
  }
];
