import type { BoardMark, BoardPage, LayoutPatternType, LessonCue } from "@/lib/types";
import { head, txt, circle, arrow, penHighlight, green, blue, orange, purple, box } from "../helpers";
import { trigBoardRegions, TRIG_IMAGE_LAYOUT } from "./intelligence";
import { buildPageWithLayout, LayoutPatternEngine } from "@/lib/layout";
import script from "./script.json";

export const trigImg = (x = TRIG_IMAGE_LAYOUT.x, y = TRIG_IMAGE_LAYOUT.y, w = TRIG_IMAGE_LAYOUT.w, h = TRIG_IMAGE_LAYOUT.h): BoardMark => ({
  type: "image",
  src: "/assets/trigonometry-triangle.svg",
  x,
  y,
  w,
  h,
  alt: "Right-Angled Triangle Trigonometry & SOH-CAH-TOA",
});

export const trigInitialBoard: BoardPage = {
  id: "trigonometry-initial",
  title: "Trigonometry & Right Triangles",
  layoutPattern: "classic-split",
  seconds: 0,
  narration: "Welcome to Trigonometry! Today we explore right-angled triangles, the three foundational ratios—sine, cosine, and tangent—and the universal memory formula SOH-CAH-TOA.",
  cues: [],
  ink: [],
  cursor: { x: 852, y: 250 },
  regions: trigBoardRegions,
  marks: [
    ...head("Trigonometry & Right Triangles", 430),
    txt(55, 120, "Interactive Ratios & Angle Geometry", 28, green),
    txt(55, 175, "1. Sine (sin θ) = Opposite / Hypotenuse", 25, green),
    txt(55, 215, "2. Cosine (cos θ) = Adjacent / Hypotenuse", 25, blue),
    txt(55, 255, "3. Tangent (tan θ) = Opposite / Adjacent", 25, purple),
    txt(55, 295, "4. SOH - CAH - TOA Universal Mnemonic", 25, orange),
    trigImg(),
  ],
};

export const trigSceneBoards: BoardMark[][][] = [
  // Scene 1: Right Triangles and Reference Angles (28s total) - Layout: classic-split
  [
    // Cue 1 (9s: 90° angle & Hypotenuse)
    [
      ...head("The Right-Angled Triangle", 410),
      trigImg(),
      txt(55, 120, "One angle is always exactly 90°.", 28, green),
      txt(55, 168, "Hypotenuse (c): Longest side facing 90°", 26, green),
      circle(740, 145, 90, 50, green, 2.8, 35),
      arrow(880, 85, 790, 115, green),
      txt(885, 85, "Hypotenuse (H)", 16, green, 650, "start"),
    ],
    // Cue 2 (9s: Reference angle θ, Opposite & Adjacent)
    [
      txt(55, 212, "Reference angle θ defines the two legs:", 27, blue),
      circle(838, 240, 26, 20, orange, 2.8),
      arrow(890, 240, 860, 240, orange),
      txt(895, 245, "Angle θ", 16, orange, 650, "start"),
      arrow(540, 140, 575, 140, purple),
      txt(535, 145, "Opposite (O)", 16, purple, 650, "end"),
    ],
    // Cue 3 (10s: Role swapping & fixed Hypotenuse)
    [
      ...penHighlight(55, 250, 390, "Hypotenuse is always fixed opposite 90°", 30),
      txt(55, 305, "Opposite faces angle θ · Adjacent touches angle θ", 24, green),
    ],
  ],

  // Scene 2: The Primary Ratios: Sine and Cosine (34s total) - Layout: multi-panel-comparison
  [
    // Cue 1 (10s: Sine definition - Left Comparative Panel)
    [
      ...head("Sine Ratio: Opp / Hyp", 370),
      box(45, 75, 435, 235, "#eef6f0", green),
      box(55, 84, 110, 18, green, green),
      txt(110, 97, "SINE RATIO", 11, "#ffffff", 700, "middle"),
      trigImg(),
      txt(55, 118, "Sine measures vertical rise over hypotenuse:", 28, green),
      txt(55, 160, "sin(θ) = Opposite / Hypotenuse", 29, green, 700),
      circle(590, 145, 30, 85, purple, 2.6),
      circle(740, 145, 90, 50, green, 2.6, 35),
      arrow(520, 160, 570, 160, green),
    ],
    // Cue 2 (12s: Cosine definition - Right Comparative Panel)
    [
      box(505, 75, 450, 235, "#eef4fb", blue),
      box(515, 84, 115, 18, blue, blue),
      txt(572, 97, "COSINE RATIO", 11, "#ffffff", 700, "middle"),
      txt(55, 208, "Cosine measures horizontal base over hypotenuse:", 27, blue),
      txt(55, 248, "cos(θ) = Adjacent / Hypotenuse", 29, blue, 700),
      circle(720, 262, 115, 25, blue, 2.8),
      arrow(720, 305, 720, 275, blue),
      txt(720, 312, "Adjacent Leg (b)", 15, blue, 600, "middle"),
    ],
    // Cue 3 (12s: Unit circle & wave connection + Center VS badge)
    [
      box(468, 170, 36, 30, "#ffffff", orange),
      txt(486, 191, "VS", 15, orange, 700, "middle"),
      ...penHighlight(55, 282, 380, "Coordinates on unit circle: (cos θ, sin θ)", 28, "#d5e8d4"),
    ],
  ],

  // Scene 3: Tangent and the SOH-CAH-TOA Memory Tool (34s total) - Layout: centered-focal-hero
  [
    // Cue 1 (8s: Tangent definition & slope)
    [
      ...head("Tangent: Opp / Adj & SOH-CAH-TOA", 440),
      box(45, 75, 420, 105, "#f7f1fb", purple),
      trigImg(),
      txt(55, 118, "Tangent compares the two perpendicular legs:", 28, purple),
      txt(55, 158, "tan(θ) = Opposite / Adjacent = sin(θ) / cos(θ)", 27, purple, 700),
    ],
    // Cue 2 (5s: Hold cue)
    [],
    // Cue 3 (11s: SOH CAH TOA formula highlight - Focal Card)
    [
      box(45, 186, 425, 135, "#fff9e6", "#d4a017", 1.8),
      ...penHighlight(55, 198, 410, "SOH  ·  CAH  ·  TOA", 36, "#ffe6cc"),
      txt(55, 250, "SOH: Sin = Opp / Hyp", 25, green, 650),
      txt(55, 280, "CAH: Cos = Adj / Hyp", 25, blue, 650),
      txt(55, 310, "TOA: Tan = Opp / Adj", 25, purple, 650),
      circle(855, 48, 85, 32, orange, 2.8),
    ],
    // Cue 4 (10s: 3-4-5 Triangle calculation)
    [
      arrow(855, 78, 855, 105, orange),
      txt(750, 105, "Example: 3-4-5 Triangle → sin θ = 3/5 = 0.6", 16, orange, 650, "middle"),
    ],
  ],

  // Scene 4: Pythagorean Identity and Real-World Power (24s total) - Layout: step-by-step-derivation
  [
    // Cue 1 (8s: Pythagorean Identity Derivation Step 1)
    [
      ...head("The Pythagorean Identity", 380),
      box(45, 75, 480, 52, "#eef6f0", green, 1.6),
      box(55, 83, 54, 18, green, green),
      txt(82, 96, "Step 1", 12, "#ffffff", 700, "middle"),
      trigImg(),
      txt(55, 118, "From a² + b² = c² (Pythagorean theorem):", 28, green),
      txt(55, 165, "Opp² + Adj² = Hyp²", 28, green),
      ...penHighlight(55, 200, 370, "sin²(θ) + cos²(θ) = 1", 34, "#e1d5e7"),
      txt(55, 255, "True for every single angle in the universe!", 24, purple),
    ],
    // Cue 2 (8s: Real-world applications & Step 2)
    [
      box(45, 230, 480, 50, "#eef4fb", blue, 1.6),
      box(55, 238, 54, 18, blue, blue),
      txt(82, 251, "Step 2", 12, "#ffffff", 700, "middle"),
      txt(55, 290, "Used in navigation, satellite GPS, and robotics.", 25, blue),
      circle(838, 240, 26, 20, blue, 2.8),
    ],
    // Cue 3 (8s: Wrap up & study notes)
    [
      txt(55, 320, "Explore study notes & practice calculating missing sides.", 23, green),
    ],
  ],
];

export const TRIG_SCENE_PATTERNS: LayoutPatternType[] = [
  "classic-split",
  "multi-panel-comparison",
  "centered-focal-hero",
  "step-by-step-derivation",
];

export function buildTrigScenes(): BoardPage[] {
  return script.chapters.map((chapter, index): BoardPage => {
    let seconds = 0;
    const marks: BoardMark[] = [];
    const cues = chapter.cues.map((cue, i): LessonCue => {
      const from = seconds;
      const firstMark = marks.length;
      const cueMarks = trigSceneBoards[index]?.[i] || [];
      marks.push(...cueMarks);
      seconds += cue.seconds;
      return {
        from,
        to: seconds,
        firstMark,
        endMark: marks.length,
        text: cue.text,
        ...("hold" in cue ? { hold: Boolean(cue.hold) } : {}),
      };
    });

    return {
      id: `trigonometry-${index + 1}`,
      title: chapter.title,
      layoutPattern: TRIG_SCENE_PATTERNS[index] || "classic-split",
      seconds,
      marks,
      cues,
      narration: chapter.cues.map((c) => c.text).join(" "),
      ink: [],
      cursor: { x: 852, y: 250 },
      regions: trigBoardRegions,
    };
  });
}

export function buildDynamicTrigScenes(
  patternOverrides?: Partial<Record<number, LayoutPatternType>>
): BoardPage[] {
  const baseScenes = buildTrigScenes();
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

export function buildTrigDerivationBoard(): BoardPage {
  return buildPageWithLayout({
    id: "trig-derivation",
    title: "Proof: sin²(θ) + cos²(θ) = 1",
    pattern: "step-by-step-derivation",
    narration: "A rigorous mathematical proof deriving the fundamental trigonometric identity from the Pythagorean theorem.",
    diagramAsset: {
      src: "/assets/trigonometry-triangle.svg",
      alt: "Right-Angled Triangle Trigonometry",
      naturalBounds: TRIG_IMAGE_LAYOUT,
    },
    derivationSteps: [
      {
        stepNumber: 1,
        title: "Pythagorean Theorem",
        equation: "Opposite² + Adjacent² = Hypotenuse²",
        explanation: "Valid for all right triangles",
        accent: green,
      },
      {
        stepNumber: 2,
        title: "Divide both sides by Hyp²",
        equation: "(Opp/Hyp)² + (Adj/Hyp)² = 1",
        explanation: "Algebraic normalization",
        accent: blue,
      },
      {
        stepNumber: 3,
        title: "Substitute Trig Definitions",
        equation: "sin²(θ) + cos²(θ) = 1",
        explanation: "Fundamental Pythagorean Identity",
        accent: purple,
        highlight: true,
      },
    ],
    notes: ["Universal law holding true for every angle θ in trigonometry."],
    regions: trigBoardRegions,
  });
}

export function buildTrigComparisonBoard(): BoardPage {
  return buildPageWithLayout({
    id: "trig-ratio-comparison",
    title: "Trigonometric Ratios: Sine vs Cosine",
    pattern: "multi-panel-comparison",
    narration: "Contrasting the vertical rise (sine) against the horizontal projection (cosine) in a right triangle.",
    comparisonPanels: [
      {
        id: "sine",
        title: "Sine Ratio: sin(θ)",
        subtitle: "Vertical rise relative to hypotenuse",
        color: green,
        equation: "sin(θ) = Opposite / Hypotenuse",
        points: [
          "Represents the vertical y-coordinate",
          "Equal to 0 at 0° and 1 at 90°",
          "Controls wave amplitude and vertical bounce",
        ],
      },
      {
        id: "cosine",
        title: "Cosine Ratio: cos(θ)",
        subtitle: "Horizontal run relative to hypotenuse",
        color: blue,
        equation: "cos(θ) = Adjacent / Hypotenuse",
        points: [
          "Represents the horizontal x-coordinate",
          "Equal to 1 at 0° and 0 at 90°",
          "Controls lateral displacement & phase lead",
        ],
      },
    ],
    regions: trigBoardRegions,
  });
}

export function buildTrigHeroBoard(): BoardPage {
  return buildPageWithLayout({
    id: "trig-hero-sohcahtoa",
    title: "The Universal Right Triangle Navigator",
    pattern: "centered-focal-hero",
    narration: "Explore how angle theta anchors the entire trigonometry coordinate system.",
    diagramAsset: {
      src: "/assets/trigonometry-triangle.svg",
      alt: "Trigonometry Right Triangle",
      naturalBounds: TRIG_IMAGE_LAYOUT,
    },
    leftCallouts: [
      { label: "1. Opposite Side (O)", text: "Faces directly across reference angle θ", color: purple, targetY: 140 },
      { label: "2. Adjacent Side (A)", text: "Adjacent side resting between θ and 90°", color: blue, targetY: 260 },
    ],
    rightCallouts: [
      { label: "3. Hypotenuse (H)", text: "Longest side always facing 90° vertex", color: green, targetY: 130 },
      { label: "4. SOH · CAH · TOA", text: "Universal memory key for all three ratios", color: orange, targetY: 220 },
    ],
    regions: trigBoardRegions,
  });
}
