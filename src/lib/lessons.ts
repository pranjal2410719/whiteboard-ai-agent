import { starterSuggestions, type BoardMark, type BoardPage, type SessionData, type StudySession, type TutorTurn } from "./types";
import { isRecordedClassKey, recordedClass } from "./recorded-classes";

const ink = "#293b32", green = "#3b805c", blue = "#507aaf", orange = "#bc7948", purple = "#8a6a9e";
const text = (x: number, y: number, value: string, size = 28, color = ink, extra: Partial<BoardMark> = {}): BoardMark => ({ type: "text", x, y, text: value, size, color, weight: 500, ...extra });
const path = (d: string, color = ink, strokeWidth = 2.8, fill = "none", extra: Partial<BoardMark> = {}): BoardMark => ({ type: "path", d, color, strokeWidth, fill, ...extra });
const rect = (x: number, y: number, w: number, h: number, fill: string, color = ink): BoardMark => ({ type: "rect", x, y, w, h, fill, color, strokeWidth: 2.4 });
const circle = (x: number, y: number, w: number, h: number, fill: string, color = ink): BoardMark => ({ type: "ellipse", x, y, w, h, fill, color, strokeWidth: 2.7 });
const heading = (value: string, width: number): BoardMark[] => [text(53, 57, value, 43, ink, { weight: 650 }), path(`M55 69 Q${width * 0.45} 65 ${width} 68`, "#84b998", 3.7)];
const page = (id: string, title: string, marks: BoardMark[], cursor = { x: 854, y: 245 }): BoardPage => ({ id, title, marks, cursor, ink: [] });
const formula = (value: string, width = 302, size = 48): BoardMark[] => [
  path(`M58 139 Q${width / 2} 135 ${width + 54} 137 L${width + 51} 205 Q${width / 2} 209 55 207 Z`, "#85b69a", 2.2, "#ebf4e8"),
  text(77, 187, value, size, "#2d5940", { weight: 600 }),
];
const triangle = (a = "a", b = "b", c = "c"): BoardMark[] => [
  path("M614 76 Q614 161 612 251 Q729 250 854 252 Q736 166 614 76 Z", "#355943", 3.2, "#eaf4e9"),
  path("M617 79 L615 248 L850 250", "#91b39b", 0.9),
  path("M614 228 L637 229 L637 251", "#466a50", 2.1, "#dcebdc"),
  text(a.length > 1 ? 548 : 580, 174, a, a.length > 1 ? 29 : 36, purple),
  text(716, 286, b, b.length > 1 ? 29 : 36, blue),
  text(745, 156, c, c.length > 1 ? 31 : 38, orange),
  text(648, 239, "90°", 21, green),
];

export const catalog = [
  { key: "pythagoras", title: "The Pythagorean theorem", subject: "Mathematics", description: "Discover the relationship between a triangle’s sides and trigonometric ratios.", color: "green" },
  { key: "fractions", title: "Understanding fractions", subject: "Mathematics", description: "See how equal parts fit into a whole.", color: "purple" },
  { key: "water-cycle", title: "The water cycle", subject: "Science", description: "Follow a water droplet’s journey around Earth.", color: "blue" },
  { key: "linear-equations", title: "Linear equations", subject: "Algebra", description: "Keep both sides balanced to find an unknown.", color: "orange" },
  { key: "gravity-friction", title: "Gravity and Friction", subject: "Physics", description: "Explore gravitational weight, normal force, and friction resistance.", color: "blue" },
  { key: "human-cell", title: "The Human Cell", subject: "Biology", description: "Tour the cell organelles: nucleus, mitochondria, rough ER, and membrane.", color: "purple" },
] as const;

function pythagorasBoard() {
  return page("theorem", "The theorem", [
    ...heading("The Pythagorean theorem", 425),
    text(55, 115, "For any right-angled triangle:", 29),
    ...formula("a² + b² = c²", 283, 49),
    path("M73 221 Q69 239 88 245 M80 236 L89 246 L76 248", green, 2),
    text(102, 249, "c is always the longest side!", 26, green, { rotate: -1.5 }),
    text(55, 285, "Trig: sin θ = opp/hyp · cos θ = adj/hyp", 24, blue),
    ...triangle(),
    text(795, 81, "hypotenuse", 29, orange, { rotate: -7 }),
    path("M811 92 Q815 117 778 132 M780 122 L775 133 L787 134", orange, 2.1),
  ], { x: 844, y: 250 });
}

function gravityBoard(example = false) {
  if (example) {
    return page("gravity-example", "Friction on a sled", [
      ...heading("Friction on a sled", 355),
      text(55, 115, "A 20 kg sled on packed snow (μ = 0.15).", 29),
      ...formula("f = μ · m · g = 29.4 N", 325, 41),
      text(55, 235, "F_N = 20 × 9.8 = 196 N", 28, purple),
      text(55, 275, "f = 0.15 × 196 = 29.4 N", 28, green),
      path("M550 240 L880 240", green, 3.5),
      path("M610 236 L750 236 Q770 236 780 220 L750 185 L630 185 Z", "#355943", 2.6, "#eaf4e9"),
      text(665, 215, "20 kg sled", 24, green),
      path("M750 210 L840 210 M830 202 L840 210 L830 218", orange, 2.8),
      text(770, 192, "F_pull > 29.4 N", 22, orange),
      path("M610 210 L540 210 M550 202 L540 210 L550 218", purple, 2.8),
      text(545, 192, "f = 29.4 N", 22, purple),
      text(585, 290, "Kinetic friction resists steady sliding.", 24, blue),
    ], { x: 840, y: 210 });
  }
  return page("gravity-idea", "Gravity & Friction", [
    ...heading("Gravity and Friction", 395),
    text(55, 115, "Forces govern weight, contact, and sliding.", 29),
    ...formula("F_g = m · g    f ≤ μ · F_N", 345, 38),
    text(55, 235, "Gravity acts down; normal force pushes up.", 26, purple),
    text(55, 275, "Friction opposes the direction of slide.", 26, green),
    path("M550 240 L880 240", green, 3.5),
    rect(640, 175, 80, 65, "#eaf4e9", "#355943"),
    text(660, 215, "10 kg", 26, green),
    path("M680 240 L680 305 M672 295 L680 305 L688 295", blue, 2.8),
    text(695, 285, "F_g = 98 N", 23, blue),
    path("M680 175 L680 110 M672 120 L680 110 L688 120", green, 2.8),
    text(695, 135, "F_N = 98 N", 23, green),
    path("M720 207 L810 207 M800 200 L810 207 L800 214", orange, 2.8),
    text(735, 190, "F_pull →", 23, orange),
    path("M640 207 L560 207 M570 200 L560 207 L570 214", purple, 2.8),
    text(560, 190, "← f_friction", 23, purple),
    text(580, 295, "μ = 0.4  ·  f_max = 39.2 N", 25, green),
  ], { x: 810, y: 207 });
}

function cellBoard(example = false) {
  if (example) {
    return page("cell-pipeline", "The Protein Pipeline", [
      ...heading("The Protein Pipeline", 385),
      text(55, 115, "How a human cell builds and exports proteins:", 28),
      ...formula("DNA → mRNA → Protein → Vesicle", 360, 34),
      text(55, 230, "1. Nucleus: DNA transcribes to mRNA code.", 25, purple),
      text(55, 260, "2. Ribosomes & ER: assemble & fold protein.", 25, blue),
      text(55, 290, "3. Golgi: packages into secretory vesicles.", 25, green),
      rect(560, 100, 115, 60, "#eddcf6", "#734991"),
      text(575, 138, "Nucleus", 24, "#734991"),
      path("M675 130 L720 130 M712 124 L720 130 L712 136", purple, 2.5),
      text(680, 120, "mRNA", 18, purple),
      rect(720, 100, 130, 60, "#eaf4e9", "#3b805c"),
      text(730, 138, "Rough ER", 23, "#3b805c"),
      path("M785 160 L785 205 M779 197 L785 205 L791 197", green, 2.5),
      text(795, 185, "Protein", 18, green),
      rect(720, 205, 130, 60, "#faebd7", "#bc7948"),
      text(735, 242, "Golgi Sacs", 23, "#bc7948"),
      path("M720 235 L675 235 M683 229 L675 235 L683 241", orange, 2.5),
      circle(645, 235, 18, 18, "#dceaf5", "#507aaf"),
      text(630, 242, "Vesicle", 17, "#507aaf"),
      text(560, 295, "Secreted through cell membrane.", 22, green),
    ], { x: 785, y: 235 });
  }
  return page("cell-idea", "Inside the Human Cell", [
    ...heading("Inside the Human Cell", 415),
    text(55, 115, "The microscopic building block of human life.", 28),
    ...formula("Glucose + O₂ → ATP + CO₂", 345, 36),
    text(55, 232, "• Nucleus: houses DNA genetic blueprint", 25, purple),
    text(55, 262, "• Mitochondria: generates ATP energy", 25, orange),
    text(55, 292, "• Membrane: regulates nutrient exchange", 25, green),
    circle(740, 175, 155, 110, "#f3faf1", "#3b805c"),
    circle(685, 165, 46, 44, "#eddcf6", "#734991"),
    circle(680, 160, 16, 16, "#522b70", "#381750"),
    path("M665 152 Q675 175 698 162", "#7e52a8", 1.8),
    text(630, 95, "Nucleus (DNA)", 24, "#734991"),
    circle(820, 130, 32, 18, "#faebd7", "#bc7948"),
    path("M798 130 Q808 120 818 130 T838 130", "#bc7948", 2.2),
    circle(640, 230, 26, 15, "#faebd7", "#bc7948"),
    path("M620 230 Q630 222 640 230 T655 230", "#bc7948", 2),
    text(810, 95, "Mitochondria (ATP)", 24, "#bc7948"),
    path("M715 130 C735 110 765 125 750 145", purple, 2.5),
    path("M725 145 C750 135 775 150 760 170", purple, 2.5),
    circle(732, 122, 3, 3, "#462166", "#462166"),
    circle(745, 138, 3, 3, "#462166", "#462166"),
    circle(758, 155, 3, 3, "#462166", "#462166"),
    text(760, 165, "Rough ER & Ribosomes", 22, purple),
    path("M785 208 Q815 212 805 230", green, 2.8),
    path("M790 222 Q820 226 810 244", green, 2.8),
    circle(826, 216, 4, 4, "#dceaf5", blue),
    text(780, 275, "Golgi Apparatus", 22, green),
    text(740, 65, "Cell Membrane", 24, green),
  ], { x: 740, y: 175 });
}

function fractionBoard(example = false) {
  const marks: BoardMark[] = [
    ...heading(example ? "Adding fractions" : "Understanding fractions", example ? 300 : 424),
    text(55, 117, example ? "Start with equal-sized pieces." : "A fraction is part of a whole.", 29),
    ...formula(example ? "¼ + ¼ = ½" : "3 out of 4 = ¾", 315, 43),
    text(61, 253, example ? "Two quarters make one half." : "The pieces must be equal in size.", 26, green),
    text(580, 84, example ? "Let's put them together" : "One whole, four pieces", 29, purple),
  ];
  for (let i = 0; i < 4; i++) marks.push(rect(572 + i * 75, 125, 73, 92, i < (example ? 2 : 3) ? "#d9ebe0" : "#fbfcf8", "#477354"));
  marks.push(path("M573 230 Q573 240 588 240 L714 240 L725 249 L736 240 L859 240 Q873 240 871 229", blue, 2), text(637, 280, example ? "2 of 4 shaded" : "3 of 4 shaded", 28, blue));
  return page(example ? "fraction-example" : "fraction-idea", example ? "Adding quarters" : "Equal parts", marks, { x: 872, y: 218 });
}

function waterBoard() {
  return page("water", "A drop’s journey", [
    ...heading("The water cycle", 309), text(55, 114, "Water is always on the move.", 29),
    text(59, 168, "1. Evaporation", 32, orange), text(59, 214, "2. Condensation", 32, purple), text(59, 260, "3. Precipitation", 32, blue),
    circle(565, 85, 25, 25, "#f8e7a3", "#bb944b"),
    ...["M565 43 L565 33", "M526 58 L518 51", "M524 86 L513 86", "M602 64 L610 57", "M592 119 L600 127"].map(d => path(d, "#bb944b", 2.3)),
    path("M689 124 Q657 120 669 100 Q676 87 690 93 Q695 66 719 73 Q735 47 762 64 Q778 73 775 87 Q804 81 813 102 Q827 128 797 128 Z", "#768e9b", 2.6, "#e7eef2"),
    ...[0, 1, 2, 3, 4].map(i => path(`M${702 + i * 23} 149 l-9 19`, blue, 3)),
    path("M510 231 Q539 215 569 231 T631 231 T694 231 T756 231 T818 231 T882 231 L883 258 Q848 271 815 258 T751 258 T687 258 T623 258 T559 258 T510 258 Z", "#709bb1", 2, "#dfedf2"),
    path("M564 214 Q545 180 569 146 M556 153 L570 143 L575 159", orange, 2.5),
    text(590, 293, "And the cycle continues…", 27, green),
  ], { x: 873, y: 224 });
}

function equationBoard(example = false) {
  return page(example ? "equation-example" : "equations", example ? "Finding x" : "A balanced equation", [
    ...heading(example ? "Let's solve for x" : "Linear equations", 318),
    text(55, 117, "An equation is like a balance.", 29),
    ...formula(example ? "2x + 3 = 11" : "x + 3 = 7", 291, 43),
    text(55, 250, "Do the same thing to both sides.", 26, green),
    ...(example ? [text(568, 102, "2x + 3 − 3 = 11 − 3", 34, blue), text(568, 164, "2x = 8", 36), text(568, 229, "x = 4", 43, green), path("M566 240 Q620 236 666 239", green, 3)] : [
      path("M553 130 L866 130 M709 131 L707 245 M661 248 L748 248", "#477354", 4),
      path("M578 133 L538 206 L620 206 Z M839 133 L798 206 L880 206 Z", "#81958a", 2, "#edf5eb"),
      text(542, 107, "x + 3", 33, purple), text(826, 108, "7", 35, orange), text(623, 286, "Keep it balanced!", 28, blue),
    ]),
  ], { x: example ? 682 : 867, y: example ? 231 : 207 });
}

const introductions: Record<string, string> = {
  pythagoras: "Let’s explore the Pythagorean theorem! I’ve drawn a right triangle on the board. The key idea? The squares of the two shorter sides add up to the square of the longest side.",
  fractions: "Imagine sharing a chocolate bar with a friend. I’ve divided one whole into four equal pieces on the board. Three shaded pieces represent three quarters. Want to try adding some pieces together?",
  "water-cycle": "Let’s follow a drop of water! The Sun warms the surface, water rises as vapor, and cooling vapor forms clouds. Eventually, the water falls back down as rain or snow.",
  "linear-equations": "Think of an equation as a perfectly balanced scale. If we take three away from one side, we must take three away from the other. Let’s use that idea to find x.",
  "gravity-friction": "Welcome to physics! We’re exploring gravity and friction. Gravity accelerates all masses downward (F_g = m · g), the surface supports it with a normal force (F_N), and microscopic contact resists sliding with friction (f = μ · F_N).",
  "human-cell": "Welcome to biology! Let’s explore the anatomy of the human cell. I’ve illustrated a full animal cell on the board, featuring the DNA-bearing nucleus, ATP-generating mitochondria, rough ER, ribosomes, and the outer cell membrane.",
};

export function createLesson(key: string): SessionData {
  const entry = catalog.find(c => c.key === key) || catalog[0];
  const initial = entry.key === "fractions" ? fractionBoard()
    : entry.key === "water-cycle" ? waterBoard()
    : entry.key === "linear-equations" ? equationBoard()
    : entry.key === "gravity-friction" ? gravityBoard()
    : entry.key === "human-cell" ? cellBoard()
    : pythagorasBoard();
  return { title: entry.title, subject: entry.subject, lessonKey: entry.key, pages: [initial], pageIndex: 0, messages: [{ role: "assistant", content: introductions[entry.key] || introductions.pythagoras }], suggestions: [...starterSuggestions], saved: false, mode: "guided", quiz: null, lecture: null };
}

export function previewSessions(): StudySession[] {
  return catalog.map(({ key }, i) => ({ id: `preview-${i}`, data: createLesson(key), createdAt: new Date(0).toISOString(), updatedAt: new Date(0).toISOString() }));
}

export const practice: Record<string, { q: string; second: string; answer: string; explanation: string; hint: string }> = {
  pythagoras: { q: "A right triangle has shorter sides of 6 and 8.", second: "How long is the hypotenuse?", answer: "10", explanation: "6² + 8² = 36 + 64 = 100. The positive square root of 100 is 10, so the hypotenuse is 10 units long.", hint: "Square each short side first: 6² = 36 and 8² = 64. Add them, then take the square root." },
  fractions: { q: "A bar has four equal pieces.", second: "If you shade three, what fraction is shaded?", answer: "3/4", explanation: "Three shaded pieces out of four equal pieces is 3/4. The top number counts shaded pieces; the bottom counts all the equal pieces.", hint: "Write the number of shaded pieces above the total number of equal pieces." },
  "water-cycle": { q: "Water vapor cools into tiny droplets.", second: "What is this process called?", answer: "condensation", explanation: "Condensation turns water vapor into liquid droplets. Those droplets gather to form clouds.", hint: "It’s the second step on our board. It starts with “con” and is the opposite of evaporation." },
  "linear-equations": { q: "x + 5 = 12", second: "What value of x keeps the equation balanced?", answer: "7", explanation: "Subtract 5 from each side: x = 12 − 5 = 7. Check: 7 + 5 = 12.", hint: "Undo the addition by subtracting 5 from 12. Do the same to both sides." },
  "gravity-friction": { q: "A 10 kg crate rests on a floor with μ = 0.4.", second: "How many newtons of friction resist sliding it? (g = 9.8 m/s²)", answer: "39.2", explanation: "Normal force F_N = 10 × 9.8 = 98 N. Friction force f = μ × F_N = 0.4 × 98 = 39.2 N. You must push with > 39.2 N to slide it.", hint: "Calculate normal force F_N = m · g first (10 × 9.8), then multiply by μ = 0.4." },
  "human-cell": { q: "Which organelle generates ATP energy for cellular work?", second: "Known as the powerhouse of the human cell.", answer: "mitochondria", explanation: "Mitochondria carry out cellular respiration, converting glucose and oxygen into ATP energy molecules.", hint: "It has folded cristae to maximize surface area and starts with the letter 'm'." },
};

export function quizPage(key: string): BoardPage {
  const q = practice[key] || practice.pythagoras;
  return page("quiz", "Your turn", [
    ...heading("Your turn!", 215), text(55, 126, q.q, 35), text(55, 183, q.second, 31, green),
    text(55, 265, "Sketch your thinking on the board.", 26, blue),
    ...(key === "pythagoras" ? triangle("6", "8", "?") : []),
    ...(key === "gravity-friction" ? [
      path("M570 230 L870 230", green, 3), rect(670, 175, 75, 55, "#eaf4e9", green),
      text(690, 210, "10 kg", 26, green), text(590, 190, "μ = 0.4", 26, purple),
      path("M670 202 L590 202 M600 196 L590 202 L600 208", purple, 2.6), text(600, 225, "f = ?", 26, purple)
    ] : []),
    ...(key === "human-cell" ? [
      circle(740, 175, 155, 110, "#f3faf1", "#3b805c"),
      circle(685, 165, 46, 44, "#eddcf6", "#734991"),
      circle(820, 130, 32, 18, "#faebd7", "#bc7948"),
      path("M798 130 Q808 120 818 130 T838 130", "#bc7948", 2.2),
      path("M820 85 L820 110 M813 102 L820 110 L827 102", orange, 2.6),
      text(775, 75, "Powerhouse = ?", 25, orange),
    ] : []),
  ], { x: key === "pythagoras" ? 841 : 555, y: 243 });
}

export function examplePage(key: string): BoardPage {
  if (key === "fractions") return fractionBoard(true);
  if (key === "linear-equations") return equationBoard(true);
  if (key === "gravity-friction") return gravityBoard(true);
  if (key === "human-cell") return cellBoard(true);
  if (key === "water-cycle") return page("puddle", "From puddle to cloud", [...heading("From puddle to cloud", 373), text(56, 132, "Puddle  →  water vapor  →  cloud", 36, blue), text(57, 199, "Heat helps water evaporate.", 31, orange), text(57, 251, "Cooling helps vapor condense.", 31, green)], { x: 649, y: 129 });
  return page("worked-example", "A worked example", [...heading("A worked example", 342), text(55, 113, "a = 3,   b = 4,   c = ?", 31), ...formula("3² + 4² = 25", 294, 43), text(61, 252, "c = √25 = 5", 34, green), ...triangle("3", "4", "5"), text(701, 71, "a 3–4–5 triangle", 28, blue, { rotate: -3 })], { x: 854, y: 245 });
}

export function guidedLecture(key: string) {
  return recordedClass(isRecordedClassKey(key) ? key : "pythagoras");
}

export function guidedLectureTurn(data: SessionData): TutorTurn {
  const lecture = guidedLecture(data.lessonKey);
  return {
    explanation: `“${lecture.title}” is ready. Follow the concept, worked example, and practice check. Press pause if you’d like time to sketch.`,
    page: null, pages: lecture.scenes,
    lecture: { title: lecture.title, totalSeconds: lecture.totalSeconds, startIndex: 0, sceneCount: lecture.scenes.length },
    suggestions: ["Quiz me", "Explain it simply", "Show me an example"],
    mode: "guided", quiz: null,
  };
}

export function findLesson(topic: string) {
  if (/pythag|triangle|hypotenuse|geometry|trig|sin|cos|tan/i.test(topic)) return "pythagoras";
  if (/fraction|quarter|halves|numerator/i.test(topic)) return "fractions";
  if (/water|evaporation|precipitation/i.test(topic)) return "water-cycle";
  if (/equation|algebra|solve for x/i.test(topic)) return "linear-equations";
  if (/gravity|friction|force|weight|newton|normal force/i.test(topic)) return "gravity-friction";
  if (/cell|biology|organelle|nucleus|mitochondria|cytoplasm|membrane|ribosome/i.test(topic)) return "human-cell";
  return catalog.find(c => c.key === topic)?.key || null;
}

export function guidedTurn(data: SessionData, prompt: string): TutorTurn {
  const query = prompt.trim().toLowerCase();
  const base: TutorTurn = { explanation: "", page: null, suggestions: [...starterSuggestions], mode: "guided", quiz: null };
  if (data.quiz && !/example|simply|quiz me|start over/.test(query)) {
    if (/hint|help|not sure/.test(query)) return { ...base, explanation: data.quiz.hint, suggestions: ["Reveal the answer", "Explain it simply"], quiz: data.quiz };
    const answer = data.quiz.answer;
    const correct = answer === "condensation" ? /condensation|condens(e|es|ing)/i.test(query)
      : answer === "3/4" ? /3\s*\/\s*4|¾|three.?quarters|0\.75/.test(query)
      : answer === "mitochondria" ? /mitochondri(a|on)|powerhouse/i.test(query)
      : answer === "39.2" ? /39(?:\.2)?/.test(query)
      : new RegExp(`(?:^|[^\\d.])${answer}(?:$|[^\\d.])`).test(query);
    if (!correct && !/reveal|answer|give up/.test(query)) return { ...base, explanation: `Not quite yet. ${data.quiz.hint} Try once more, or ask me to reveal the answer.`, quiz: data.quiz, suggestions: ["Give me a hint", "Reveal the answer"] };
    return { ...base, explanation: `${correct ? "Exactly right! " : "Let’s work it out. "}${data.quiz.explanation}`, suggestions: ["Show me an example", "Back to the lesson"] };
  }
  const key = data.lessonKey;
  if (/quiz|test me|practice/.test(query)) {
    const questions: Record<string, { q: string; second: string; answer: string; explanation: string; hint: string }> = {
      pythagoras: { q: "The short sides are 6 and 8.", second: "How long is the hypotenuse?", answer: "10", explanation: "6² + 8² = 36 + 64 = 100. The positive square root of 100 is 10, so the hypotenuse is 10 units long.", hint: "Square each short side first: 6² = 36 and 8² = 64. Add them, then take the square root." },
      fractions: { q: "A bar has four equal pieces.", second: "If you shade three, what fraction is shaded?", answer: "3/4", explanation: "Three shaded pieces out of four equal pieces is 3/4. The top number counts shaded pieces; the bottom counts all the equal pieces.", hint: "Write the number of shaded pieces above the total number of equal pieces." },
      "water-cycle": { q: "Water vapor cools into tiny droplets.", second: "What is this process called?", answer: "condensation", explanation: "Condensation turns water vapor into liquid droplets. Those droplets gather to form clouds.", hint: "It’s the second step on our board. It starts with “con” and is the opposite of evaporation." },
      "linear-equations": { q: "x + 5 = 12", second: "What value of x keeps the equation balanced?", answer: "7", explanation: "Subtract 5 from each side: x = 12 − 5 = 7. Check: 7 + 5 = 12.", hint: "Undo the addition by subtracting 5 from 12. Do the same to both sides." },
      "gravity-friction": { q: "A 10 kg crate rests on a floor with μ = 0.4.", second: "What is the friction force in newtons? (g = 9.8)", answer: "39.2", explanation: "Normal force F_N = 10 × 9.8 = 98 N. Friction f = 0.4 × 98 = 39.2 N. Push > 39.2 N to slide it.", hint: "Calculate normal force F_N = m · g first, then multiply by μ = 0.4." },
      "human-cell": { q: "Which organelle generates ATP energy for cellular work?", second: "Known as the powerhouse of the human cell.", answer: "mitochondria", explanation: "Mitochondria perform cellular respiration, breaking down glucose in the presence of oxygen to produce ATP.", hint: "It has folded cristae to maximize surface area and starts with the letter 'm'." },
    };
    const q = questions[key] || questions.pythagoras;
    return { ...base, explanation: `Your turn! ${q.q} ${q.second} Type your answer below.`, page: quizPage(key), quiz: { answer: q.answer, hint: q.hint, explanation: q.explanation }, suggestions: ["Give me a hint", "Reveal the answer"] };
  }
  if (/example|work through|show me how/.test(query)) {
    if (key === "pythagoras") return { ...base, explanation: "Let’s try a 3–4–5 triangle. Square the shorter sides: 3² = 9 and 4² = 16. Add them to get 25, then take the square root. The longest side is 5 units! Ratios: sin(θ) = 3/5 = 0.6, cos(θ) = 4/5 = 0.8, tan(θ) = 3/4 = 0.75.", page: examplePage("pythagoras"), suggestions: ["Quiz me", "Explain it simply", "Back to the lesson"] };
    if (key === "fractions") return { ...base, explanation: "Take one quarter of a bar, then one more quarter. You have two of the four equal pieces: 2/4. That covers exactly half the bar, so 1/4 + 1/4 = 1/2.", page: fractionBoard(true) };
    if (key === "linear-equations") return { ...base, explanation: "Start with 2x + 3 = 11. Subtract 3 from both sides to get 2x = 8. Divide both sides by 2 and you have x = 4. Substituting 4 back into the original equation gives 11.", page: equationBoard(true) };
    if (key === "gravity-friction") return { ...base, explanation: "A 20 kg sled on packed snow (μ = 0.15). First find the normal force: F_N = 20 × 9.8 = 196 N. Then multiply by μ: f = 0.15 × 196 = 29.4 N. You need to pull with over 29.4 N to keep it moving!", page: gravityBoard(true) };
    if (key === "human-cell") return { ...base, explanation: "Here is how cell organelles collaborate to build and export proteins: the nucleus transcribes DNA into mRNA, ribosomes on the rough ER translate the code into protein chains, and the Golgi apparatus packages them into vesicles for export through the cell membrane.", page: cellBoard(true) };
    return { ...base, explanation: "Think of a puddle after a rainstorm. Sunlight warms the puddle, and liquid water evaporates. Higher up, the vapor cools and condenses into cloud droplets. When they grow heavy enough, rain falls again.", page: examplePage("water-cycle") };
  }
  if (/cell|organelle|mitochondria|nucleus|membrane|cytoplasm|draw.*cell|generate.*cell|illustration/i.test(query)) {
    return {
      ...base,
      explanation: "I’ve generated the complete cellular anatomy diagram on the board! Notice the central nucleus holding DNA, surrounding ATP-producing mitochondria, folded rough ER with ribosome specks, and the enclosing lipid bilayer cell membrane.",
      page: cellBoard(),
      suggestions: ["Show me an example", "Quiz me", "Explain it simply"],
    };
  }
  if (/gravity|friction|force|vector|draw.*force/i.test(query)) {
    return {
      ...base,
      explanation: "I’ve drawn the free-body force diagram on the board. You can see gravity pulling downward (F_g = m·g), the normal force pushing back upward (F_N), the pulling force to the right, and friction opposing sliding to the left.",
      page: gravityBoard(),
      suggestions: ["Show me an example", "Quiz me", "Explain it simply"],
    };
  }
  if (/simpl|why|explain|what is|how does|back to|start over/.test(query)) {
    const simple: Record<string, string> = {
      pythagoras: "Imagine building a square on each side of a right triangle. The areas of the two smaller squares, added together, exactly fill the largest square. That’s what a² + b² = c² means. Trigonometry links these sides to angles using ratios like sine, cosine, and tangent.",
      fractions: "A fraction tells you “how many parts out of how many equal parts.” In 3/4, the 4 means the whole was cut into four equal pieces. The 3 means we’re looking at three of them.",
      "water-cycle": "Water goes up as vapor, gathers into clouds, and comes back down as rain. The Sun supplies the heat, and gravity brings the water back to Earth. Then it starts again!",
      "linear-equations": "The equals sign says both sides have the same value. Whatever you add, subtract, multiply, or divide on one side, do it to the other side too. This lets you uncover x without changing the balance.",
      "gravity-friction": "Gravity is Earth pulling downward on all mass: F = m·g. The floor pushes back up with a normal force. When you try to slide an object, microscopic rough points catch against each other, creating friction that opposes the slide.",
      "human-cell": "Think of the cell as a bustling miniature city: the nucleus is city hall holding the DNA blueprints, mitochondria are power plants generating ATP energy, ribosomes and rough ER are factories building proteins, and the cell membrane is the gated security wall.",
    };
    return { ...base, explanation: simple[key] || introductions.pythagoras, page: createLesson(key).pages[0] };
  }
  return { ...base, explanation: "This session is in guided mode. I can walk you through a worked example, explain the idea another way, or give you a practice question. For an open-ended question like this one, connect a language model in Settings → Tutor connection.", suggestions: [...starterSuggestions] };
}
