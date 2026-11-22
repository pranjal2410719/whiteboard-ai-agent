import type { BoardMark, BoardPage, LessonCue } from "@/lib/types";
import { head, txt, circle, arrow, penHighlight, green, blue, orange, purple } from "../helpers";
import script from "./script.json";

export const circuitImg = (): BoardMark => ({
  type: "image",
  src: "/assets/electric-circuit.svg",
  x: 515,
  y: 30,
  w: 430,
  h: 270,
  alt: "DC Electric Circuit Diagram",
});

export const circuitInitialBoard: BoardPage = {
  id: "circuit-initial",
  title: "DC Electric Circuit",
  seconds: 0,
  narration: "Welcome to DC Electric Circuit. Today we trace voltage, resistance, conventional current flow, and Ohm's law.",
  cues: [],
  ink: [],
  cursor: { x: 852, y: 250 },
  marks: [
    ...head("DC Electric Circuit", 410),
    txt(55, 120, "Interactive Schematic & Current Flow", 28, green),
    txt(55, 175, "1. DC Battery creates Electromotive Force (EMF)", 25, orange),
    txt(55, 215, "2. Switch controls conductive circuit continuity", 25, green),
    txt(55, 255, "3. Resistor opposes current via Ohm's Law (V = IR)", 25, purple),
    txt(55, 295, "4. Lamp converts electricity to light & thermal heat", 25, blue),
    circuitImg(),
  ],
};

export const circuitSceneBoards: BoardMark[][][] = [
  // Scene 1
  [
    [...head("DC Electric Circuit", 410), txt(55, 120, "Closed conducting loop + DC voltage source", 28), circuitImg()],
    [
      txt(55, 168, "Battery creates Electromotive Force (EMF)", 28, orange),
      circle(585, 165, 30, 40, orange, 2.8),
      arrow(510, 165, 555, 165, orange),
      txt(505, 170, "Battery (V)", 16, orange, 650, "end"),
    ],
    [
      ...penHighlight(55, 240, 360, "V = Potential Difference (Volts)", 32),
      txt(560, 312, "Long bar = (+) · Short bar = (−)", 22, green),
    ],
  ],
  // Scene 2
  [
    [
      ...head("Current Flow & Switch", 410),
      txt(55, 118, "Switch controls circuit continuity", 28),
      circuitImg(),
      circle(700, 93, 30, 22, green, 2.8),
      arrow(700, 48, 700, 72, green),
      txt(700, 42, "Switch S (Closed)", 16, green, 650, "middle"),
    ],
    [
      txt(55, 168, "Conventional Current: (+) to (−)", 28, blue),
      arrow(600, 95, 650, 95, blue),
      txt(625, 85, "Current I →", 18, blue, 650, "middle"),
      circle(875, 165, 28, 38, blue, 2.8),
    ],
    [
      ...penHighlight(55, 240, 340, "I = Q / t (Amperes, A)", 34),
      txt(560, 312, "Current flows from positive to negative rail.", 22, blue),
    ],
  ],
  // Scene 3
  [
    [
      ...head("Ohm's Law: V = I × R", 420),
      txt(55, 118, "Resistor opposes electric current", 28),
      circuitImg(),
      circle(875, 165, 32, 42, purple, 2.8),
      arrow(848, 165, 910, 165, purple),
      txt(850, 220, "Resistor R (4 Ω)", 16, purple, 650, "start"),
    ],
    [],
    [
      txt(55, 165, "Given: V = 12 V, R = 4 Ω", 28, blue),
      txt(55, 205, "I = V / R = 12 V / 4 Ω = 3 A", 31, purple),
    ],
    [
      ...penHighlight(55, 245, 340, "Current I = 3 Amperes", 36),
      txt(55, 310, "Electrical energy dissipates as heat", 24, green),
      txt(560, 312, "Ohm's Law verified: V = 12V, I = 3A, R = 4Ω", 22, purple),
    ],
  ],
  // Scene 4
  [
    [
      ...head("Load & Power Transfer", 400),
      txt(55, 118, "Lamp converts electricity to light & heat", 28),
      circuitImg(),
      circle(720, 245, 30, 26, orange, 2.8),
      arrow(720, 280, 720, 260, orange),
      txt(720, 295, "Lamp / Load", 16, orange, 650, "middle"),
    ],
    [
      txt(55, 168, "Power: P = V × I = I² × R", 28, orange),
      txt(55, 210, "Rate of electrical energy consumption", 26, green),
    ],
    [
      ...penHighlight(55, 245, 360, "P = V × I (Watts, W)", 34),
      txt(55, 310, "Chemical → Electrical → Light & Heat", 25, blue),
      txt(560, 312, "DC circuit completed with load and power.", 22, green),
    ],
  ],
];

export function buildCircuitScenes(): BoardPage[] {
  return script.chapters.map((chapter, index): BoardPage => {
    let seconds = 0;
    const marks: BoardMark[] = [];
    const cues = chapter.cues.map((cue, i): LessonCue => {
      const from = seconds;
      const firstMark = marks.length;
      if (circuitSceneBoards[index] && circuitSceneBoards[index][i]) {
        marks.push(...circuitSceneBoards[index][i]);
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
      id: `circuit-diagram-${index + 1}`,
      title: chapter.title,
      seconds,
      marks,
      cues,
      narration: chapter.cues.map(c => c.text).join(" "),
      ink: [],
      cursor: { x: 852, y: 250 },
    };
  });
}
