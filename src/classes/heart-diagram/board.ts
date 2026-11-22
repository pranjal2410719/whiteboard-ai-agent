import type { BoardMark, BoardPage, LessonCue } from "@/lib/types";
import { head, txt, line, circle, arrow, penHighlight, green, blue } from "../helpers";
import { heartBoardRegions } from "./intelligence";
import script from "./script.json";

export const heartImg = (asset: "chambers" | "circulation" | "cycle" = "chambers"): BoardMark => {
  if (asset === "cycle") {
    return {
      type: "image",
      src: "/assets/heart/Cardiac_cycle.jpeg",
      x: 540,
      y: 40,
      w: 390,
      h: 226,
      alt: "Cardiac Cycle Three Stages",
    };
  }
  if (asset === "circulation") {
    return {
      type: "image",
      src: "/assets/heart/Double_circulation.png",
      x: 565,
      y: 25,
      w: 340,
      h: 270,
      alt: "Human Double Circulation Systemic and Pulmonary",
    };
  }
  return {
    type: "image",
    src: "/assets/heart/Demonstration_A_four_chambers.png",
    x: 550,
    y: 25,
    w: 370,
    h: 250,
    alt: "Human Heart Four Chambers and Valves",
  };
};

export const heartInitialBoard: BoardPage = {
  id: "heart-initial",
  title: "Human Heart & Double Circulation",
  seconds: 0,
  narration: "Welcome to the Human Heart & Double Circulation class. Here we explore the 4 chambers, 4 valves, and double circulation pathways.",
  cues: [],
  ink: [],
  cursor: { x: 852, y: 250 },
  regions: heartBoardRegions,
  marks: [
    ...head("Human Heart & Blood Flow", 440),
    txt(55, 120, "Interactive Anatomy & Double Circulation", 28, green),
    txt(55, 175, "1. 4 Chambers: Atria (receive) · Ventricles (pump)", 25, blue),
    txt(55, 215, "2. 4 One-Way Valves prevent backward flow", 25, "#8868a0"),
    txt(55, 255, "3. Double Circulation: Pulmonary + Systemic", 25, "#c0392b"),
    txt(55, 295, "4. Cardiac Cycle (0.8s): Systole & Diastole", 25, "#ad6a3a"),
    heartImg("chambers"),
  ],
};

export const heartSceneBoards: BoardMark[][][] = [
  // Scene 1 — Opening
  [
    [...head("The Heart Never Stops", 410), txt(55, 120, "Beats ~100,000 times every day, 24/7.", 28), heartImg("chambers")],
    [
      txt(55, 168, "How does it pump continuously?", 28, "#8868a0"),
      txt(55, 205, "How does blood know where to go?", 28, blue),
      line("M55 240 L110 240 L120 215 L132 265 L144 210 L155 240 L240 240 M240 240 L295 240 L305 215 L317 265 L329 210 L340 240 L420 240", "#e74c3c", 3.2),
    ],
    [
      ...penHighlight(55, 255, 385, "4 Chambers · 4 Valves · 2 Loops", 33),
    ],
  ],
  // Scene 2 — Four chambers
  [
    [...head("The Four Heart Chambers", 430), txt(55, 118, "Atria (top) receive · Ventricles (bottom) pump", 28), heartImg("chambers")],
    [
      txt(55, 165, "Anatomical Right = Patient's Right", 27, blue),
      txt(55, 202, "Blue: Deoxygenated · Red: Oxygenated", 27, "#c0392b"),
      // Anatomical Right chambers (Viewer left)
      circle(645, 135, 28, 36, "#3b6cb5", 2.8),
      arrow(576, 135, 617, 135, "#3b6cb5"),
      txt(570, 140, "Right Atrium (RA)", 16, "#285294", 650, "end"),
      circle(675, 215, 34, 26, "#3b6cb5", 2.8),
      arrow(576, 215, 641, 215, "#3b6cb5"),
      txt(570, 220, "Right Ventricle (RV)", 16, "#285294", 650, "end"),
      // Anatomical Left chambers (Viewer right)
      circle(755, 120, 28, 25, "#c0504d", 2.8),
      arrow(848, 120, 783, 120, "#c0504d"),
      txt(852, 125, "Left Atrium (LA)", 16, "#a83836", 650, "start"),
      circle(775, 195, 32, 38, "#c0504d", 2.8),
      arrow(848, 195, 807, 195, "#c0504d"),
      txt(852, 200, "Left Ventricle (LV)", 16, "#a83836", 650, "start"),
    ],
    [
      ...penHighlight(55, 240, 365, "Atria receive · Ventricles pump", 33),
      txt(55, 280, "Atria receive veins (SVC, IVC, Pulm. Veins)", 22, blue),
      txt(55, 308, "Ventricles pump arteries (Pulm. Artery, Aorta)", 22, "#c0392b"),
    ],
  ],
  // Scene 3 — Four valves
  [
    [...head("The Four One-Way Valves", 420), txt(55, 118, "One-way doors: prevent backward leakage", 28), heartImg("chambers")],
    [
      txt(55, 166, "1. Tricuspid: RA → RV", 27, "#27ae60"),
      circle(665, 185, 24, 18, "#27ae60", 2.8),
      arrow(576, 185, 641, 185, "#27ae60"),
      txt(570, 190, "Tricuspid Valve", 16, "#1e8449", 650, "end"),
      txt(55, 205, "2. Pulmonary: RV → Pulm. Artery", 27, "#2980b9"),
      circle(700, 140, 22, 18, "#2980b9", 2.8),
      arrow(848, 140, 722, 140, "#2980b9"),
      txt(852, 145, "Pulmonary Valve", 16, "#1f618d", 650, "start"),
    ],
    [
      txt(55, 244, "3. Mitral (Bicuspid): LA → LV", 27, "#d35400"),
      circle(755, 160, 24, 18, "#d35400", 2.8),
      arrow(848, 160, 779, 160, "#d35400"),
      txt(852, 165, "Mitral (Bicuspid)", 16, "#a04000", 650, "start"),
      txt(55, 283, "4. Aortic: LV → Aorta (Systemic)", 27, "#c0392b"),
      circle(720, 100, 22, 18, "#c0392b", 2.8),
      arrow(848, 100, 742, 100, "#c0392b"),
      txt(852, 105, "Aortic Valve", 16, "#922b21", 650, "start"),
      ...penHighlight(55, 315, 360, "Strict Unidirectional Flow", 30),
    ],
  ],
  // Scene 4 — Pulmonary circulation
  [
    [...head("Pulmonary Circulation", 400), txt(55, 118, "Deoxygenated blood returns from tissues", 28), heartImg("circulation"), arrow(590, 80, 630, 110, "#3b6cb5")],
    [
      txt(55, 168, "Enters RA → Passes Tricuspid → RV", 28, blue),
      txt(55, 210, "RV pumps blood into Pulmonary Artery", 28, blue),
      arrow(660, 120, 700, 80, "#3b6cb5"),
    ],
    [
      ...penHighlight(55, 245, 385, "Heart → Lungs → Heart", 34),
      txt(55, 310, "Lungs release CO₂ waste and absorb O₂", 24, green),
    ],
  ],
  // Scene 5 — Systemic circulation
  [
    [...head("Systemic Circulation", 380), txt(55, 118, "Oxygen-rich blood returns from lungs", 28), heartImg("circulation"), arrow(760, 80, 730, 110, "#c0392b")],
    [
      txt(55, 168, "Enters LA → Mitral Valve → LV", 28, "#c0392b"),
      txt(55, 210, "LV wall is 3× thicker for high systemic pressure", 26, "#bc7948"),
      arrow(710, 120, 680, 60, "#c0392b"),
    ],
    [
      ...penHighlight(55, 245, 385, "Heart → Body Tissues → Heart", 34),
      txt(55, 310, "Delivers fuel and oxygen from head to toe", 24, green),
    ],
  ],
  // Scene 6 — The cardiac cycle
  [
    [...head("The Cardiac Cycle (0.8s)", 420), txt(55, 118, "One sequence of contraction & relaxation", 28), heartImg("cycle"), txt(55, 165, "Systole = Contraction · Diastole = Relaxation", 26, "#8868a0")],
    [
      txt(55, 205, "1. Atrial Systole (0.1s): atria push blood", 26, blue),
      txt(55, 240, "2. Ventricular Systole (0.3s): ventricles pump", 26, "#bc7948"),
      txt(55, 275, "AV valves shut with 'LUB' sound", 24, "#27ae60"),
    ],
    [
      txt(55, 310, "3. Joint Diastole (0.4s): chambers refill ('DUB')", 26, green),
      ...penHighlight(55, 335, 370, "0.8s Cycle at 75 bpm", 28),
    ],
  ],
  // Scene 7 — Quick knowledge check
  [
    [...head("Quick Knowledge Check", 400), txt(55, 118, "Q1: Which chamber pumps blood to the whole body?", 26), txt(55, 150, "→ Correct: Left Ventricle (LV)", 26, "#c0392b", 650), heartImg("chambers")],
    [txt(55, 185, "Q2: Which circuit carries blood to the lungs?", 26), txt(55, 215, "→ Correct: Pulmonary Circulation", 26, blue, 650)],
    [txt(55, 248, "Q3: Which valve lies between LA and LV?", 26), txt(55, 278, "→ Correct: Mitral (Bicuspid) Valve", 26, "#bc7948", 650)],
    [txt(55, 308, "Q4: What are the 3 cardiac cycle stages?", 24), txt(55, 335, "→ Atrial Systole · Ventricular Systole · Joint Diastole", 23, green, 650)],
  ],
  // Scene 8 — Final recap
  [
    [...head("Double Circulation Summary", 430), txt(55, 118, "Four Chambers · One-Way Valves · Two Circuits", 28), heartImg("circulation")],
    [
      txt(55, 168, "Septum completely separates left and right sides", 27, green),
      txt(55, 208, "Challenge: trace body → lungs → body from memory!", 26, "#8868a0"),
    ],
    [
      ...penHighlight(55, 245, 385, "Mastered: The Human Heart", 34),
      txt(55, 310, "See you in the next Qrie biology class!", 25, blue),
    ],
  ],
];

export function buildHeartScenes(): BoardPage[] {
  return script.chapters.map((chapter, index): BoardPage => {
    let seconds = 0;
    const marks: BoardMark[] = [];
    const cues = chapter.cues.map((cue, i): LessonCue => {
      const from = seconds;
      const firstMark = marks.length;
      if (heartSceneBoards[index] && heartSceneBoards[index][i]) {
        marks.push(...heartSceneBoards[index][i]);
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
      id: `heart-diagram-${index + 1}`,
      title: chapter.title,
      seconds,
      marks,
      cues,
      narration: chapter.cues.map(c => c.text).join(" "),
      ink: [],
      cursor: { x: 852, y: 250 },
      regions: heartBoardRegions,
    };
  });
}
