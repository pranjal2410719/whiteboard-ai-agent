import { expect, test } from "@playwright/test";
import { buildSystemPrompt, geminiError, modelTurn, sanitizeMark, TutorError } from "../src/lib/tutor";
import { catalog, guidedLecture } from "../src/lib/lessons";
import { drawingAtCue } from "../src/lib/recorded-classes";

const drawArgs = {
  title: "Circle geometry", subject: "Mathematics", explanation: "A radius runs from the center to the edge.",
  suggestions: ["Show me a diameter"],
  elements: [{ type: "ellipse", x: 700, y: 170, w: 90, h: 90, color: "#447655", fill: "#e8f3df" }, { type: "text", x: 60, y: 65, text: "The radius", size: 40 }],
};

// Provider-contract tests use mocked HTTP, never paid inference.
test("every built-in class has detailed instruction, a cue-aligned practice pause, and exactly two minutes", () => {
  for (const { key } of catalog) {
    const demo = guidedLecture(key);
    expect(demo.totalSeconds).toBe(120);
    expect(demo.scenes).toHaveLength(4);
    expect(demo.scenes.map(scene => scene.seconds)).toEqual([28, 34, 34, 24]);
    const words = demo.scenes.reduce((sum, scene) => sum + (scene.narration?.trim().split(/\s+/).filter(Boolean).length || 0), 0);
    expect(words, key).toBeGreaterThan(310);
    expect(demo.notes.notes).toHaveLength(3); expect(demo.notes.practice.answer.length).toBeGreaterThan(60);
    for (const scene of demo.scenes) {
      let time = 0, mark = 0;
      for (const cue of scene.cues!) {
        expect(cue.from).toBe(time); expect(cue.firstMark).toBe(mark);
        expect(cue.to).toBeGreaterThan(cue.from);
        time = cue.to; mark = cue.endMark;
      }
      expect(time).toBe(scene.seconds); expect(mark).toBe(scene.marks.length);
    }
    const practice = demo.scenes[2];
    const hold = drawingAtCue(practice.cues!, 10), solution = drawingAtCue(practice.cues!, 18);
    expect(hold.holding).toBe(true); expect(solution.markProgress).toBeGreaterThan(hold.markProgress);
    expect(drawingAtCue(practice.cues!, 34).markProgress).toBe(practice.marks.length);
  }
});

test("Gemini receives the forced whiteboard tool and its call becomes a board", async () => {
  delete process.env.GEMINI_API_KEY; delete process.env.GOOGLE_API_KEY;
  const originalFetch = globalThis.fetch;
  let url = "", headers: Record<string, string> = {}, payload: Record<string, unknown> = {};
  globalThis.fetch = async (input, init) => {
    url = String(input); headers = init?.headers as Record<string, string>; payload = JSON.parse(String(init?.body));
    return Response.json({ candidates: [{ content: { role: "model", parts: [{ functionCall: { name: "draw_on_whiteboard", args: drawArgs } }] } }] });
  };
  try {
    const reply = await modelTurn("Explain a circle’s radius", null, { gemini: "gemini-contract-test" });
    expect(url).toContain("generativelanguage.googleapis.com");
    expect(url).toContain(":generateContent");
    expect(JSON.stringify((payload.tools as unknown[])[0])).toContain('"scenes"');
    expect(headers["x-goog-api-key"]).toBe("gemini-contract-test");
    const toolConfig = payload.toolConfig as { functionCallingConfig: { mode: string; allowedFunctionNames: string[] } };
    expect(toolConfig.functionCallingConfig.mode).toBe("ANY");
    expect(toolConfig.functionCallingConfig.allowedFunctionNames).toEqual(["draw_on_whiteboard"]);
    const tools = payload.tools as { functionDeclarations: { name: string; parameters: { properties: { elements: { type: string } } } }[] }[];
    expect(tools[0].functionDeclarations[0].name).toBe("draw_on_whiteboard");
    expect(tools[0].functionDeclarations[0].parameters.properties.elements.type).toBe("ARRAY");
    expect(payload.systemInstruction).toMatchObject({ parts: [{ text: expect.stringContaining("Chalkly") }] });
    expect(reply.mode).toBe("llm"); expect(reply.page?.marks).toHaveLength(2);
    expect(reply.page?.marks[1].text).toBe("The radius"); expect(reply.explanation).toContain("center");
  } finally { globalThis.fetch = originalFetch; }
});

test("Gemini lecture scenes are validated, timed, and capped at two minutes", async () => {
  delete process.env.GEMINI_API_KEY; delete process.env.GOOGLE_API_KEY;
  const originalFetch = globalThis.fetch;
  const scenes = [1, 2, 3, 4].map(i => ({ title: `Scene ${i}`, narration: `Scene ${i}. ${Array.from({ length: 8 }, (_, n) => `Let us carefully explore this visual idea together in step ${n + 1}.`).join(" ")}`, seconds: 45, elements: drawArgs.elements }));
  globalThis.fetch = async () => Response.json({ candidates: [{ content: { parts: [{ functionCall: { name: "draw_on_whiteboard", args: { title: "A lecture", subject: "Maths", explanation: "Press play.", suggestions: ["Quiz me"], scenes } } }] } }] });
  try {
    const reply = await modelTurn("Teach me a lecture", null, { gemini: "test" }, { lecture: true });
    expect(reply.lecture?.sceneCount).toBe(3);
    expect(reply.lecture?.totalSeconds).toBe(120);
    expect(reply.pages).toHaveLength(3);
    expect(reply.pages?.[0].narration).toContain("Scene 1.");
    expect(reply.pages?.[0].seconds).toBe(40);
    expect(reply.page).toBeNull();
  } finally { globalThis.fetch = originalFetch; }
});

test("a collection of short captions is not accepted as a detailed lecture", async () => {
  const originalFetch = globalThis.fetch;
  const scenes = Array.from({ length: 3 }, () => ({ title: "Short scene", narration: "This is a single caption.", elements: drawArgs.elements }));
  globalThis.fetch = async () => Response.json({ candidates: [{ content: { parts: [{ functionCall: { name: "draw_on_whiteboard", args: { ...drawArgs, scenes } } }] } }] });
  try { await expect(modelTurn("Teach a lecture", null, { gemini: "fixture-key" }, { lecture: true })).rejects.toThrow(/complete two-minute lesson/); }
  finally { globalThis.fetch = originalFetch; }
});

test("Gemini conversation history maps to user/model turns", async () => {
  delete process.env.GEMINI_API_KEY;
  const originalFetch = globalThis.fetch; let payload: { contents: { role: string; parts: { text: string }[] }[] } = { contents: [] };
  globalThis.fetch = async (_input, init) => {
    payload = JSON.parse(String(init?.body));
    return Response.json({ candidates: [{ content: { parts: [{ functionCall: { name: "draw_on_whiteboard", args: drawArgs } }] } }] });
  };
  try {
    await modelTurn("What is the radius?", { title: "Circles", subject: "Maths", lessonKey: "custom", pages: [{ id: "p", title: "P", marks: [], ink: [], cursor: { x: 0, y: 0 } }], pageIndex: 0, messages: [{ role: "assistant", content: "Hello" }, { role: "user", content: "Hi" }], suggestions: [], saved: false, mode: "llm", quiz: null }, { gemini: "test" });
    expect(payload.contents.map(c => c.role)).toEqual(["user", "model", "user"]);
    expect(payload.contents.at(-1)?.parts.map(p => p.text)).toEqual(["Hi", "What is the radius?"]);
  } finally { globalThis.fetch = originalFetch; }
});

test("the OpenAI fallback is still available when Gemini is not configured", async () => {
  delete process.env.GEMINI_API_KEY; delete process.env.GOOGLE_API_KEY; delete process.env.OPENAI_API_KEY;
  const originalFetch = globalThis.fetch; let auth = "", payload: Record<string, unknown> = {};
  globalThis.fetch = async (_input, init) => {
    auth = (init?.headers as Record<string, string>).Authorization; payload = JSON.parse(String(init?.body));
    return Response.json({ choices: [{ message: { tool_calls: [{ function: { name: "draw_on_whiteboard", arguments: JSON.stringify(drawArgs) } }] } }] });
  };
  try {
    const reply = await modelTurn("Explain a radius", null, { openai: "openai-contract-test" });
    expect(auth).toBe("Bearer openai-contract-test");
    expect((payload.tool_choice as { function: { name: string } }).function.name).toBe("draw_on_whiteboard");
    expect(reply.page?.marks).toHaveLength(2);
  } finally { globalThis.fetch = originalFetch; }
});

test("Gemini billing, blocked-key, and quota failures have actionable messages", () => {
  expect(() => { throw geminiError(402, { error: { status: "RESOURCE_EXHAUSTED", message: "Your prepayment credits are depleted. Please go to AI Studio." } }); }).toThrow(/no prepayment credits/);
  expect(geminiError(403, { error: { status: "PERMISSION_DENIED", message: "API_KEY_SERVICE_BLOCKED" } }).message).toMatch(/blocked for the Gemini API/);
  expect(geminiError(429, {}).status).toBe(429);
  const quota = geminiError(429, {});
  expect(quota).toBeInstanceOf(TutorError);
  expect(quota.message).toMatch(/rate limit/i);
});

test("drawing output is bounded to supported vector elements", () => {
  expect(sanitizeMark({ type: "image", href: "external-resource" })).toBeNull();
  expect(sanitizeMark({ type: "path", d: "not a path" })).toBeNull();
  expect(sanitizeMark({ type: "text", text: "A note", size: 10000, x: Infinity, color: "url(external-resource)" })).toMatchObject({ type: "text", x: 0, size: 80, color: "#304d3a" });
});

test("multilingual prompt directives support Hindi and Hinglish", () => {
  const enPrompt = buildSystemPrompt({ language: "en" });
  expect(enPrompt).toContain("Chalkly");
  expect(enPrompt).toContain("Hindi (Devanagari) or Hinglish");

  const hiPrompt = buildSystemPrompt({ language: "hi" });
  expect(hiPrompt).toContain("HINDI (हिन्दी)");
  expect(hiPrompt).toContain("Devanagari");

  const hinglishPrompt = buildSystemPrompt({ language: "hinglish" });
  expect(hinglishPrompt).toContain("HINGLISH");
  expect(hinglishPrompt).toContain("Roman Hindi");
});
