import type { BoardMark, BoardPage, LessonCue, SupportedLanguage } from "@/lib/types";
import { head, txt, circle, arrow, penHighlight, green, blue, orange, purple, box } from "../helpers";
import { trigBoardRegions, TRIG_IMAGE_LAYOUT } from "./intelligence";
import scriptEn from "./script.json";
import scriptHi from "./script-hi.json";
import scriptHinglish from "./script-hinglish.json";

// High-contrast marker colors calibrated to NEVER blend with diagram lines or backgrounds:
const AMBER   = "#d35400";
const CYAN    = "#00d2d3";
const MAGENTA = "#ff2a7a";

export const trigImg = (x = TRIG_IMAGE_LAYOUT.x, y = TRIG_IMAGE_LAYOUT.y, w = TRIG_IMAGE_LAYOUT.w, h = TRIG_IMAGE_LAYOUT.h): BoardMark => ({
  type: "image",
  src: "/assets/trigonometry-triangle.svg",
  x,
  y,
  w,
  h,
  alt: "Right-Angled Triangle Trigonometry & SOH-CAH-TOA",
});

export function getTrigInitialBoard(lang: SupportedLanguage = "en"): BoardPage {
  if (lang === "hi") {
    return {
      id: "trigonometry-initial",
      title: "त्रिकोणमिति और समकोण त्रिभुज",
      seconds: 0,
      narration: "Qrie AI की इस डेमो क्लास में आपका स्वागत है! आज हम समकोण त्रिभुज, तीन मुख्य अनुपात—साइन, कोसाइन और स्पर्शज्या—और सार्वभौमिक सूत्र SOH-CAH-TOA को समझेंगे।",
      cues: [],
      ink: [],
      cursor: { x: 852, y: 250 },
      regions: trigBoardRegions,
      marks: [
        ...head("त्रिकोणमिति और समकोण त्रिभुज", 410),
        txt(55, 120, "त्रिकोणमितीय अनुपात एवं कोण ज्यामिति", 28, green),
        txt(55, 175, "1. साइन (sin θ) = लम्ब / कर्ण", 25, green),
        txt(55, 215, "2. कोसाइन (cos θ) = आधार / कर्ण", 25, blue),
        txt(55, 255, "3. स्पर्शज्या (tan θ) = लम्ब / आधार", 25, purple),
        txt(55, 295, "4. SOH - CAH - TOA सार्वभौमिक सूत्र", 25, orange),
        trigImg(),
      ],
    };
  }

  return {
    id: "trigonometry-initial",
    title: "Trigonometry & Right Triangles",
    seconds: 0,
    narration: "Welcome to this demo class from Qrie AI! Today we explore right-angled triangles, the three foundational ratios—sine, cosine, and tangent—and the universal memory formula SOH-CAH-TOA.",
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
}

export const trigInitialBoard: BoardPage = getTrigInitialBoard("en");

export const trigSceneBoardsEn: BoardMark[][][] = [
  // Scene 1: Right Triangles and Reference Angles (29s total)
  [
    // Cue 1 (10s: 90° angle & Hypotenuse)
    [
      ...head("The Right-Angled Triangle", 410),
      trigImg(),
      txt(55, 120, "One angle is always exactly 90°.", 28, green),
      txt(55, 168, "Hypotenuse (c): Longest side facing 90°", 26, green),
      circle(740, 145, 90, 50, AMBER, 2.8, 35),
      arrow(660, 80, 715, 115, AMBER),
      txt(655, 76, "Hypotenuse (H)", 15, AMBER, 650, "end"),
    ],
    // Cue 2 (9s: Reference angle θ, Opposite & Adjacent)
    [
      txt(55, 212, "Reference angle θ defines the two legs:", 27, blue),
      circle(838, 240, 26, 20, CYAN, 2.8),
      arrow(890, 240, 860, 240, CYAN),
      txt(895, 245, "Angle θ", 16, CYAN, 650, "start"),
      arrow(545, 142, 595, 142, CYAN),
      txt(540, 138, "Opposite (O)", 15, CYAN, 650, "end"),
    ],
    // Cue 3 (10s: Role swapping & fixed Hypotenuse)
    [
      ...penHighlight(55, 250, 390, "Hypotenuse is always fixed opposite 90°", 30),
      txt(55, 305, "Opposite faces angle θ · Adjacent touches angle θ", 24, green),
    ],
  ],

  // Scene 2: The Primary Ratios: Sine and Cosine (32s total)
  [
    // Cue 1 (10s: Sine definition)
    [
      ...head("Sine Ratio: Opp / Hyp", 370),
      trigImg(),
      txt(55, 118, "Sine measures vertical rise over hypotenuse:", 28, green),
      txt(55, 160, "sin(θ) = Opposite / Hypotenuse", 29, green, 700),
      circle(590, 145, 30, 85, CYAN, 2.6),
      circle(740, 145, 90, 50, AMBER, 2.6, 35),
      arrow(520, 160, 570, 160, CYAN),
    ],
    // Cue 2 (11s: Cosine definition)
    [
      txt(55, 208, "Cosine measures horizontal base over hypotenuse:", 27, blue),
      txt(55, 248, "cos(θ) = Adjacent / Hypotenuse", 29, blue, 700),
      circle(720, 262, 115, 25, MAGENTA, 2.8),
      arrow(720, 298, 720, 272, MAGENTA),
      txt(720, 308, "Adjacent Leg (b)", 14, MAGENTA, 600, "middle"),
    ],
    // Cue 3 (11s: Unit circle & wave motion connection)
    [
      ...penHighlight(55, 282, 380, "Coordinates on unit circle: (cos θ, sin θ)", 28, "#d5e8d4"),
    ],
  ],

  // Scene 3: Tangent and the SOH-CAH-TOA Memory Tool (31s total)
  [
    // Cue 1 (8s: Tangent definition & slope)
    [
      ...head("Tangent: Opp / Adj & SOH-CAH-TOA", 440),
      trigImg(),
      txt(55, 118, "Tangent compares the two perpendicular legs:", 28, purple),
      txt(55, 158, "tan(θ) = Opposite / Adjacent = sin(θ) / cos(θ)", 27, purple, 700),
    ],
    // Cue 2 (5s: Hold cue)
    [],
    // Cue 3 (10s: SOH CAH TOA formula highlight)
    [
      ...penHighlight(55, 198, 410, "SOH  ·  CAH  ·  TOA", 36, "#ffe6cc"),
      txt(55, 250, "SOH: Sin = Opp / Hyp", 25, green, 650),
      txt(55, 280, "CAH: Cos = Adj / Hyp", 25, blue, 650),
      txt(55, 310, "TOA: Tan = Opp / Adj", 25, purple, 650),
      circle(855, 48, 85, 32, AMBER, 2.8),
    ],
    // Cue 4 (8s: 3-4-5 Triangle calculation)
    [
      arrow(835, 78, 835, 96, AMBER),
      txt(835, 110, "3-4-5 Triangle Example:", 14, AMBER, 700, "middle"),
      txt(835, 128, "sin θ = 3/5 = 0.6", 15, green, 700, "middle"),
      txt(835, 146, "cos θ = 4/5 · tan θ = 3/4", 13, blue, 600, "middle"),
    ],
  ],

  // Scene 4: Pythagorean Identity and Real-World Power (28s total)
  [
    // Cue 1 (10s: Pythagorean Identity)
    [
      ...head("The Pythagorean Identity", 380),
      trigImg(),
      txt(55, 115, "From a² + b² = c² (Pythagorean theorem):", 27, green),
      txt(55, 155, "Opp² + Adj² = Hyp²", 27, green),
      ...penHighlight(55, 190, 370, "sin²(θ) + cos²(θ) = 1", 32, "#e1d5e7"),
      txt(55, 240, "True for every single angle in the universe!", 23, purple),
    ],
    // Cue 2 (9s: Real-world applications)
    [
      txt(55, 275, "Used in navigation, satellite GPS, and robotics.", 23, blue),
      circle(838, 240, 26, 20, CYAN, 2.8),
    ],
    // Cue 3 (9s: Wrap up & study notes)
    [
      txt(55, 308, "Demo class from Qrie AI · Ask Professor any question!", 22, green),
    ],
  ],
];

export const trigSceneBoardsHi: BoardMark[][][] = [
  // Scene 1: समकोण त्रिभुज और संदर्भ कोण (29s)
  [
    // Cue 1 (10s: समकोण और कर्ण)
    [
      ...head("समकोण त्रिभुज", 410),
      trigImg(),
      txt(55, 120, "एक कोण हमेशा ठीक 90° होता है।", 28, green),
      txt(55, 168, "कर्ण (c): 90° के सामने वाली सबसे लंबी भुजा", 24, green),
      circle(740, 145, 90, 50, AMBER, 2.8, 35),
      arrow(660, 80, 715, 115, AMBER),
      txt(655, 76, "कर्ण (H)", 15, AMBER, 650, "end"),
    ],
    // Cue 2 (9s: संदर्भ कोण θ, लम्ब और आधार)
    [
      txt(55, 212, "संदर्भ कोण θ दोनों भुजाओं को तय करता है:", 25, blue),
      circle(838, 240, 26, 20, CYAN, 2.8),
      arrow(890, 240, 860, 240, CYAN),
      txt(895, 245, "कोण θ", 16, CYAN, 650, "start"),
      arrow(545, 142, 595, 142, CYAN),
      txt(540, 138, "लम्ब (O)", 15, CYAN, 650, "end"),
    ],
    // Cue 3 (10s: कर्ण की स्थिरता)
    [
      ...penHighlight(55, 250, 390, "कर्ण हमेशा 90° के विपरीत निश्चित होता है", 29),
      txt(55, 305, "लम्ब कोण θ के सामने · आधार कोण θ से सटा हुआ", 23, green),
    ],
  ],

  // Scene 2: प्राथमिक अनुपात: साइन और कोसाइन (32s)
  [
    // Cue 1 (10s: साइन परिभाषा)
    [
      ...head("साइन अनुपात: लम्ब / कर्ण", 370),
      trigImg(),
      txt(55, 118, "साइन कर्ण के सापेक्ष ऊर्ध्वाधर ऊंचाई मापता है:", 25, green),
      txt(55, 160, "sin(θ) = लम्ब / कर्ण", 29, green, 700),
      circle(590, 145, 30, 85, CYAN, 2.6),
      circle(740, 145, 90, 50, AMBER, 2.6, 35),
      arrow(520, 160, 570, 160, CYAN),
    ],
    // Cue 2 (11s: कोसाइन परिभाषा)
    [
      txt(55, 208, "कोसाइन कर्ण के सापेक्ष क्षैतिज आधार मापता है:", 25, blue),
      txt(55, 248, "cos(θ) = आधार / कर्ण", 29, blue, 700),
      circle(720, 262, 115, 25, MAGENTA, 2.8),
      arrow(720, 298, 720, 272, MAGENTA),
      txt(720, 308, "आधार भुजा (b)", 14, MAGENTA, 600, "middle"),
    ],
    // Cue 3 (11s: इकाई वृत्त संबंध)
    [
      ...penHighlight(55, 282, 380, "इकाई वृत्त पर निर्देशांक: (cos θ, sin θ)", 28, "#d5e8d4"),
    ],
  ],

  // Scene 3: स्पर्शज्या और SOH-CAH-TOA (31s)
  [
    // Cue 1 (8s: स्पर्शज्या परिभाषा)
    [
      ...head("स्पर्शज्या: लम्ब / आधार व SOH-CAH-TOA", 440),
      trigImg(),
      txt(55, 118, "स्पर्शज्या दोनों लम्बवत भुजाओं की तुलना करती है:", 25, purple),
      txt(55, 158, "tan(θ) = लम्ब / आधार = sin(θ) / cos(θ)", 26, purple, 700),
    ],
    // Cue 2 (5s: विचार विराम)
    [],
    // Cue 3 (10s: SOH CAH TOA सूत्र)
    [
      ...penHighlight(55, 198, 410, "SOH  ·  CAH  ·  TOA", 36, "#ffe6cc"),
      txt(55, 250, "SOH: Sin = लम्ब / कर्ण", 24, green, 650),
      txt(55, 280, "CAH: Cos = आधार / कर्ण", 24, blue, 650),
      txt(55, 310, "TOA: Tan = लम्ब / आधार", 24, purple, 650),
      circle(855, 48, 85, 32, AMBER, 2.8),
    ],
    // Cue 4 (8s: 3-4-5 त्रिभुज गणना)
    [
      arrow(835, 78, 835, 96, AMBER),
      txt(835, 110, "3-4-5 त्रिभुज उदाहरण:", 14, AMBER, 700, "middle"),
      txt(835, 128, "sin θ = 3/5 = 0.6", 15, green, 700, "middle"),
      txt(835, 146, "cos θ = 4/5 · tan θ = 3/4", 13, blue, 600, "middle"),
    ],
  ],

  // Scene 4: पाइथागोरस सर्वसमिका और अनुप्रयोग (28s)
  [
    // Cue 1 (10s: पाइथागोरस सर्वसमिका)
    [
      ...head("पाइथागोरस सर्वसमिका", 380),
      trigImg(),
      txt(55, 115, "पाइथागोरस प्रमेय a² + b² = c² से:", 26, green),
      txt(55, 155, "लम्ब² + आधार² = कर्ण²", 26, green),
      ...penHighlight(55, 190, 370, "sin²(θ) + cos²(θ) = 1", 32, "#e1d5e7"),
      txt(55, 240, "ब्रह्मांड के प्रत्येक कोण के लिए सत्य!", 23, purple),
    ],
    // Cue 2 (9s: अनुप्रयोग)
    [
      txt(55, 275, "नेविगेशन, सैटेलाइट जीपीएस और रोबोटिक्स में प्रयुक्त।", 23, blue),
      circle(838, 240, 26, 20, CYAN, 2.8),
    ],
    // Cue 3 (9s: निष्कर्ष)
    [
      txt(55, 308, "Qrie AI की डेमो क्लास · प्रोफेसर से कोई भी शंका पूछें!", 22, green),
    ],
  ],
];

export const trigSceneBoards = trigSceneBoardsEn;

export function buildTrigScenes(lang: SupportedLanguage = "en"): BoardPage[] {
  const scriptData = lang === "hi" ? scriptHi : lang === "hinglish" ? scriptHinglish : scriptEn;
  const sceneBoards = lang === "hi" ? trigSceneBoardsHi : trigSceneBoardsEn;

  return scriptData.chapters.map((chapter, index): BoardPage => {
    let seconds = 0;
    const marks: BoardMark[] = [];
    const cues = chapter.cues.map((cue, i): LessonCue => {
      const from = seconds;
      const firstMark = marks.length;
      const cueMarks = sceneBoards[index]?.[i] || [];
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
