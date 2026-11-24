import type { BoardMark, BoardPage, LessonCue, SupportedLanguage } from "@/lib/types";
import { head, txt, circle, arrow, box, path, penHighlight, green, blue, orange, purple } from "../helpers";
import { cellBoardRegions, cellRegions, mitochondriaBoardRegions } from "./intelligence";
import scriptEn from "./script.json";
import scriptHi from "./script-hi.json";
import scriptHinglish from "./script-hinglish.json";

// High-contrast colors chosen to never blend with diagram backgrounds
const RED     = "#e74c3c"; // bright red — used on purple nucleus (pure contrast)
const LIME    = "#2ed573"; // lime green — used on orange-brown organelles in cell
const MAGENTA = "#ff2a7a"; // vivid magenta/rose — maximum visibility on both mitochondria folds and whiteboard
const CYAN    = "#00d2d3"; // electric cyan — used on red outer membrane

export const cellImg = (): BoardMark => ({
  type: "image",
  src: "/assets/human_cell_diagram.png",
  x: 610,
  y: 14,
  w: 232,
  h: 310,
  alt: "The Human Cell Anatomy",
});

export const mitochondriaImg = (x = 550, y = 12, w = 390, h = 310): BoardMark => ({
  type: "image",
  src: "/assets/Mitochondria.png",
  x,
  y,
  w,
  h,
  alt: "Mitochondria Structure & ATP Synthesis",
});

export function getCellInitialBoard(lang: SupportedLanguage = "en"): BoardPage {
  if (lang === "hi") {
    return {
      id: "cell-initial",
      title: "मानव कोशिका",
      seconds: 0,
      narration: "Qrie AI की इस डेमो क्लास में आपका स्वागत है! आज हम मानव कोशिका की सूक्ष्म संरचना का अन्वेषण करेंगे: कोशिका झिल्ली, केंद्रक, माइटोकॉन्ड्रिया और प्रोटीन निर्माण प्रणाली।",
      cues: [],
      ink: [],
      cursor: { x: 852, y: 250 },
      regions: cellBoardRegions,
      marks: [
        ...head("मानव कोशिका", 340),
        txt(55, 120, "सक्रिय कोशिका संरचना एवं अंगक", 28, green),
        txt(55, 175, "1. कोशिका झिल्ली: चयनात्मक लिपिड परत", 25, green),
        txt(55, 215, "2. केंद्रक: मुख्य डीएनए आनुवंशिक निर्देश", 25, purple),
        txt(55, 255, "3. माइटोकॉन्ड्रिया: एटीपी कोशिकीय श्वसन", 25, orange),
        txt(55, 295, "4. प्रोटीन निर्माण: राइबोसोम, ईआर व गॉल्जी", 25, blue),
        cellImg(),
      ],
    };
  }
  return {
    id: "cell-initial",
    title: "Human Cell",
    seconds: 0,
    narration: "Welcome to this demo class from Qrie AI! Today we explore the microscopic anatomy of the human cell: cell membrane, nucleus, mitochondria, and the protein factory pipeline.",
    cues: [],
    ink: [],
    cursor: { x: 852, y: 250 },
    regions: cellBoardRegions,
    marks: [
      ...head("Human Cell", 360),
      txt(55, 120, "Interactive Anatomy & Organelles", 28, green),
      txt(55, 175, "1. Cell Membrane: Selective lipid bilayer", 25, green),
      txt(55, 215, "2. Nucleus: Master DNA genetic library", 25, purple),
      txt(55, 255, "3. Mitochondria: ATP cellular respiration", 25, orange),
      txt(55, 295, "4. Protein Factory: Ribosomes, ER & Golgi", 25, blue),
      cellImg(),
    ],
  };
}

export const cellInitialBoard: BoardPage = getCellInitialBoard("en");

// English / Hinglish visual scenes (English text marks remain as required)
export const cellSceneBoardsEn: BoardMark[][][] = [
  // Chapter 1: Inside the Human Cell — cell membrane & cytoplasm (28s)
  [
    // Cue 1 (9s: Cell Membrane)
    [
      ...head("Inside the Human Cell", 380),
      cellImg(),
      txt(55, 120, "Flexible lipid bilayer membrane", 28, green),
      txt(55, 168, "Cell membrane controls substance entry", 26, green),
      circle(725, 187, 96, 108, green, 2.8, -2),
      arrow(850, 88, 804, 112, green),
      txt(855, 92, "Cell Membrane", 16, green, 650, "start"),
    ],
    // Cue 2 (9s: Cytoplasm & Cytosol)
    [
      txt(55, 210, "Cytosol jelly supports all organelles", 27, blue),
      circle(697, 116, 24, 20, blue, 2.8),
      arrow(850, 130, 725, 120, blue),
      txt(855, 134, "Cytoplasm (Cytosol)", 16, blue, 650, "start"),
    ],
    // Cue 3 (10s: Dynamic human cell structure)
    [
      ...penHighlight(55, 248, 360, "Dynamic human cell structure", 32),
      txt(55, 305, "Flexible membrane with no rigid cell wall", 24, green),
    ],
  ],
  // Chapter 2: Nucleus & Powerhouses (34s)
  [
    // Cue 1 (10s: Nucleus & DNA)
    [
      ...head("Nucleus & Powerhouses", 390),
      { type: "image", src: "/assets/human_cell_diagram.png", x: 465, y: 28, w: 175, h: 250, alt: "The Human Cell Anatomy" },
      txt(55, 118, "Nucleus: master DNA instruction library", 28, RED),
      circle(553, 140, 30, 26, RED, 2.8),
      arrow(455, 95, 522, 125, RED),
      txt(450, 92, "Nucleus (DNA)", 15, RED, 650, "end"),
    ],
    // Cue 2 (12s: Mitochondria & ATP — zoom in with dedicated Mitochondria.png alongside)
    [
      mitochondriaImg(720, 25, 255, 210),
      txt(55, 168, "Mitochondria produce ATP energy.", 28, orange),
      txt(55, 208, "Smooth outer membrane encloses organelle", 24, CYAN),
      circle(515, 193, 22, 16, orange, 2.8, -15),
      arrow(538, 188, 720, 135, orange),
      txt(680, 128, "Zoom In", 16, orange, 750, "middle"),
      path("M927 74 Q949 76 971 73", CYAN, 3.4),
    ],
    // Cue 3 (12s: Cristae & ATP takeaway)
    [
      circle(822, 108, 34, 25, MAGENTA, 2.6),
      arrow(775, 54, 810, 92, MAGENTA),
      txt(770, 46, "Cristae (folds)", 13, MAGENTA, 650, "end"),
      arrow(845, 238, 845, 172, CYAN),
      txt(845, 254, "Matrix (ATP fluid)", 14, CYAN, 650, "middle"),
      ...penHighlight(55, 248, 375, "Glucose + O₂ → ATP Energy", 33),
      txt(55, 305, "Folded cristae maximize surface area", 24, orange),
    ],
  ],
  // Chapter 3: Identify the protein factories (34s)
  [
    // Cue 1 (8s: Question prompt)
    [
      ...head("Identify the protein factories", 440),
      cellImg(),
      txt(55, 108, "Ribbon-like channels around nucleus", 26),
      txt(55, 160, "Which organelle builds proteins?", 26, blue),
    ],
    // Cue 2 (5s: Hold for thought)
    [],
    // Cue 3 (11s: Ribosomes & Rough ER)
    [
      txt(55, 206, "Specks: Ribosomes · Highway: Rough ER", 26, purple),
      circle(677, 156, 30, 42, purple, 2.8),
      arrow(560, 91, 642, 140, purple),
      txt(555, 88, "Rough ER & Ribosomes", 15, purple, 650, "end"),
      ...penHighlight(55, 232, 340, "Rough ER & Ribosomes", 28),
    ],
    // Cue 4 (10s: Golgi Apparatus & shipping)
    [
      circle(755, 114, 30, 24, green, 2.8),
      arrow(850, 114, 790, 114, green),
      txt(855, 119, "Golgi Apparatus", 16, green, 650, "start"),
      txt(55, 308, "Golgi sorts & packages into vesicles", 23, green),
    ],
  ],
  // Chapter 4: Organelle Symphony (24s)
  [
    // Cue 1 (8s: Nucleus instruction)
    [
      ...head("Organelle Symphony", 345),
      cellImg(),
      txt(55, 118, "1. Nucleus sends mRNA codes.", 27, purple),
      circle(726, 152, 38, 33, purple, 2.8),
      arrow(850, 152, 770, 152, purple),
      txt(855, 156, "1. DNA instructions", 16, purple, 650, "start"),
    ],
    // Cue 2 (8s: Ribosomes & Mitochondria cooperation)
    [
      txt(55, 160, "2. Ribosomes build proteins.", 27, blue),
      circle(677, 156, 30, 42, purple, 2.8),
      arrow(585, 130, 642, 150, purple),
      txt(580, 126, "2. Ribosomes (ER)", 15, purple, 650, "end"),
      txt(55, 202, "3. Mitochondria supply ATP fuel.", 27, LIME),
      circle(676, 219, 32, 22, LIME, 2.8, -25),
      arrow(585, 215, 638, 219, LIME),
      txt(580, 210, "3. ATP fuel", 15, LIME, 650, "end"),
    ],
    // Cue 3 (8s: Symphony summary)
    [
      ...penHighlight(55, 245, 380, "Trillions of cells, one system.", 31),
      txt(55, 305, "Demo class from Qrie AI · Ask Professor any doubt!", 23, green),
    ],
  ],
];

// Hindi visual scenes (Devanagari marks and labels)
export const cellSceneBoardsHi: BoardMark[][][] = [
  // Chapter 1: मानव कोशिका के अंदर (28s)
  [
    // Cue 1 (9s: कोशिका झिल्ली)
    [
      ...head("मानव कोशिका के अंदर", 380),
      cellImg(),
      txt(55, 120, "लचीली लिपिड द्वि-परत झिल्ली", 28, green),
      txt(55, 168, "कोशिका झिल्ली पदार्थों का प्रवेश नियंत्रित करती है", 23, green),
      circle(725, 187, 96, 108, green, 2.8, -2),
      arrow(850, 88, 804, 112, green),
      txt(855, 92, "कोशिका झिल्ली", 16, green, 650, "start"),
    ],
    // Cue 2 (9s: कोशिकाद्रव्य / साइटोसोल)
    [
      txt(55, 210, "साइटोसोल जेली सभी अंगकों को सहारा देती है", 24, blue),
      circle(697, 116, 24, 20, blue, 2.8),
      arrow(850, 130, 725, 120, blue),
      txt(855, 134, "कोशिकाद्रव्य (साइटोसोल)", 16, blue, 650, "start"),
    ],
    // Cue 3 (10s: लचीली जन्तु कोशिका)
    [
      ...penHighlight(55, 248, 360, "सक्रिय मानव कोशिका संरचना", 32),
      txt(55, 305, "लचीली झिल्ली, कोई कठोर कोशिका भित्ति नहीं", 23, green),
    ],
  ],
  // Chapter 2: केंद्रक और ऊर्जा के पावरहाउस (34s)
  [
    // Cue 1 (10s: केंद्रक व डीएनए)
    [
      ...head("केंद्रक और ऊर्जा केंद्र", 390),
      { type: "image", src: "/assets/human_cell_diagram.png", x: 465, y: 28, w: 175, h: 250, alt: "The Human Cell Anatomy" },
      txt(55, 118, "केंद्रक: मुख्य डीएनए निर्देश भंडार", 28, RED),
      circle(553, 140, 30, 26, RED, 2.8),
      arrow(455, 95, 522, 125, RED),
      txt(450, 92, "केंद्रक (डीएनए)", 15, RED, 650, "end"),
    ],
    // Cue 2 (12s: माइटोकॉन्ड्रिया व एटीपी)
    [
      mitochondriaImg(720, 25, 255, 210),
      txt(55, 168, "माइटोकॉन्ड्रिया एटीपी ऊर्जा बनाते हैं।", 27, orange),
      txt(55, 208, "चिकनी बाहरी झिल्ली अंगक को ढकती है", 23, CYAN),
      circle(515, 193, 22, 16, orange, 2.8, -15),
      arrow(538, 188, 720, 135, orange),
      txt(680, 128, "ज़ूम इन", 16, orange, 750, "middle"),
      path("M927 74 Q949 76 971 73", CYAN, 3.4),
    ],
    // Cue 3 (12s: क्रिस्टी व एटीपी)
    [
      circle(822, 108, 34, 25, MAGENTA, 2.6),
      arrow(775, 54, 810, 92, MAGENTA),
      txt(770, 46, "क्रिस्टी (परतें)", 13, MAGENTA, 650, "end"),
      arrow(845, 238, 845, 172, CYAN),
      txt(845, 254, "मैट्रिक्स (द्रव)", 14, CYAN, 650, "middle"),
      ...penHighlight(55, 248, 375, "ग्लूकोज + O₂ → ATP ऊर्जा", 33),
      txt(55, 305, "मुड़ी हुई क्रिस्टी सतह क्षेत्र बढ़ाती हैं", 23, orange),
    ],
  ],
  // Chapter 3: प्रोटीन निर्माण केंद्रों की पहचान (34s)
  [
    // Cue 1 (8s: प्रश्न)
    [
      ...head("प्रोटीन निर्माण केंद्र पहचानें", 440),
      cellImg(),
      txt(55, 108, "केंद्रक के चारों ओर रिबन जैसी नलिकाएं", 25),
      txt(55, 160, "कौन सा अंगक प्रोटीन बनाता है?", 25, blue),
    ],
    // Cue 2 (5s: विचार विराम)
    [],
    // Cue 3 (11s: राइबोसोम व खुरदरी ईआर)
    [
      txt(55, 206, "कण: राइबोसोम · मार्ग: खुरदरी ईआर", 25, purple),
      circle(677, 156, 30, 42, purple, 2.8),
      arrow(560, 91, 642, 140, purple),
      txt(555, 88, "खुरदरी ईआर व राइबोसोम", 15, purple, 650, "end"),
      ...penHighlight(55, 232, 340, "खुरदरी ईआर व राइबोसोम", 28),
    ],
    // Cue 4 (10s: गॉल्जी उपकरण)
    [
      circle(755, 114, 30, 24, green, 2.8),
      arrow(850, 114, 790, 114, green),
      txt(855, 119, "गॉल्जी उपकरण", 16, green, 650, "start"),
      txt(55, 308, "गॉल्जी छांटकर पुटिकाओं में पैक करता है", 23, green),
    ],
  ],
  // Chapter 4: अंगकों का सामंजस्य (24s)
  [
    // Cue 1 (8s: केंद्रक निर्देश)
    [
      ...head("अंगकों का सामंजस्य", 345),
      cellImg(),
      txt(55, 118, "1. केंद्रक mRNA कोड भेजता है।", 26, purple),
      circle(726, 152, 38, 33, purple, 2.8),
      arrow(850, 152, 770, 152, purple),
      txt(855, 156, "1. डीएनए निर्देश", 16, purple, 650, "start"),
    ],
    // Cue 2 (8s: राइबोसोम व माइटोकॉन्ड्रिया)
    [
      txt(55, 160, "2. राइबोसोम प्रोटीन बनाते हैं।", 26, blue),
      circle(677, 156, 30, 42, purple, 2.8),
      arrow(585, 130, 642, 150, purple),
      txt(580, 126, "2. राइबोसोम (ईआर)", 15, purple, 650, "end"),
      txt(55, 202, "3. माइटोकॉन्ड्रिया एटीपी ईंधन देते हैं।", 26, LIME),
      circle(676, 219, 32, 22, LIME, 2.8, -25),
      arrow(585, 215, 638, 219, LIME),
      txt(580, 210, "3. एटीपी ईंधन", 15, LIME, 650, "end"),
    ],
    // Cue 3 (8s: निष्कर्ष)
    [
      ...penHighlight(55, 245, 380, "खरबों कोशिकाएं, एक जीवंत प्रणाली।", 31),
      txt(55, 305, "Qrie AI की डेमो क्लास · प्रोफेसर से कोई भी शंका पूछें!", 22, green),
    ],
  ],
];

export const cellSceneBoards = cellSceneBoardsEn;

export function buildCellScenes(lang: SupportedLanguage = "en"): BoardPage[] {
  const scriptData = lang === "hi" ? scriptHi : lang === "hinglish" ? scriptHinglish : scriptEn;
  const sceneBoards = lang === "hi" ? cellSceneBoardsHi : cellSceneBoardsEn;

  return scriptData.chapters.map((chapter, index): BoardPage => {
    let seconds = 0;
    const marks: BoardMark[] = [];
    const cues = chapter.cues.map((cue, i): LessonCue => {
      const from = seconds;
      const firstMark = marks.length;
      if (sceneBoards[index] && sceneBoards[index][i]) {
        marks.push(...sceneBoards[index][i]);
      }
      seconds += cue.seconds;
      return {
        from,
        to: seconds,
        firstMark,
        endMark: marks.length,
        text: cue.text,
        ...("hold" in cue ? { hold: true } : {}),
      };
    });
    return {
      id: `human-cell-${index + 1}`,
      title: chapter.title,
      seconds,
      marks,
      cues,
      narration: chapter.cues.map(c => c.text).join(" "),
      ink: [],
      cursor: { x: 852, y: 250 },
      regions: index === 1 ? [...cellBoardRegions, ...mitochondriaBoardRegions] : cellBoardRegions,
    };
  });
}

export function buildMitochondriaBoard(example = false, lang: SupportedLanguage = "en"): BoardPage {
  if (lang === "hi") {
    return {
      id: "mitochondria-deep-dive",
      title: example ? "माइटोकॉन्ड्रिया: एटीपी संश्लेषण" : "माइटोकॉन्ड्रिया: कोशिका का पावरहाउस",
      seconds: 0,
      narration: "माइटोकॉन्ड्रिया कोशिकीय श्वसन द्वारा आंतरिक मुड़ी क्रिस्टी और एटीपी सिंथेस के माध्यम से एटीपी रासायनिक ऊर्जा बनाते हैं।",
      cues: [],
      ink: [],
      cursor: { x: 740, y: 200 },
      regions: mitochondriaBoardRegions,
      marks: [
        ...head(example ? "माइटोकॉन्ड्रिया एटीपी संश्लेषण" : "माइटोकॉन्ड्रिया (पावरहाउस)", 380),
        txt(55, 115, "कोशिकीय श्वसन एवं एटीपी निर्माण", 28, orange),
        txt(55, 160, "C₆H₁₂O₆ + 6 O₂ → 6 CO₂ + 6 H₂O + ATP", 25, orange),
        txt(55, 205, "1. दोहरी झिल्ली: बाहरी चिकनी + आंतरिक मुड़ी", 24, CYAN),
        txt(55, 240, "2. क्रिस्टी: एटीपी उत्पादन के लिए सतह क्षेत्र का विस्तार", 23, MAGENTA),
        txt(55, 275, "3. मैट्रिक्स: एमटी-डीएनए व राइबोसोम युक्त आंतरिक द्रव", 23, LIME),
        txt(55, 305, "4. F0F1-ATPase: एटीपी ईंधन उत्पन्न करने वाला रोटरी मोटर", 23, orange),
        mitochondriaImg(550, 12, 390, 310),
      ],
    };
  }

  return {
    id: "mitochondria-deep-dive",
    title: "Mitochondria: The Powerhouse of the Cell",
    seconds: 0,
    narration: "Mitochondria generate ATP chemical energy through cellular respiration using folded inner cristae and ATP synthase.",
    cues: [],
    ink: [],
    cursor: { x: 740, y: 200 },
    regions: mitochondriaBoardRegions,
    marks: [
      ...head(example ? "Mitochondria ATP Synthesis" : "The Mitochondria (Powerhouse)", 380),
      txt(55, 115, "Cellular Respiration & ATP Generation", 28, orange),
      txt(55, 160, "C₆H₁₂O₆ + 6 O₂ → 6 CO₂ + 6 H₂O + ATP", 25, orange),
      txt(55, 205, "1. Double Membrane: Outer smooth + Inner folded", 24, CYAN),
      txt(55, 240, "2. Cristae: Folds expand surface area for ATP machines", 24, MAGENTA),
      txt(55, 275, "3. Matrix: Viscous interior with mtDNA & ribosomes", 24, LIME),
      txt(55, 305, "4. F0F1-ATPase: Rotary motor generating ATP fuel", 24, orange),
      mitochondriaImg(550, 12, 390, 310),
    ],
  };
}
