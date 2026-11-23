import { starterSuggestions, type BoardMark, type BoardPage, type DiagramRegion, type SessionData, type StudySession, type SupportedLanguage, type TutorTurn } from "./types";
import { isRecordedClassKey, recordedClass } from "./recorded-classes";
import { diagramPage, diagrams, isDiagramKey, mitochondriaRegions } from "./diagrams";
import { getClassInitialBoard, mitochondriaBoardRegions } from "@/classes";
import { guidedAnnotation } from "./annotate";

const ink = "#293b32", green = "#3b805c", blue = "#507aaf", orange = "#bc7948", purple = "#8a6a9e";
const text = (x: number, y: number, value: string, size = 28, color = ink, extra: Partial<BoardMark> = {}): BoardMark => ({ type: "text", x, y, text: value, size, color, weight: 500, ...extra });
const path = (d: string, color = ink, strokeWidth = 2.8, fill = "none", extra: Partial<BoardMark> = {}): BoardMark => ({ type: "path", d, color, strokeWidth, fill, ...extra });
const rect = (x: number, y: number, w: number, h: number, fill: string, color = ink): BoardMark => ({ type: "rect", x, y, w, h, fill, color, strokeWidth: 2.4 });
const circle = (x: number, y: number, w: number, h: number, fill: string, color = ink): BoardMark => ({ type: "ellipse", x, y, w, h, fill, color, strokeWidth: 2.7 });
const heading = (value: string, width: number): BoardMark[] => [text(53, 57, value, 43, ink, { weight: 650 }), path(`M55 69 Q${width * 0.45} 65 ${width} 68`, "#84b998", 3.7)];
const page = (id: string, title: string, marks: BoardMark[], cursor = { x: 854, y: 245 }, regions?: DiagramRegion[]): BoardPage => ({ id, title, marks, cursor, ink: [], ...(regions ? { regions } : {}) });
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
  { key: "human-cell", title: "Human Cell", subject: "Biology", description: "Tour the cell organelles: nucleus, mitochondria, rough ER, ribosomes, and membrane.", color: "purple" },
] as const;

export function isCatalogKey(key: string): boolean {
  return catalog.some(c => c.key === key);
}

const staticPageCache = new Map<string, BoardPage>();
export function getStaticClassPage(key: string): BoardPage {
  if (staticPageCache.has(key)) return staticPageCache.get(key)!;
  const initial = getClassInitialBoard(key);
  const p = initial || diagramPage("human-cell");
  staticPageCache.set(key, p);
  return p;
}

function pythagorasBoard() {
  return page("theorem", "The theorem", [
    ...heading("Pythagorus", 240),
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
      circle(645, 235, 18, 18, "none", "#507aaf"),
      text(630, 242, "Vesicle", 17, "#507aaf"),
      text(560, 295, "Secreted through cell membrane.", 22, green),
    ], { x: 785, y: 235 });
  }
  return diagramPage("human-cell");
}

export function mitochondriaBoard(example = false, lang: SupportedLanguage = "en"): BoardPage {
  const isHi = lang === "hi";
  const isHinglish = lang === "hinglish";
  const title = isHi
    ? (example ? "माइटोकॉन्ड्रिया: एटीपी संश्लेषण" : "माइटोकॉन्ड्रिया: कोशिका का पावरहाउस")
    : isHinglish
    ? (example ? "Mitochondria: ATP Synthesis Example" : "Mitochondria: Cell ka Powerhouse")
    : (example ? "Mitochondria: ATP Synthesis" : "Mitochondria (The Cell's Powerhouse)");

  return page("mitochondria-deep-dive", title, [
    ...heading(title, 420),
    text(55, 115, isHi ? "कोशिकीय श्वसन एवं एटीपी ऊर्जा निर्माण:" : isHinglish ? "Cellular Respiration aur ATP Energy Production:" : "Cellular Respiration & ATP Production:", 27),
    ...formula("C₆H₁₂O₆ + 6 O₂ → 6 CO₂ + 6 H₂O + ATP", 345, 30),
    text(55, 205, isHi ? "1. दोहरी झिल्ली: चिकनी बाहरी झिल्ली + आंतरिक परतें" : isHinglish ? "1. Double Membrane: Smooth outer aur folded inner membrane" : "1. Double Membrane: Smooth outer + Folded inner membrane", 23, green),
    text(55, 238, isHi ? "2. क्रिस्टी: आंतरिक मुड़ी परतें एटीपी निर्माण क्षेत्र बढ़ाती हैं" : isHinglish ? "2. Cristae: Folds surface area badha kar max ATP banate hain" : "2. Cristae: Folds dramatically maximize surface area for ATP", 23, orange),
    text(55, 271, isHi ? "3. मैट्रिक्स: एंजाइम, माइटोकॉन्ड्रियल डीएनए और राइबोसोम" : isHinglish ? "3. Matrix: Enzymes, circular mtDNA aur ribosomes fluid" : "3. Matrix: Viscous interior with circular mtDNA & ribosomes", 23, purple),
    text(55, 304, isHi ? "4. F0F1-ATPase: प्रोटॉन प्रवाह से एटीपी बनाने वाला रोटरी मोटर" : isHinglish ? "4. F0F1-ATPase: Proton gradient se ATP generate karne wali motor" : "4. F0F1-ATPase: Rotary motor synthesizing ATP from ADP + Pi", 23, blue),
    {
      type: "image",
      src: "/assets/Mitochondria.png",
      x: 550,
      y: 12,
      w: 390,
      h: 310,
      alt: "Mitochondria Anatomy & ATP Synthesis",
    } as BoardMark,
  ], { x: 750, y: 160 }, mitochondriaBoardRegions);
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

const introductions: Record<string, string> = {
  "heart-diagram": "Welcome to anatomy and physiology! We are exploring the human heart and double circulation. Ask me to highlight, circle, or explain any chamber, valve, vessel, or blood flow pathway!",
  "circuit-diagram": "Welcome to physics! We are investigating a direct current (DC) electric circuit. Ask me to trace current flow, circle the battery, explain the switch, or calculate resistance using Ohm’s Law!",
  pythagoras: "Let’s explore the Pythagorean theorem! I’ve drawn a right triangle on the board. The key idea? The squares of the two shorter sides add up to the square of the longest side.",
  "human-cell": "Welcome to biology! Let’s explore the anatomy of the human cell. I’ve illustrated a full animal cell on the board, featuring the DNA-bearing nucleus, ATP-generating mitochondria, rough ER, ribosomes, and the outer cell membrane.",
};

export function createLesson(key: string): SessionData {
  const diag = isDiagramKey(key) ? diagrams[key] : null;
  const entry = catalog.find(c => c.key === key) || (diag ? { key, title: diag.title, subject: diag.subject, description: diag.intro, color: "blue" } : null) || catalog[0];
  const initial = getStaticClassPage(entry.key);
  const opening = isDiagramKey(entry.key)
    ? `Here is a labelled ${entry.title.toLowerCase()}. Ask me to circle, highlight, underline, box or label any part — I’ll mark the exact spot on the diagram and explain what it does.`
    : introductions[entry.key] || introductions["human-cell"];
  const suggestions = isDiagramKey(entry.key)
    ? ["Show me an example", "Quiz me", diagrams[entry.key].prompts[0].replace(/[“”]/g, "")]
    : [...starterSuggestions];
  return { title: entry.title, subject: entry.subject, lessonKey: entry.key, pages: [initial], pageIndex: 0, messages: [{ role: "assistant", content: opening }], suggestions, saved: false, mode: "guided", quiz: null, lecture: null };
}

export function previewSessions(): StudySession[] {
  return catalog.map(({ key }, i) => ({ id: `preview-${i}`, data: createLesson(key), createdAt: new Date(0).toISOString(), updatedAt: new Date(0).toISOString() }));
}

export const practice: Record<string, { q: string; second: string; answer: string; explanation: string; hint: string }> = {
  "human-cell": { q: "Which organelle generates ATP energy for cellular work?", second: "Known as the powerhouse of the human cell.", answer: "mitochondria", explanation: "Mitochondria carry out cellular respiration, converting glucose and oxygen into ATP energy molecules.", hint: "It has folded cristae to maximize surface area and starts with the letter 'm'." },
  "mitochondria": { q: "Why is the inner membrane of mitochondria deeply folded into cristae?", second: "Consider what folding does to the usable reaction surface area.", answer: "surface area", explanation: "Deep cristae folds dramatically expand the surface area available for thousands of ATP synthase complexes to produce energy.", hint: "Folding maximizes the usable surface area inside a microscopic space." },
};

export function quizPage(key: string): BoardPage {
  if (key === "mitochondria") {
    const q = practice["mitochondria"];
    return page("quiz-mitochondria", "Your turn", [
      ...heading("Your turn!", 215), text(55, 126, q.q, 33), text(55, 183, q.second, 29, green),
      text(55, 265, "Sketch your answer on the whiteboard.", 26, blue),
      { type: "image", src: "/assets/Mitochondria.png", x: 560, y: 20, w: 380, h: 280, alt: "Mitochondria Anatomy & ATP Synthesis" } as BoardMark,
      circle(700, 140, 45, 30, "none", orange),
      text(570, 240, "Cristae folds = ?", 22, orange),
    ], { x: 555, y: 243 }, mitochondriaBoardRegions);
  }
  const q = practice[key] || practice["human-cell"];
  return page("quiz", "Your turn", [
    ...heading("Your turn!", 215), text(55, 126, q.q, 35), text(55, 183, q.second, 31, green),
    text(55, 265, "Sketch your thinking on the board.", 26, blue),
    { type: "image", src: "/assets/human_cell_diagram.png", x: 610, y: 14, w: 232, h: 310, alt: "Human Cell Anatomy and Organelles" } as BoardMark,
    circle(676, 219, 32, 22, "none", orange),
    path("M638 224 L576 224", orange, 2.6),
    text(570, 229, "Powerhouse = ?", 22, orange),
  ], { x: 555, y: 243 });
}

export function examplePage(key: string): BoardPage {
  if (key === "mitochondria") return mitochondriaBoard(true);
  return cellBoard(true);
}

export function guidedLecture(key: string) {
  return recordedClass(isRecordedClassKey(key) ? key : "human-cell");
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

export function linkedListBoard(example = false, lang: SupportedLanguage = "en"): BoardPage {
  const isHi = lang === "hi";
  const title = isHi ? "लिंक्ड लिस्ट (Linked List)" : "Linked List Structure";
  return page("linked-list", title, [
    ...heading(title, 390),
    text(55, 115, isHi ? "नोड्स की श्रृंखला (Nodes chain):" : "Linear collection of connected nodes:", 28),
    ...formula("Node = [ Value ] + [ Next Pointer ]", 355, 34),
    text(55, 230, isHi ? "1. पहला नोड HEAD कहलाता है।" : "1. First node is stored at HEAD pointer.", 25, purple),
    text(55, 260, isHi ? "2. मेमोरी में क्रमबद्ध होना ज़रूरी नहीं।" : "2. Dynamic non-contiguous memory allocation.", 25, blue),
    text(55, 290, isHi ? "3. आखिरी नोड NULL की तरफ इशारा करता है।" : "3. Last node points to NULL (end of list).", 25, green),
    // Head pointer
    text(570, 95, "HEAD", 23, green, { weight: 650 }),
    path("M595 102 L595 130 M588 120 L595 130 L602 120", green, 2.5),
    // Node 1
    rect(560, 135, 95, 60, "#eaf4e9", green),
    rect(625, 135, 30, 60, "#d8ebd5", green),
    text(580, 173, "10", 28, ink),
    circle(640, 165, 4, 4, ink, ink),
    path("M640 165 L705 165 M695 158 L705 165 L695 172", green, 2.6),
    // Node 2
    rect(710, 135, 95, 60, "#ebf2fa", blue),
    rect(775, 135, 30, 60, "#d4e4f7", blue),
    text(730, 173, "20", 28, ink),
    circle(790, 165, 4, 4, ink, ink),
    path("M790 165 L855 165 M845 158 L855 165 L845 172", blue, 2.6),
    // Node 3 (tail)
    rect(860, 135, 90, 60, "#faebe3", orange),
    text(875, 173, "NULL", 23, orange, { weight: 650 }),
    // Labels below
    text(575, 220, "Node 1", 20, green),
    text(725, 220, "Node 2", 20, blue),
    text(868, 220, "Tail / End", 20, orange),
    text(590, 275, "Complexity: Insert O(1) · Search O(n)", 23, purple),
  ], { x: 860, y: 165 });
}

export function searchBoard(example = false, lang: SupportedLanguage = "en"): BoardPage {
  const isHi = lang === "hi";
  const title = isHi ? "बाइनरी सर्च: खोज कैसे काम करती है" : "Binary Search Algorithm";
  return page("search-algo", title, [
    ...heading(title, 430),
    text(55, 115, isHi ? "क्रमबद्ध सूची में तेज़ी से खोजें:" : "Divide & conquer in a sorted array:", 28),
    ...formula("mid = ⌊(low + high) / 2⌋", 330, 40),
    text(55, 230, isHi ? "1. अगर target > mid: दायें भाग में खोजें।" : "1. If target > arr[mid]: search right half.", 25, purple),
    text(55, 260, isHi ? "2. अगर target < mid: बायें भाग में खोजें।" : "2. If target < arr[mid]: search left half.", 25, blue),
    text(55, 290, isHi ? "3. समय जटिलता: O(log n) सबसे तेज़।" : "3. Halves search space every step: O(log n).", 25, green),
    // Array boxes
    rect(545, 145, 50, 48, "#f3f5f2", ink), text(563, 176, "2", 23, ink),
    rect(595, 145, 50, 48, "#f3f5f2", ink), text(613, 176, "5", 23, ink),
    rect(645, 145, 50, 48, "#f3f5f2", ink), text(663, 176, "8", 23, ink),
    rect(695, 145, 58, 48, "#ebf2fa", blue), text(710, 176, "12", 24, blue, { weight: 650 }),
    rect(753, 145, 58, 48, "#eaf4e9", green), text(768, 176, "16", 24, green, { weight: 650 }),
    rect(811, 145, 58, 48, "#fef3e7", orange), text(826, 176, "23", 24, orange, { weight: 650 }),
    rect(869, 145, 58, 48, "#f3f5f2", ink), text(884, 176, "38", 23, ink),
    // Mid pointer
    text(710, 105, "MID (12)", 20, blue, { weight: 650 }),
    path("M724 112 L724 140 M717 130 L724 140 L731 130", blue, 2.5),
    // Target pointer
    text(816, 230, "TARGET (23)", 20, orange, { weight: 650 }),
    path("M840 212 L840 196 M833 204 L840 196 L847 204", orange, 2.5),
    // Low / High
    text(552, 222, "low=0", 19, purple),
    text(875, 222, "high=6", 19, purple),
    text(575, 275, "Step: 23 > 12 → search right half only!", 23, green, { rotate: -1 }),
  ], { x: 724, y: 140 });
}

export function customTopicBoard(topic: string, lang: SupportedLanguage = "en"): BoardPage {
  if (/microcondri|mitochondri|cell.*powerhouse|powerhouse.*cell|cristae|cellular.*respiration|atp.*synthesis|atp.*generation/i.test(topic)) {
    return mitochondriaBoard(false, lang);
  }
  const isHi = lang === "hi";
  const cleanTitle = topic.slice(0, 38).trim() || "Whiteboard Lesson";
  const title = cleanTitle;
  return page(`topic-${cleanTitle.toLowerCase().replace(/[^a-z0-9]/g, "-")}`, title, [
    ...heading(title, Math.min(430, 120 + cleanTitle.length * 12)),
    text(55, 115, isHi ? "मुख्य अवधारणा एवं सिद्धांत:" : "Key principles & foundational concept:", 28),
    ...formula(isHi ? "सिद्धांत → विश्लेषण → समाधान" : "Input → Process / Logic → Solution", 335, 34),
    text(55, 230, isHi ? "1. समस्या को छोटे भागों में विभाजित करें।" : "1. Break complex ideas into clear visual steps.", 25, purple),
    text(55, 260, isHi ? "2. मुख्य नियमों और सूत्रों को लागू करें।" : "2. Apply core rules and observe the pattern.", 25, blue),
    text(55, 290, isHi ? "3. बोर्ड पर चरण-दर-चरण समाधान देखें।" : "3. Verify results with whiteboard diagrams.", 25, green),
    // Diagram: Concept Flow Card 1
    rect(560, 95, 160, 58, "#eaf4e9", green),
    text(585, 132, "Step 1: Concept", 20, green, { weight: 600 }),
    path("M640 153 L640 178 M633 168 L640 178 L647 168", green, 2.5),
    // Concept Flow Card 2
    rect(560, 180, 160, 58, "#ebf2fa", blue),
    text(585, 217, "Step 2: Logic", 20, blue, { weight: 600 }),
    path("M720 209 L770 209 M760 202 L770 209 L760 216", blue, 2.5),
    // Concept Flow Card 3 (Result)
    rect(775, 140, 165, 80, "#faebe3", orange),
    text(795, 175, "Step 3: Solution", 21, orange, { weight: 650 }),
    text(795, 203, "Active Practice ✓", 18, orange),
    text(600, 275, "Interactive demonstration on whiteboard", 23, purple),
  ], { x: 775, y: 175 });
}

export function findLesson(topic: string) {
  if (/microcondri|mitochondri|cell.*powerhouse|powerhouse.*cell|cristae|cellular.*respiration|atp.*synthesis|atp.*generation/i.test(topic)) return "mitochondria";
  if (/linked.*list|node.*pointer|singly.*list|doubly.*list/i.test(topic)) return "linked-list";
  if (/search|binary.*search|khoj|खोज|linear.*search/i.test(topic)) return "search-algo";
  return "human-cell";
}

export function createCustomLesson(topic: string, lessonKey?: string | null, lang: SupportedLanguage = "en"): SessionData {
  const isHi = lang === "hi";
  const isHinglish = lang === "hinglish";
  const key = lessonKey || findLesson(topic);

  if (key === "mitochondria" || /microcondri|mitochondri|cell.*powerhouse|powerhouse.*cell|cristae|cellular.*respiration|atp.*synthesis|atp.*generation/i.test(topic)) {
    const page = mitochondriaBoard(false, lang);
    const explanation = isHi
      ? "नमस्ते! आज हम कोशिका के सबसे महत्वपूर्ण अंगक: माइटोकॉन्ड्रिया (Mitochondria) का अध्ययन करेंगे। इसे 'कोशिका का पावरहाउस' कहा जाता है क्योंकि यह ग्लूकोज और ऑक्सीजन से एटीपी (ATP) ऊर्जा बनाता है। बोर्ड पर इसका विस्तृत आंतरिक आरेख देखें!"
      : isHinglish
      ? "Welcome! Aaj hum cell ke vital powerhouse: Mitochondria ko explore karenge. Yeh food aur oxygen se cellular respiration ke zariye ATP energy generate karta hai. Whiteboard par iska authentic diagram dekhein!"
      : "Welcome! Today we are exploring the powerhouse of the cell: Mitochondria. Through cellular respiration, it combines glucose and oxygen to generate ATP chemical energy. I have illustrated its authentic anatomical diagram on the whiteboard—ask me to highlight cristae, matrix, DNA, or ATP synthase!";
    return {
      title: "Mitochondria (Powerhouse)",
      subject: "Biology",
      lessonKey: "mitochondria",
      pages: [page],
      pageIndex: 0,
      messages: [{ role: "assistant", content: explanation }],
      suggestions: isHi
        ? ["क्रिस्टी को हाइलाइट करें", "मैट्रिक्स कहां है?", "एटीपी सिंथेस समझाएं"]
        : isHinglish
        ? ["Cristae highlight karo", "Matrix kahan hai?", "ATP synthase samjhao"]
        : ["Highlight the cristae", "Circle the outer membrane", "Where is the matrix?"],
      saved: false,
      mode: "guided",
      quiz: null,
      lecture: null,
    };
  }
  
  if (key === "linked-list" || /link.*list/i.test(topic)) {
    const page = linkedListBoard(false, lang);
    const explanation = isHi
      ? "नमस्ते! आज हम लिंक्ड लिस्ट (Linked List) डेटा संरचना समझेंगे। बोर्ड पर मैंने नोड्स की एक श्रृंखला बनाई है। हर नोड में डेटा और अगले नोड का पॉइंटर होता है। पहला नोड HEAD कहलाता है।"
      : isHinglish
      ? "Hello! Aaj hum Linked List data structure seekhenge. Board par dekho: nodes ki linear chain hai. Har node me data aur next pointer hota hai, aur pehla node HEAD hota hai."
      : "Welcome! Today we are exploring Linked Lists. Unlike arrays, nodes are not stored at contiguous memory locations. Each node contains data and a pointer to the next node!";
    return {
      title: "Linked List Data Structure",
      subject: "Computer Science",
      lessonKey: "linked-list",
      pages: [page],
      pageIndex: 0,
      messages: [{ role: "assistant", content: explanation }],
      suggestions: isHi
        ? ["एक नोड जोड़ें (Insert)", "नोड हटाएं (Delete)", "डबली लिंक्ड लिस्ट"]
        : isHinglish
        ? ["Insert a node", "Delete a node", "Doubly linked list"]
        : ["Insert a node", "Delete a node", "Doubly linked list"],
      saved: false,
      mode: "guided",
      quiz: null,
      lecture: null,
    };
  }

  if (key === "search-algo" || /search|खोज|khoj/i.test(topic)) {
    const page = searchBoard(false, lang);
    const explanation = isHi
      ? "नमस्ते! चलिए बाइनरी सर्च (Binary Search) खोज एल्गोरिदम को समझते हैं। जब डेटा पहले से क्रमबद्ध (Sorted) हो, तो हम हर चरण में सूची को आधा (mid) कर देते हैं, जिससे खोज O(log n) समय में पूरी हो जाती है!"
      : isHinglish
      ? "Hello! Let's understand Binary Search algorithm. Sorted list me search karte waqt hum array ko har step me aadha kar dete hain: mid = (low + high) / 2. Isse search O(log n) me super fast hoti hai!"
      : "Welcome! Let's explore Search Algorithms. In a sorted list, Binary Search repeatedly halves the search space by inspecting the midpoint: mid = ⌊(low + high) / 2⌋. Time complexity is O(log n)!";
    return {
      title: "Binary Search Algorithm",
      subject: "Algorithms",
      lessonKey: "search-algo",
      pages: [page],
      pageIndex: 0,
      messages: [{ role: "assistant", content: explanation }],
      suggestions: isHi
        ? ["एक उदाहरण दिखाएं", "लीनियर सर्च से तुलना", "मुझसे सवाल पूछें"]
        : ["Show me an example", "Compare to linear search", "Quiz me"],
      saved: false,
      mode: "guided",
      quiz: null,
      lecture: null,
    };
  }

  if (key && catalog.some(c => c.key === key)) {
    return createLesson(key);
  }

  // Any custom topic
  const page = customTopicBoard(topic, lang);
  const explanation = isHi
    ? `नमस्ते! आज हम "${topic}" के विषय में विस्तार से समझेंगे। मैंने बोर्ड पर इसके मुख्य सिद्धांत और प्रवाह आरेख (flow diagram) तैयार कर दिया है। आप माइक से कोई भी प्रश्न पूछ सकते हैं!`
    : isHinglish
    ? `Welcome! Aaj hum "${topic}" explore karenge. Maine board par foundational concept aur step-by-step logic sketch kar diya hai. Mic button tap karke koi bhi sawaal poocho!`
    : `Welcome! Let's explore "${topic}". I have illustrated the core principles, logical structure, and visual steps on the whiteboard. Tap the microphone button to ask anything!`;
  return {
    title: topic.slice(0, 40),
    subject: "Knowledge Studio",
    lessonKey: "custom",
    pages: [page],
    pageIndex: 0,
    messages: [{ role: "assistant", content: explanation }],
    suggestions: isHi
      ? ["सरल भाषा में समझाएं", "एक उदाहरण दिखाएं", "मुझसे सवाल पूछें"]
      : ["Explain it simply", "Show me an example", "Quiz me"],
    saved: false,
    mode: "guided",
    quiz: null,
    lecture: null,
  };
}

export function guidedTurn(data: SessionData, prompt: string, lang: SupportedLanguage = "en"): TutorTurn {
  const query = prompt.trim().toLowerCase();
  const isHi = lang === "hi" || /[\u0900-\u097F]/.test(prompt);
  const isHinglish = lang === "hinglish";
  const base: TutorTurn = { explanation: "", page: null, suggestions: [...starterSuggestions], mode: "guided", quiz: null };

  if (data.quiz && !/example|simply|quiz me|start over|उदाहरण|सरल|सवाल|प्रश्न|दोबारा/.test(query)) {
    if (/hint|help|not sure|संकेत|मदद|हिंट/.test(query)) return { ...base, explanation: data.quiz.hint, suggestions: ["Reveal the answer", "Explain it simply"], quiz: data.quiz };
    const answer = data.quiz.answer;
    const correct = answer === "condensation" ? /condensation|condens(e|es|ing)/i.test(query)
      : answer === "3/4" ? /3\s*\/\s*4|¾|three.?quarters|0\.75/.test(query)
      : answer === "mitochondria" ? /mitochondri(a|on)|powerhouse/i.test(query)
      : answer === "39.2" ? /39(?:\.2)?/.test(query)
      : new RegExp(`(?:^|[^\\d.])${answer}(?:$|[^\\d.])`).test(query);
    if (!correct && !/reveal|answer|give up/.test(query)) return { ...base, explanation: `Not quite yet. ${data.quiz.hint} Try once more, or ask me to reveal the answer.`, quiz: data.quiz, suggestions: ["Give me a hint", "Reveal the answer"] };
    return { ...base, explanation: `${correct ? "Exactly right! " : "Let’s work it out. "}${data.quiz.explanation}`, suggestions: ["Show me an example", "Back to the lesson"] };
  }

  // Diagram boards: the learner can ask for a part to be circled, highlighted, underlined,
  // boxed, pointed at or labelled. Regions are declared on the page, so this needs no model.
  const boardPage = data.pages[data.pageIndex] || data.pages[0] || null;
  const onDiagram = Boolean(boardPage?.regions?.length);
  const isDrawingCommand = /highlight|underline|wire|connect|lead|label|name it|box|square|rectangle|point to|where is|locate|circle/i.test(query);
  const isExplanationQuery = (/explain|topic|what is|tell me|how does|how do|example|worked|doubt/i.test(query)) && !isDrawingCommand;
  const annotated = isExplanationQuery ? null : guidedAnnotation(boardPage, prompt, lang);
  if (annotated && !/quiz|test me|practice/.test(query)) {
    return {
      ...base,
      explanation: annotated.explanation,
      page: annotated.page,
      suggestions: isHi
        ? ["चित्र का दूसरा भाग देखें", "भाग का नाम बताएं", "मुझसे सवाल पूछें"]
        : isHinglish
        ? ["Dusra part dekho", "Part ka naam batao", "Mera quiz lo"]
        : ["Circle another part", "Label a part", "Quiz me"],
    };
  }

  // Specialized search/खोज queries
  if (/search|खोज|khoj|binary.*search/i.test(query) || /खोज कैसे काम/i.test(prompt)) {
    const page = searchBoard(false, lang);
    const explanation = isHi
      ? "खोज (Search) में सबसे शक्तिशाली तरीका बाइनरी सर्च (Binary Search) है! जब सूची पहले से क्रमबद्ध (Sorted) हो, तो हम बीच वाले तत्व (Mid) को देखते हैं। अगर आपका नंबर बीच वाले से बड़ा है, तो हम बायें हिस्से को छोड़कर केवल दायें हिस्से में खोजते हैं। इस तरह हर कदम पर डेटा आधा हो जाता है और O(log n) समय में तुरंत परिणाम मिल जाता है!"
      : isHinglish
      ? "Search me sabse efficient Binary Search hota hai! Sorted array me hum mid = (low + high) / 2 calculate karte hain. Agar target mid se bada hai, toh hum left half discard karke right half me search karte hain. Har step me search space aadhi ho jaati hai, jisse O(log n) time me search complete hota hai!"
      : "In computer science, Binary Search is the most efficient search algorithm for sorted data! It calculates mid = ⌊(low + high) / 2⌋. If the target is greater than mid, it eliminates the entire left half. By halving the space every step, search takes only O(log n) operations!";
    return {
      ...base,
      explanation,
      page,
      suggestions: isHi ? ["एक उदाहरण दिखाएं", "लीनियर सर्च से तुलना", "मुझसे सवाल पूछें"] : ["Show me an example", "Compare linear search", "Quiz me"],
    };
  }

  // Linked list queries
  if (/linked.*list|node|pointer|singly|doubly|head.*null/i.test(query)) {
    const page = linkedListBoard(false, lang);
    const explanation = isHi
      ? "लिंक्ड लिस्ट में डेटा अलग-अलग मेमोरी ब्लॉक (नोड्स) में स्टोर होता है। हर नोड के दो हिस्से होते हैं: डेटा और अगले नोड का पॉइंटर। पहला नोड HEAD कहलाता है और अंतिम नोड NULL की तरफ इशारा करता है!"
      : isHinglish
      ? "Linked List me data nodes ke form me store hota hai. Har node me do parts hote hain: Value aur Next Pointer. HEAD pehle node ko point karta hai aur last node NULL point karta hai!"
      : "A Linked List represents elements as distinct nodes linked by pointers. Each node contains data and a reference to the next node. The first node is HEAD, and the tail points to NULL!";
    return {
      ...base,
      explanation,
      page,
      suggestions: ["Insert a node", "Delete a node", "Doubly linked list"],
    };
  }

  const key = data.lessonKey;
  if (onDiagram && /quiz|test me|practice|सवाल|प्रश्न|क्विज़/.test(query)) {
    const target = boardPage!.regions![1] || boardPage!.regions![0];
    const pointed = guidedAnnotation(boardPage, `point to ${target.label}`, lang);
    return {
      ...base,
      explanation: isHi
        ? `आपकी बारी! मैंने चित्र के एक भाग की ओर इशारा किया है। इसका नाम नीचे लिखकर बताएं।`
        : isHinglish
        ? `Aapki baari! Maine diagram ke ek part par point kiya hai. Iska naam neeche type karein.`
        : "Your turn! I’ve pointed at one part of the diagram. Name it and type your answer below.",
      page: pointed?.page || null,
      quiz: { answer: target.id.replace(/-/g, " "), hint: `Follow the arrow. ${target.note || `It is the ${target.label}.`}`, explanation: target.note || `${target.label} is a labelled part of this diagram.` },
      suggestions: isHi ? ["संकेत दें", "उत्तर बताएं"] : isHinglish ? ["Hint do", "Answer batao"] : ["Give me a hint", "Reveal the answer"],
    };
  }
  if (/quiz|test me|practice|सवाल|प्रश्न|क्विज़/.test(query)) {
    const questions: Record<string, { q: string; second: string; answer: string; explanation: string; hint: string }> = {
      pythagoras: { q: "The short sides are 6 and 8.", second: "How long is the hypotenuse?", answer: "10", explanation: "6² + 8² = 36 + 64 = 100. The positive square root of 100 is 10, so the hypotenuse is 10 units long.", hint: "Square each short side first: 6² = 36 and 8² = 64. Add them, then take the square root." },
      fractions: { q: "A bar has four equal pieces.", second: "If you shade three, what fraction is shaded?", answer: "3/4", explanation: "Three shaded pieces out of four equal pieces is 3/4. The top number counts shaded pieces; the bottom counts all the equal pieces.", hint: "Write the number of shaded pieces above the total number of equal pieces." },
      "water-cycle": { q: "Water vapor cools into tiny droplets.", second: "What is this process called?", answer: "condensation", explanation: "Condensation turns water vapor into liquid droplets. Those droplets gather to form clouds.", hint: "It’s the second step on our board. It starts with “con” and is the opposite of evaporation." },
      "linear-equations": { q: "x + 5 = 12", second: "What value of x keeps the equation balanced?", answer: "7", explanation: "Subtract 5 from each side: x = 12 − 5 = 7. Check: 7 + 5 = 12.", hint: "Undo the addition by subtracting 5 from 12. Do the same to both sides." },
      "gravity-friction": { q: "A 10 kg crate rests on a floor with μ = 0.4.", second: "What is the friction force in newtons? (g = 9.8)", answer: "39.2", explanation: "Normal force F_N = 10 × 9.8 = 98 N. Friction f = 0.4 × 98 = 39.2 N. Push > 39.2 N to slide it.", hint: "Calculate normal force F_N = m · g first, then multiply by μ = 0.4." },
      "human-cell": { q: "Which organelle generates ATP energy for cellular work?", second: "Known as the powerhouse of the human cell.", answer: "mitochondria", explanation: "Mitochondria perform cellular respiration, breaking down glucose in the presence of oxygen to produce ATP.", hint: "It has folded cristae to maximize surface area and starts with the letter 'm'." },
    };
    const q = questions[key] || questions["human-cell"];
    return { ...base, explanation: `Your turn! ${q.q} ${q.second} Type your answer below.`, page: quizPage(key), quiz: { answer: q.answer, hint: q.hint, explanation: q.explanation }, suggestions: isHi ? ["संकेत दें", "उत्तर बताएं"] : isHinglish ? ["Hint do", "Answer batao"] : ["Give me a hint", "Reveal the answer"] };
  }
  if (/microcondri|mitochondri|cell.*powerhouse|powerhouse.*cell|cristae|cellular.*respiration|atp.*synthesis|atp.*generation/i.test(query)) {
    const isExample = /example|work through|show me how|उदाहरण/i.test(query);
    return {
      ...base,
      explanation: isHi
        ? "माइटोकॉन्ड्रिया (कोशिका का पावरहाउस): यह दोहरी झिल्ली वाला अंगक है। अंदरूनी झिल्ली मुड़कर 'क्रिस्टी' बनाती है जिससे एटीपी संश्लेषण की सतह बढ़ती है। मैट्रिक्स में क्रेब्स चक्र चलता है और F0F1-एटीपेस रोटरी मोटर एटीपी बनाती है।"
        : isHinglish
        ? "Mitochondria (Powerhouse of the cell): Isme double membrane hoti hai. Inner membrane deep folds banati hai jinhe 'Cristae' kehte hain, jo ATP generation ke liye surface area maximize karti hain. Matrix fluid me circular mtDNA aur ribosomes hote hain, aur F0F1-ATPase motor ATP fuel banata hai!"
        : "Here is the detailed diagram of Mitochondria (the cell's powerhouse)! It has a double membrane: a smooth outer boundary and an inner membrane deeply folded into cristae to maximize surface area for ATP synthesis. The central matrix fluid contains circular mtDNA and 70S ribosomes, while F0F1-ATPase rotary motor complexes generate ATP energy through aerobic cellular respiration.",
      page: mitochondriaBoard(isExample, lang),
      suggestions: isHi
        ? ["क्रिस्टी को हाइलाइट करें", "मैट्रिक्स कहां है?", "एटीपी सिंथेस समझाएं"]
        : isHinglish
        ? ["Cristae highlight karo", "Matrix kahan hai?", "ATP synthase samjhao"]
        : ["Highlight the cristae", "Circle the outer membrane", "Where is the matrix?"],
    };
  }
  if (/example|work through|show me how|उदाहरण/.test(query)) {
    return {
      ...base,
      explanation: isHi
        ? "कोशिका अंगक प्रोटीन कैसे बनाते हैं: केंद्रक डीएनए को mRNA में बदलता है, खुरदरी ईआर पर राइबोसोम कोड को प्रोटीन में अनुवादित करते हैं, और गॉल्जी उपकरण उन्हें निर्यात के लिए पैक करता है।"
        : isHinglish
        ? "Cell organelles protein kaise banate hain: Nucleus DNA ko mRNA me transcribe karta hai, rough ER par ribosomes code ko protein me translate karte hain, aur Golgi export ke liye pack karta hai."
        : "Here is how cell organelles collaborate to build and export proteins: the nucleus transcribes DNA into mRNA, ribosomes on the rough ER translate the code into protein chains, and the Golgi apparatus packages them into vesicles for export through the cell membrane.",
      page: cellBoard(true),
      suggestions: isHi ? ["केंद्रक को सर्कल करें", "माइटोकॉन्ड्रिया हाइलाइट करें", "मुझसे सवाल पूछें"] : isHinglish ? ["Nucleus ko circle karo", "Mitochondria highlight karo", "Mera quiz lo"] : ["Circle the nucleus", "Highlight the mitochondria", "Quiz me"]
    };
  }
  if (/cell|organelle|nucleus|membrane|cytoplasm|draw.*cell|generate.*cell|illustration/i.test(query)) {
    return {
      ...base,
      explanation: isHi
        ? "मैंने बोर्ड पर संपूर्ण कोशिका शरीर-रचना आरेख बनाया है! केंद्रक में डीएनए, एटीपी ऊर्जा बनाने वाले माइटोकॉन्ड्रिया, राइबोसोम युक्त खुरदरी ईआर, और कोशिका झिल्ली देखें।"
        : isHinglish
        ? "Maine board par complete cellular anatomy diagram draw kar diya hai! Center me DNA holding Nucleus, ATP energy mitochondria, rough ER, aur cell membrane dekhein."
        : "I’ve generated the complete cellular anatomy diagram on the board! Notice the central nucleus holding DNA, surrounding ATP-producing mitochondria, folded rough ER with ribosome specks, and the enclosing lipid bilayer cell membrane.",
      page: onDiagram ? null : cellBoard(),
      suggestions: isHi ? ["एक उदाहरण दिखाएं", "मुझसे सवाल पूछें", "सरल भाषा में समझाएं"] : ["Show me an example", "Quiz me", "Explain it simply"],
    };
  }
  if (/gravity|friction|force|vector|ramp|draw.*force/i.test(query)) {
    return {
      ...base,
      explanation: isHi
        ? "यहाँ आनत तल (Ramp) पर बलों का आरेख है: नीचे की ओर गुरुत्वाकर्षण, तल के लंबवत अभिलंब बल और गति का विरोध करता घर्षण बल।"
        : isHinglish
        ? "Yahan inclined plane par forces ka diagram hai: neeche gravity, surface ke perpendicular normal force, aur motion ko oppose karta friction."
        : "Here are the mechanics on an inclined ramp: gravity decomposes along and perpendicular to the slope, countered by the normal force and friction opposing slide.",
      page: onDiagram ? null : diagramPage("inclined-diagram"),
      suggestions: isHi ? ["एक उदाहरण दिखाएं", "मुझसे सवाल पूछें", "सरल भाषा में समझाएं"] : ["Show me an example", "Quiz me", "Explain it simply"],
    };
  }
  if (/simpl|why|explain|what is|how does|back to|start over|सरल|क्यों|क्या|समझा|व्याख्या/.test(query)) {
    const simple: Record<string, string> = {
      pythagoras: isHi
        ? "समकोण त्रिभुज में दो छोटी भुजाओं पर बने वर्गों का कुल क्षेत्रफल सबसे लंबी भुजा (कर्ण) पर बने वर्ग के क्षेत्रफल के बराबर होता है: a² + b² = c²।"
        : isHinglish
        ? "Right triangle me do choti sides par banaye gaye squares ka area sabse lambi side (hypotenuse) ke square ke barabar hota hai: a² + b² = c²."
        : "Imagine building a square on each side of a right triangle. The areas of the two smaller squares, added together, exactly fill the largest square. That’s what a² + b² = c² means. Trigonometry links these sides to angles using ratios like sine, cosine, and tangent.",
      fractions: isHi
        ? "भिन्न बताता है कि 'समान भागों में से कितने भाग लिए गए हैं'। 3/4 में 4 का अर्थ है कि पूरी वस्तु चार बराबर भागों में कटी थी और 3 का अर्थ है कि हम 3 भाग देख रहे हैं।"
        : isHinglish
        ? "Fraction batata hai ki 'equal parts me se kitne parts liye gaye'. 3/4 me 4 ka matlab 4 equal parts aur 3 ka matlab hum 3 parts dekh rahe hain."
        : "A fraction tells you “how many parts out of how many equal parts.” In 3/4, the 4 means the whole was cut into four equal pieces. The 3 means we’re looking at three of them.",
      "human-cell": isHi
        ? "कोशिका को एक शहर की तरह समझें: केंद्रक में योजनाएं (डीएनए) होती हैं, माइटोकॉन्ड्रिया ऊर्जा बनाने वाले पावर प्लांट हैं, और झिल्ली सुरक्षा दीवार है।"
        : isHinglish
        ? "Cell ko ek city ki tarah samjhein: Nucleus blueprint (DNA) rakhta hai, Mitochondria power plant hai jo ATP energy banata hai, aur Membrane security wall hai."
        : "Think of the cell as a bustling miniature city: the nucleus is city hall holding the DNA blueprints, mitochondria are power plants generating ATP energy, ribosomes and rough ER are factories building proteins, and the cell membrane is the gated security wall.",
      "mitochondria": isHi
        ? "माइटोकॉन्ड्रिया कोशिका के पावर प्लांट हैं: दोहरी झिल्ली, मुड़ी हुई क्रिस्टी और मैट्रिक्स एंजाइम भोजन व ऑक्सीजन को एटीपी ऊर्जा में बदलते हैं।"
        : isHinglish
        ? "Mitochondria cell ke power plants hain: Double membrane, folded cristae aur matrix enzymes food aur oxygen ko ATP energy me convert karte hain."
        : "Mitochondria are the cell's power plants: a smooth outer membrane, folded cristae maximizing surface area, and matrix enzymes converting nutrients into ATP fuel.",
      "heart-diagram": isHi
        ? "मानव हृदय एक दोहरा पंप है: दायाँ भाग फेफड़ों में रक्त भेजता है (फुफ्फुसीय परिसंचरण) और बायाँ भाग पूरे शरीर में ऑक्सीजनयुक्त रक्त पंप करता है (दैहिक परिसंचरण)।"
        : isHinglish
        ? "Human heart ek double pump hai: Right heart lungs me blood bhejta hai aur Left heart pure body me oxygenated blood pump karta hai."
        : "The human heart is a dual-loop muscular pump: the right side drives the pulmonary loop to oxygenate blood in the lungs, while the left ventricle propels oxygen-rich blood through the aorta into systemic circulation.",
    };
    const diagramSimple = isHi
      ? "यह बोर्ड एक नामांकित आरेख है। किसी भी भाग (जैसे दायाँ अलिंद, बायाँ निलय, महाधमनी) को हाइलाइट करने के लिए कहें और मैं विस्तार से समझाऊँगी!"
      : isHinglish
      ? "Yeh board ek labelled diagram hai. Kisi bhi part (jaise Right Atrium, Left Ventricle, Aorta) ko highlight karne ko bolein aur main detail me explain karungi!"
      : "This board is a labelled diagram, so the cleanest way to understand it is part by part: ask me to circle or highlight a component and I’ll explain what it does and why it matters.";
    return { ...base, explanation: onDiagram ? diagramSimple : (simple[key] || introductions["human-cell"]), page: onDiagram ? null : createLesson(key).pages[0] };
  }

  if (onDiagram) {
    return {
      ...base,
      explanation: isHi
        ? `आपका आरेख बोर्ड पर है। किसी भी भाग को सर्कल, हाइलाइट, रेखांकित या लेबल करने के लिए कहें — जैसे "${boardPage!.regions![2]?.label || boardPage!.regions![0].label} को हाइलाइट करें"।`
        : isHinglish
        ? `Aapka diagram board par hai. Kisi bhi part ko circle, highlight, underline ya label karne ko bolein — jaise "${boardPage!.regions![2]?.label || boardPage!.regions![0].label} ko highlight karein".`
        : `Your diagram stays on the board. Ask me to circle, highlight, underline, box or label any part and I’ll mark it exactly — for example “highlight the ${boardPage!.regions![2]?.label || boardPage!.regions![0].label}”.`,
      suggestions: isHi ? ["केंद्रक को सर्कल करें", "सरल भाषा में समझाएं", "मुझसे सवाल पूछें"] : isHinglish ? ["Nucleus ko circle karo", "Simply explain karo", "Mera quiz lo"] : ["Circle the nucleus", "Explain it simply", "Quiz me"],
    };
  }

  // Any other open-ended question: dynamically demonstrate visually on the board!
  const customPage = customTopicBoard(prompt, lang);
  const explanation = isHi
    ? `आपके प्रश्न: "${prompt}" के लिए मैंने व्हाइटबोर्ड पर आरेख और चरण-दर-चरण समाधान तैयार किया है। मुख्य सिद्धांतों को समझें और अगले कदम के लिए पूछें!`
    : isHinglish
    ? `Aapke query: "${prompt}" ke liye maine whiteboard par step-by-step demonstration bana diya hai. Core logic ko samjhein aur aage poochhein!`
    : `To explain "${prompt}", I have sketched the core structure and demonstration steps on the whiteboard. Let's walk through it together!`;
  return {
    ...base,
    explanation,
    page: customPage,
    suggestions: isHi ? ["एक उदाहरण दिखाएं", "सरल भाषा में समझाएं", "मुझसे सवाल पूछें"] : ["Show me an example", "Explain it simply", "Quiz me"],
  };
}
