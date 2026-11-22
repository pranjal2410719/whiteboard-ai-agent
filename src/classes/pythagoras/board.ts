import type { BoardMark, BoardPage, LessonCue } from "@/lib/types";
import { head, txt, line, arrow, penHighlight, green, blue, orange, purple, mint } from "../helpers";
import script from "./script.json";

export const triangle = () => [
  line("M608 89 L608 245 L853 245 Z", "#486747", 3, mint),
  line("M609 225 L629 225 L629 245", "#547351", 2.1),
  txt(639, 234, "90°", 20, green),
];

export const labels = (a: string, b: string, c: string) => [
  txt(552, 175, a, 31, purple),
  txt(703, 278, b, 31, blue),
  txt(749, 150, c, 31, orange),
];

export const pythagorasInitialBoard: BoardPage = {
  id: "theorem",
  title: "The theorem",
  seconds: 0,
  narration: "For any right-angled triangle, the square of the hypotenuse equals the sum of the squares of the other two sides.",
  cues: [],
  ink: [],
  cursor: { x: 844, y: 250 },
  marks: [
    ...head("Pythagorus", 240),
    txt(55, 115, "For any right-angled triangle:", 29),
    txt(283, 115, "a² + b² = c²", 49, "#1f3a2b", 650),
    line("M73 221 Q69 239 88 245 M80 236 L89 246 L76 248", green, 2),
    txt(102, 249, "c is always the longest side!", 26, green),
    txt(55, 285, "Trig: sin θ = opp/hyp · cos θ = adj/hyp", 24, blue),
    ...triangle(),
    labels("a", "b", "c")[0],
    labels("a", "b", "c")[1],
    labels("a", "b", "c")[2],
    txt(795, 81, "hypotenuse", 29, orange),
    line("M811 92 Q815 117 778 132 M780 122 L775 133 L787 134", orange, 2.1),
  ],
};

export const pythagorasSceneBoards: BoardMark[][][] = [
  // Scene 1
  [
    [...head("Read the triangle"), txt(55, 119, "Find the square corner first."), ...triangle()],
    [txt(55, 166, "a and b: the two legs", 27, purple), txt(55, 205, "c: opposite the right angle", 27, orange), ...labels("a", "b", "c"), arrow(842, 89, 759, 132, orange), txt(803, 82, "hypotenuse", 24, orange)],
    [...penHighlight(55, 235, 290, "a² + b² = c²", 39), txt(592, 312, "leg square areas = hypotenuse area", 23, green)],
  ],
  // Scene 2
  [
    [...head("Find the ladder length"), txt(55, 112, "Wall: 4 m   ·   Ground: 3 m", 28), ...triangle(), ...labels("4 m", "3 m", "c")],
    [txt(55, 160, "3² = 9 m²", 30, blue), txt(232, 160, "4² = 16 m²", 30, purple), txt(55, 205, "c² = 9 + 16 = 25 m²", 31)],
    [...penHighlight(55, 230, 295, "c = √25 = 5 m", 37), txt(804, 128, "5 m", 26, green), txt(580, 314, "The ladder is a length, not an area.", 23, green)],
  ],
  // Scene 3
  [
    [...head("Try six and eight", 344), txt(55, 121, "The legs are 6 m and 8 m.", 30), txt(55, 160, "What is the diagonal?", 29, blue), ...triangle(), ...labels("6 m", "8 m", "?")],
    [],
    [txt(55, 201, "6² + 8² = 36 + 64 = 100", 29, blue), ...penHighlight(55, 222, 298, "c = √100 = 10 m", 35)],
    [txt(787, 143, "10 m", 31, green), txt(57, 308, "Check: 10² = 100", 24, green), txt(575, 314, "3, 4, 5 → 6, 8, 10: double every side", 22, blue)],
  ],
  // Scene 4
  [
    [...head("Use the rule again", 385), txt(56, 118, "1. Check for a right angle.", 29), ...triangle(), ...labels("a", "b", "c")],
    [txt(56, 168, "2. Add squares to find c.", 29), txt(56, 211, "Missing a leg? Subtract squares.", 27, purple), txt(568, 311, "Missing leg: b² = c² − a²", 27, purple)],
    [...penHighlight(55, 238, 374, "3. Square root → side length", 32), txt(56, 308, "Check that c is longest.", 24, green)],
  ],
];

export function buildPythagorasScenes(): BoardPage[] {
  return script.chapters.map((chapter, index): BoardPage => {
    let seconds = 0;
    const marks: BoardMark[] = [];
    const cues = chapter.cues.map((cue, i): LessonCue => {
      const from = seconds;
      const firstMark = marks.length;
      if (pythagorasSceneBoards[index] && pythagorasSceneBoards[index][i]) {
        marks.push(...pythagorasSceneBoards[index][i]);
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
      id: `pythagoras-${index + 1}`,
      title: chapter.title,
      seconds,
      marks,
      cues,
      narration: chapter.cues.map(c => c.text).join(" "),
      ink: [],
      cursor: { x: 844, y: 250 },
    };
  });
}
