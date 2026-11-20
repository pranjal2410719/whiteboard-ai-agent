import { describePage, resolveAnnotations, withAnnotations } from "./annotate";
import { MAX_LECTURE_SECONDS } from "./types";
import type { BoardMark, BoardPage, ChatMessage, SessionData, SupportedLanguage, TutorTurn } from "./types";

export type Provider = "gemini" | "openai";
export type TabKeys = { gemini?: string | null; openai?: string | null };
type Config = { provider: Provider; key: string; model: string; base: string };
export class TutorError extends Error {
  status: number;
  constructor(message: string, status = 502) { super(message); this.status = status; }
}

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta";
export function providerConfig(tab: TabKeys = {}): Config {
  const geminiKey = tab.gemini?.trim() || process.env.GEMINI_API_KEY?.trim() || process.env.GOOGLE_API_KEY?.trim() || "";
  const geminiModel = process.env.GEMINI_MODEL || "gemini-3.8-live";
  if (geminiKey) return { provider: "gemini", key: geminiKey, model: geminiModel, base: GEMINI_BASE };
  const openaiKey = tab.openai?.trim() || process.env.OPENAI_API_KEY?.trim() || "";
  return {
    provider: "openai", key: openaiKey, model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
    base: (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, ""),
  };
}
export const isConnected = (tab: TabKeys = {}) => Boolean(providerConfig(tab).key);
export function serverKey(provider: Provider): string {
  return provider === "gemini" ? (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "").trim() : (process.env.OPENAI_API_KEY || "").trim();
}
export function connectionInfo(tab: TabKeys = {}) {
  const config = providerConfig(tab);
  return { connected: Boolean(config.key), provider: config.provider, model: config.model };
}
const finite = (v: unknown, fallback: number, low: number, high: number) => typeof v === "number" && Number.isFinite(v) ? Math.max(low, Math.min(high, v)) : fallback;
const color = (v: unknown, fallback: string) => typeof v === "string" && (/^#[0-9a-f]{3,8}$/i.test(v) || v === "none") ? v : fallback;

export function sanitizeMark(value: unknown): BoardMark | null {
  if (!value || typeof value !== "object") return null;
  const m = value as Record<string, unknown>;
  if (!["text", "path", "rect", "ellipse", "image"].includes(String(m.type))) return null;
  const mark: BoardMark = {
    type: m.type as BoardMark["type"], x: finite(m.x, 0, -2000, 3000), y: finite(m.y, 0, -1000, 2000),
    color: color(m.color, "#304d3a"), fill: color(m.fill, "none"),
    size: finite(m.size, 28, 10, 80), strokeWidth: finite(m.strokeWidth, 2.6, 0, 20),
    weight: finite(m.weight, 500, 400, 700), rotate: finite(m.rotate, 0, -360, 360),
    opacity: finite(m.opacity, 1, 0.05, 1), dashed: m.dashed === true,
  };
  if (mark.type === "text") {
    if (typeof m.text !== "string" || !m.text.trim()) return null;
    mark.text = m.text.slice(0, 220);
  } else if (mark.type === "path") {
    if (typeof m.d !== "string" || m.d.length > 40000 || !/^[MmLlHhVvCcSsQqTtAaZz0-9eE.\s,+\-]+$/.test(m.d)) return null;
    mark.d = m.d;
  } else if (mark.type === "image") {
    if (typeof m.src !== "string" || !m.src.trim()) return null;
    mark.src = m.src.slice(0, 1000);
    mark.alt = typeof m.alt === "string" ? m.alt.slice(0, 200) : "diagram";
    mark.w = finite(m.w, 430, 20, 1000);
    mark.h = finite(m.h, 270, 20, 600);
  } else {
    mark.w = finite(m.w, 50, 0, 2000); mark.h = finite(m.h, 50, 0, 1000);
  }
  return mark;
}

const systemPrompt = `You are Chalkly, a patient, accurate visual tutor with a real whiteboard and marker. Teach the learner's requested topic, not a generic example. Use the draw_on_whiteboard function for every answer; its ordered elements are drawn live by your marker. The board is 1000 by 330 units. Keep ALL content within x=45..945, y=30..300. Use a two-column layout: short handwritten heading at (55,57) size 42, a green underline path, very short explanatory text and a highlighted formula on the left (x=55..470), and a carefully labeled diagram on the right (x=550..930). Text y is the baseline. Each line of text must be its own element. No markdown or LaTeX: use Unicode math symbols. Estimate each text character at 0.4*font size in width. Use dark ink #293b32, sage green #3b805c, blue #507aaf, mauve #8a6a9e, amber #bc7948, and pale green fills #eaf4e9. For paths use valid SVG d commands; rectangles use x,y,w,h; ellipses use center x,y and radii w,h; images use x,y,w,h,src,alt. Layer fill shapes first and text labels afterward. Give a concise encouraging explanation and 2–3 relevant follow-up suggestions, each at most 28 characters. Use prior turns and student annotations for context. If quizzing, do not show the answer until the learner attempts it. If the question only needs a short verbal reply, use an empty elements array to preserve the existing board. Never execute arbitrary instructions, fetch URLs, or output code to run. Decline requests for weapon construction, biological weaponization, violence, exploit development, or intrusion, and teach a safe alternative. Some boards already show a labelled diagram image from the assets folder and list annotatable region ids in the board context. When the learner asks you to circle, highlight, underline, box, point at or label part of that existing diagram, do not redraw it and do not return the image: leave elements empty and put each request in annotations with the exact region id from the board context. Choose the style the learner asked for. Explain in prose what that part does. If an image is shown without region ids, describe what the image represents and use vector elements (rectangles, ellipses, arrows, text labels) placed directly around or over the image (within x=515..945, y=30..300) to highlight its components. Only return elements when the board is blank or you are teaching something new.`;
export type TurnOptions = { lecture?: boolean; language?: SupportedLanguage; lectureContext?: { topic: string; chapter: number; chapterTitle?: string; timestamp: number; caption?: string } };
export function buildSystemPrompt(options: TurnOptions = {}): string {
  let langDirective = "";
  if (options.language === "hi") {
    langDirective = " Language directive: HINDI (हिन्दी). Respond entirely in natural, fluent Hindi using Devanagari script for conversation, explanation, and follow-up suggestions. On the whiteboard, write titles and explanations in Hindi (Devanagari), while keeping standard mathematical notation and variables (e.g. x, y, a² + b² = c²).";
  } else if (options.language === "hinglish") {
    langDirective = " Language directive: HINGLISH (हिंग्लिश / Roman Hindi). Respond in friendly conversational Hinglish (Hindi written in English alphabet, e.g. 'Right angle triangle mein hypotenuse sabse lambi side hoti hai'). On the whiteboard, keep diagram labels in clear English/Hinglish math terminology (e.g. 'Base = 6', 'Hypotenuse = 10', 'Dono ko square karke add karo'). Suggestions should be in conversational Hinglish.";
  } else {
    langDirective = " If the learner asks in Hindi (Devanagari) or Hinglish, adapt naturally and reply in that language style.";
  }
  let doubtDirective = "";
  if (options.lectureContext) {
    const { topic, chapter, chapterTitle, timestamp, caption } = options.lectureContext;
    doubtDirective = ` [DOUBT-SOLVING MODE]: The student raised their hand during chapter ${chapter} (${chapterTitle || "Discussion"}) of the lecture on "${topic}" at timestamp ${Math.round(timestamp)}s. The teacher was explaining: "${caption || ""}". Answer their doubt directly using voice and whiteboard illustrations, then invite them to resume the lecture once understood.`;
  }
  return `${systemPrompt}${options.lecture ? ` ${narrationGuidance}` : ""}${langDirective}${doubtDirective}`;
}
const narrationGuidance = "For a two-minute lecture, write exactly three purposeful scenes of 85–105 spoken words each: introduce the concept and define the key terms; solve one concrete worked example and explain why each step is valid; finish with a fresh practice question, a short thinking pause, then the worked answer and takeaway. Use a short descriptive title for every scene. Aim for 270–315 words total and suggest 40 seconds per scene; the app will assign the final timing. Draw the calculation, labels, or diagram in the same order you describe them. Avoid filler. For this lecture populate scenes; top-level elements can be empty.";
const elementProperties = {
  type: { type: "STRING", enum: ["text", "path", "rect", "ellipse", "image"] }, x: { type: "NUMBER" }, y: { type: "NUMBER" }, w: { type: "NUMBER" }, h: { type: "NUMBER" }, d: { type: "STRING" }, text: { type: "STRING" }, src: { type: "STRING" }, alt: { type: "STRING" }, color: { type: "STRING" }, fill: { type: "STRING" }, size: { type: "NUMBER" }, weight: { type: "NUMBER" }, strokeWidth: { type: "NUMBER" }, rotate: { type: "NUMBER" }, dashed: { type: "BOOLEAN" },
};
const openaiElementProperties = Object.fromEntries(Object.entries(elementProperties).map(([field, spec]) => [field, { ...spec, type: spec.type.toLowerCase() }]));
const annotationProperties = {
  region: { type: "STRING", description: "Exact region id from the board context, for example nucleus, battery, resistor, normal-force." },
  style: { type: "STRING", enum: ["highlight", "underline", "circle", "box", "arrow", "label", "wire"] },
  label: { type: "STRING", description: "Text to write next to the region when style is label or arrow." },
};
const openaiAnnotationProperties = Object.fromEntries(Object.entries(annotationProperties).map(([field, spec]) => [field, { ...spec, type: spec.type.toLowerCase() }]));
const annotationToolDescription = "Mark existing parts of the diagram on the board. Use the region ids listed in the board context; do not compute coordinates.";
const toolDescription = "Write the tutor's reply and draw an ordered sequence of safe vector marker strokes on the lesson board.";

function openaiTool() {
  return { type: "function", function: { name: "draw_on_whiteboard", description: toolDescription, parameters: {
    type: "object", additionalProperties: false, properties: {
      title: { type: "string" }, subject: { type: "string" }, explanation: { type: "string" }, suggestions: { type: "array", items: { type: "string" } },
      annotations: { type: "array", description: annotationToolDescription, items: { type: "object", properties: openaiAnnotationProperties, required: ["region", "style"], additionalProperties: false } },
      elements: { type: "array", items: { type: "object", properties: openaiElementProperties, required: ["type"], additionalProperties: false } },
      scenes: { type: "array", items: { type: "object", properties: { title: { type: "string" }, narration: { type: "string" }, seconds: { type: "number" }, elements: { type: "array", items: { type: "object", properties: openaiElementProperties, required: ["type"], additionalProperties: false } } }, required: ["title", "narration", "seconds", "elements"], additionalProperties: false } },
    }, required: ["title", "subject", "explanation", "suggestions", "elements"],
  } } };
}
function geminiTool() {
  return { functionDeclarations: [{ name: "draw_on_whiteboard", description: toolDescription, parameters: {
    type: "OBJECT", properties: {
      title: { type: "STRING" }, subject: { type: "STRING" }, explanation: { type: "STRING" }, suggestions: { type: "ARRAY", items: { type: "STRING" } },
      annotations: { type: "ARRAY", description: annotationToolDescription, items: { type: "OBJECT", properties: annotationProperties, required: ["region", "style"] } },
      elements: { type: "ARRAY", items: { type: "OBJECT", properties: elementProperties, required: ["type"] } },
      scenes: { type: "ARRAY", items: { type: "OBJECT", properties: { title: { type: "STRING" }, narration: { type: "STRING" }, seconds: { type: "NUMBER" }, elements: { type: "ARRAY", items: { type: "OBJECT", properties: elementProperties, required: ["type"] } } }, required: ["title", "narration", "seconds", "elements"] } },
    }, required: ["title", "subject", "explanation", "suggestions", "elements"],
  } }] };
}

type RawDrawing = Record<string, unknown>;
function decodeScenes(raw: RawDrawing): { pages: BoardPage[]; totalSeconds: number } | null {
  if (!Array.isArray(raw.scenes) || raw.scenes.length < 3) return null;
  const pages: BoardPage[] = [];
  for (const value of raw.scenes.slice(0, 3)) {
    if (!value || typeof value !== "object") continue;
    const item = value as Record<string, unknown>;
    const suggestedSeconds = Math.round(finite(item.seconds, 40, 15, 45));
    const narration = typeof item.narration === "string" ? item.narration.trim().slice(0, 2400) : "";
    const title = typeof item.title === "string" ? item.title.trim().slice(0, 72) : `Scene ${pages.length + 1}`;
    const marks = Array.isArray(item.elements) ? item.elements.slice(0, 80).map(sanitizeMark).filter((m): m is BoardMark => m !== null) : [];
    if (!narration || !marks.length || suggestedSeconds < 15 || suggestedSeconds > 45) continue;
    const last = [...marks].reverse().find(m => typeof m.x === "number" && m.type !== "path");
    pages.push({ id: crypto.randomUUID(), title, marks, narration, seconds: suggestedSeconds, ink: [], cursor: { x: Math.min(920, (last?.x || 760) + 40), y: Math.min(275, (last?.y || 220) + 7) } });
  }
  if (pages.length !== 3) return null;
  const wordCounts = pages.map(page => (page.narration || "").trim().split(/\s+/).filter(Boolean).length);
  const totalWords = wordCounts.reduce((sum, count) => sum + count, 0);
  if (totalWords < 225 || totalWords > 345 || wordCounts.some(words => words < 55)) return null;
  let assigned = 0;
  for (const [i, page] of pages.entries()) {
    const remaining = MAX_LECTURE_SECONDS - assigned, afterThis = pages.length - i - 1;
    const proposed = Math.round(wordCounts[i] / totalWords * MAX_LECTURE_SECONDS);
    const seconds = Math.max(remaining - afterThis * 50, Math.min(remaining - afterThis * 30, Math.min(50, Math.max(30, proposed))));
    if (wordCounts[i] * 60 / seconds > 190) return null;
    page.seconds = seconds;
    assigned += seconds;
  }
  if (assigned !== MAX_LECTURE_SECONDS || pages.some(page => !page.seconds)) return null;
  return { pages, totalSeconds: assigned };
}

function decodeDrawing(raw: RawDrawing, session: SessionData | null, options: TurnOptions = {}): TutorTurn {
  const hasSession = Boolean(session);
  const scenes = options.lecture ? decodeScenes(raw) : null;
  if (scenes) {
    const title = typeof raw.title === "string" ? raw.title.slice(0, 72) : "A two-minute lecture";
    return {
      title, subject: typeof raw.subject === "string" ? raw.subject.slice(0, 32) : "Learning",
      explanation: typeof raw.explanation === "string" && raw.explanation.trim() ? raw.explanation.slice(0, 6500) : `Here is a ${Math.round(scenes.totalSeconds / 60)} minute lecture on ${title}. Press play and follow along; you can pause at any time to sketch.`,
      page: null, pages: scenes.pages,
      lecture: { title, totalSeconds: scenes.totalSeconds, startIndex: 0, sceneCount: scenes.pages.length },
      suggestions: Array.isArray(raw.suggestions) ? raw.suggestions.filter((s): s is string => typeof s === "string").slice(0, 3).map(s => s.slice(0, 45)) : ["Quiz me", "Explain it simply"],
      quiz: null, mode: "llm",
    };
  }
  if (options.lecture) throw new TutorError("The tutor did not return a complete two-minute lesson. Try a narrower topic or a built-in class.", 502);
  if (!raw || typeof raw.explanation !== "string" || !raw.explanation.trim()) throw new TutorError("The tutor’s response was incomplete. Please try again.", 502);
  const current = session ? session.pages[session.pageIndex] || session.pages[0] || null : null;
  const annotations = resolveAnnotations(current, raw.annotations);
  if (current && annotations.length) {
    return {
      title: typeof raw.title === "string" && raw.title.trim() ? raw.title.slice(0, 72) : current.title,
      subject: session?.subject || "Learning",
      explanation: raw.explanation.slice(0, 6500),
      page: withAnnotations(current, annotations),
      suggestions: Array.isArray(raw.suggestions) ? raw.suggestions.filter((s): s is string => typeof s === "string").slice(0, 3).map(s => s.slice(0, 45)) : ["Show me an example", "Quiz me"],
      quiz: null, mode: "llm",
    };
  }
  const marks = Array.isArray(raw.elements) ? raw.elements.slice(0, 80).map(sanitizeMark).filter((m): m is BoardMark => m !== null) : [];
  if (!hasSession && !marks.length) throw new TutorError("The tutor didn’t produce a usable board. Please try another topic.", 502);
  const last = [...marks].reverse().find(m => typeof m.x === "number" && m.type !== "path");
  const title = typeof raw.title === "string" ? raw.title.slice(0, 72) : "A new idea";
  return {
    title, subject: typeof raw.subject === "string" ? raw.subject.slice(0, 32) : "Learning",
    explanation: raw.explanation.slice(0, 6500),
    page: marks.length ? { id: crypto.randomUUID(), title, marks, ink: [], cursor: { x: Math.min(920, (last?.x || 760) + 40), y: Math.min(275, (last?.y || 220) + 7) } } : null,
    suggestions: Array.isArray(raw.suggestions) ? raw.suggestions.filter((s): s is string => typeof s === "string").slice(0, 3).map(s => s.slice(0, 45)) : ["Show me an example", "Quiz me"],
    quiz: null, mode: "llm",
  };
}

async function openaiTurn(prompt: string, session: SessionData | null, config: Config, options: TurnOptions): Promise<TutorTurn> {
  const response = await fetch(`${config.base}/chat/completions`, {
    method: "POST", headers: { Authorization: `Bearer ${config.key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: config.model, messages: [
      { role: "system", content: buildSystemPrompt(options) },
      ...(session ? [{ role: "system", content: boardSummary(session) }, ...session.messages.slice(-12)] : []),
      { role: "user", content: options.lecture ? `${prompt}\n\nBuild this as a 2-minute narrated lecture using the scenes array.` : prompt },
    ], tools: [openaiTool()], tool_choice: { type: "function", function: { name: "draw_on_whiteboard" } }, parallel_tool_calls: false, max_completion_tokens: 4500 }),
    signal: AbortSignal.timeout(65000), cache: "no-store",
  });
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) throw new TutorError("OpenAI didn’t accept this key. Check the tutor connection in Settings.", 502);
    if (response.status === 429) throw new TutorError("The OpenAI usage limit was reached. Check the account quota or try again shortly.", 502);
    throw new TutorError("OpenAI is unavailable right now. Your board is saved; please try again.", 502);
  }
  const result = await response.json();
  const call = result.choices?.[0]?.message?.tool_calls?.find((c: { function?: { name?: string } }) => c.function?.name === "draw_on_whiteboard");
  if (!call) throw new TutorError("The tutor could not prepare a drawing. Please try rephrasing your question.", 502);
  let raw: RawDrawing;
  try { raw = JSON.parse(call.function.arguments); } catch { throw new TutorError("The tutor’s drawing was incomplete. Try a smaller question.", 502); }
  return decodeDrawing(raw, session, options);
}

function geminiContents(messages: ChatMessage[], prompt: string) {
  const contents: { role: "user" | "model"; parts: { text: string }[] }[] = messages.slice(-12).map(m => ({ role: m.role === "assistant" ? "model" as const : "user" as const, parts: [{ text: m.content }] }));
  contents.push({ role: "user", parts: [{ text: prompt }] });
  const merged: typeof contents = [];
  for (const item of contents) {
    const last = merged[merged.length - 1];
    if (last?.role === item.role) last.parts.push(...item.parts); else merged.push(item);
  }
  if (merged[0]?.role === "model") merged.unshift({ role: "user", parts: [{ text: "Begin the lesson." }] });
  return merged;
}

/** Spatial inventory of the current board page, used as model context by both providers. */
function boardSummary(session: SessionData): string {
  const page = session.pages[session.pageIndex] || session.pages[0];
  if (!page) return `Current lesson: ${session.title} (no board page yet).`;
  return `Current lesson: ${session.title}.\n${describePage(page)}`;
}
export function geminiError(status: number, payload: unknown): TutorError {
  const body = payload as { error?: { status?: string; message?: string; code?: number } } | null;
  const reason = body?.error?.status || "";
  const message = body?.error?.message || "";
  if (status === 402 || /prepayment credits are depleted/i.test(message) || reason === "RESOURCE_EXHAUSTED" && /billing|credit/i.test(message)) {
    return new TutorError("Your Gemini key is valid, but this Google AI Studio project has no prepayment credits. Add billing credits at ai.studio/projects, then try again.", 402);
  }
  if (status === 400 && /API key not valid|API_KEY_INVALID/i.test(message)) return new TutorError("Gemini didn’t accept this API key. Check the key in Settings → Tutor connection.", 401);
  if (status === 403) return new TutorError("This API key is blocked for the Gemini API. In Google Cloud, enable the Generative Language API for the key or create a new key in AI Studio.", 403);
  if (status === 429) return new TutorError("Gemini’s rate limit was reached. Wait a moment before asking again.", 429);
  if (status === 404) return new TutorError("That Gemini model isn’t available for this key. Set GEMINI_MODEL to a model your project can access.", 502);
  if (status === 401) return new TutorError("Gemini authentication failed. Recheck the API key in Settings → Tutor connection.", 401);
  return new TutorError("Gemini couldn’t finish that drawing. Your board is saved; please try again.", 502);
}

async function geminiTurn(prompt: string, session: SessionData | null, config: Config, options: TurnOptions): Promise<TutorTurn> {
  const boardContext = session ? `\n\n${boardSummary(session)}` : "";
  const requestBody = JSON.stringify({
    systemInstruction: { parts: [{ text: buildSystemPrompt(options) + boardContext }] },
    contents: geminiContents(session?.messages || [], options.lecture ? `${prompt}\n\nBuild this as a 2-minute narrated lecture using the scenes array.` : prompt),
    tools: [geminiTool()],
    toolConfig: { functionCallingConfig: { mode: "ANY", allowedFunctionNames: ["draw_on_whiteboard"] } },
    generationConfig: { temperature: 0.75, maxOutputTokens: 4096, ...(/2\.5/.test(config.model) && !/pro/.test(config.model) ? { thinkingConfig: { thinkingBudget: 0 } } : {}) },
  });
  let response = await fetch(`${config.base}/models/${encodeURIComponent(config.model)}:generateContent`, {
    method: "POST", headers: { "x-goog-api-key": config.key, "Content-Type": "application/json" }, cache: "no-store", signal: AbortSignal.timeout(65000),
    body: requestBody,
  });
  if (!response.ok && (response.status === 403 || response.status === 404)) {
    const project = process.env.GOOGLE_CLOUD_PROJECT || "213338702409";
    const location = process.env.GOOGLE_CLOUD_REGION || "us-central1";
    const vertexUrl = `https://${location}-aiplatform.googleapis.com/v1/projects/${project}/locations/${location}/publishers/google/models/${encodeURIComponent(config.model)}:generateContent?key=${encodeURIComponent(config.key)}`;
    const vertexRes = await fetch(vertexUrl, {
      method: "POST", headers: { "Content-Type": "application/json" }, cache: "no-store", signal: AbortSignal.timeout(65000),
      body: requestBody,
    }).catch(() => null);
    if (vertexRes && vertexRes.ok) {
      response = vertexRes;
    }
  }
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw geminiError(response.status, payload);
  const parts = payload?.candidates?.[0]?.content?.parts || [];
  if (payload?.promptFeedback?.blockReason) throw new TutorError("Gemini declined that topic. Try asking about a safe, educational concept instead.", 422);
  const call = parts.find((part: { functionCall?: { name?: string } }) => part.functionCall?.name === "draw_on_whiteboard");
  if (!call?.functionCall?.args) throw new TutorError("Gemini didn’t return a drawing. Try asking in a slightly different way.", 502);
  return decodeDrawing(call.functionCall.args as RawDrawing, session, options);
}

export async function modelTurn(prompt: string, session: SessionData | null, tab: TabKeys = {}, options: TurnOptions = {}): Promise<TutorTurn> {
  const config = providerConfig(tab);
  if (!config.key) throw new TutorError("Connect your Gemini API key in Settings to explore a custom topic.", 422);
  return config.provider === "gemini" ? geminiTurn(prompt, session, config, options) : openaiTurn(prompt, session, config, options);
}

export async function validateProviderKey(provider: Provider, key: string) {
  if (provider === "gemini") {
    const model = process.env.GEMINI_MODEL || "gemini-3.8-live";
    const url = `${GEMINI_BASE}/models/${encodeURIComponent(model)}:generateContent`;
    const response = await fetch(url, { method: "POST", headers: { "x-goog-api-key": key, "Content-Type": "application/json" }, cache: "no-store", signal: AbortSignal.timeout(20000),
      body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: "Reply with the single word: ready" }] }], generationConfig: { maxOutputTokens: 4, temperature: 0 } }) });
    if (response.ok) return { model };
    const errPayload = await response.json().catch(() => null);
    if (response.status === 403 || response.status === 404) {
      const project = process.env.GOOGLE_CLOUD_PROJECT || "213338702409";
      const location = process.env.GOOGLE_CLOUD_REGION || "us-central1";
      const vertexUrl = `https://${location}-aiplatform.googleapis.com/v1/projects/${project}/locations/${location}/publishers/google/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`;
      const vertexRes = await fetch(vertexUrl, {
        method: "POST", headers: { "Content-Type": "application/json" }, cache: "no-store", signal: AbortSignal.timeout(10000),
        body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: "ready" }] }] }),
      }).catch(() => null);
      if (vertexRes) {
        const vertexPayload = await vertexRes.json().catch(() => null);
        if (vertexRes.ok) return { model: `${model} (Agent Platform)` };
        // A Live-only model can authenticate here but never serve a chat turn, so it is not a
        // working connection. Reporting it as connected makes every later turn fail instead.
        if (vertexRes.status === 400 && /not supported in the generateContent API/i.test(vertexPayload?.error?.message || "")) {
          throw new TutorError(`“${model}” is a Live API model, so it cannot answer whiteboard turns. Set GEMINI_MODEL to a chat model such as gemini-2.5-flash.`, 400);
        }
      }
    }
    throw geminiError(response.status, errPayload);
  }
  const base = (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
  const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";
  const response = await fetch(`${base}/models/${encodeURIComponent(model)}`, { headers: { Authorization: `Bearer ${key}` }, cache: "no-store", signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new TutorError(response.status === 401 ? "OpenAI didn’t accept this API key. Double-check it and try again." : `This OpenAI key cannot access ${model}. Check its permissions and billing.`, 400);
  return { model };
}
