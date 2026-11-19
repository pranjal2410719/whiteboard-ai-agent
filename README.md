# Chalkly — AI learning studio

A Next.js App Router application with a live vector whiteboard, a model-controlled marker, and private PostgreSQL-backed learning sessions.

## Prerecorded whiteboard classes

Click **Watch class** next to **Replay** on the whiteboard. **Replay** still redraws only the current board. The Pythagorean theorem, fractions, water cycle, and linear equations each have a prerecorded **2:00** class with four chapters: core concept, worked example, practice with a thinking pause and solution, and recap.

Each class has its own 320+ word voiceover and cue-by-cue drawings. Browser playback uses the bundled audio clock to keep captions and board marks aligned, even when muted or seeking to a different chapter. If audio is unavailable, the visual class and captions still play. The **Transcript** includes all narration and timestamps. **Study notes** go beyond the runtime with detailed explanations, equations, a common mistake, and a separate exercise with its worked answer.

The four classes do not use the AI API at any point. Pausing unlocks the marker, and chapter annotations are stored separately in the existing private session data. Playing, seeking or reopening a class does not add pages, erase a board, or change chat history. Existing saved lectures and their pages are preserved. Custom topics still support model-generated lectures when a provider is connected.

### Narration assets

The bundled recordings are synthetic narration of the original class scripts, built locally with [Piper](https://github.com/OHF-Voice/piper1-gpl) using the [LJ Speech medium voice](https://huggingface.co/rhasspy/piper-voices/tree/main/en/en_US/ljspeech/medium), trained on the [public-domain LJ Speech dataset](https://keithito.com/LJ-Speech-Dataset/). The app only serves the four compressed MP3s, not the model or the synthesis engine. When revising the spoken cues in `src/lib/class-scripts.json`, rebuild the assets with `scripts/build-class-audio.py` (Python with `piper-tts` and `imageio-ffmpeg`). The versioned names match `RECORDED_CLASS_EDITION` in `src/lib/recorded-classes.ts`.

## Tutor portrait and drawing performance

The whiteboard shows a small circular, animated tutor portrait in its lower-left corner. It is a pure CSS/SVG character: the blink, breathing, nod, speaking mouth, and voice bars all animate on the compositor, and the portrait is memoized so it only re-renders when its spoken/paused state changes. `prefers-reduced-motion` disables the portrait animation.

The marker does not depend on a second animation loop. During a recorded class, cue progress comes from the audio clock; the marker's SVG position is written directly through a ref, without an extra React render. Completed strokes are memoized, so each clock tick only repaints the stroke currently being drawn. No telemetry or network requests are made by the portrait, and the recorded class never calls the language model.

## Using the studio

- Start with the illustrated Pythagorean theorem, fractions, water cycle, or linear equations lesson.
- Ask for an example, a simpler explanation, or a quiz. Each teaching step is preserved as a new board page.
- Click **Replay** to see the tutor’s marker follow the strokes and handwriting. **Finish** reveals the completed diagram immediately.
- Add your own pen strokes, rectangles, ellipses, and text. Undo, redo, erase, zoom, pan, and expand the board.
- Bookmark boards for the library, reopen recent sessions, and review the complete conversation in **Chat history**.
- Settings include a display name, paper pattern, optional browser narration, and the tutor connection.

## Language model connection

**Gemini is the primary tutor model.** Set `GEMINI_API_KEY` on the server. `GEMINI_MODEL` defaults to `gemini-2.5-flash`. Any Gemini key placed only in `.env` stays server-side. Restart the deployment after changing environment variables.

The tutor sends a forced `draw_on_whiteboard` function call through Gemini's `generateContent` API with `toolConfig.functionCallingConfig.mode = "ANY"`, so the model must reply with a structured lesson and a sequence of drawing commands. Conversation history is mapped to Gemini `user`/`model` turns, and the current board (including your ink) is included as context.

Open **Settings → Tutor connection**, or the **Gemini API** button in the top-right toolbar, to:
- see which provider and model is active;
- automatically verify that the key can generate a reply (this catches billing and permission problems);
- connect a different Gemini key for the current tab only;
- switch to an OpenAI fallback, which uses Chat Completions function calling.

If the key authenticates but its AI Studio project lacks prepayment credits, the studio says so and keeps guided lessons working instead of failing silently. Custom topics require a working model; the four built-in guided lessons never do.

Keys entered in Settings are held only in React memory for that tab, validated on the server, and never written to PostgreSQL, cookies, or local storage. API usage is billed by the provider. Google Cloud keys restricted to Vertex AI may be blocked for the Generative Language API; this app uses AI Studio Gemini API keys. Never commit a real key if you later publish this repository—rotate it in AI Studio and set it through the deployment's secret manager.

The tutor endpoint sends the current board, the learner’s annotations, and recent conversation to the model. It requires a `draw_on_whiteboard` tool call. The model supplies the explanation and ordered text, path, rectangle, and ellipse commands. The server validates the command set, sizes, colors, and coordinates before saving or rendering it. No model-generated scripts or raw HTML are executed.

## Local setup

1. Install dependencies with `npm install`.
2. Configure PostgreSQL through `DATABASE_URL` in `.env`. See `.env.example` for optional settings.
3. Run `npx drizzle-kit push` against the configured local database.
4. Run `npm run dev`, or use the platform-managed production preview.

Each browser workspace is identified by a high-entropy HttpOnly same-site cookie. All session queries are scoped by that workspace ID. This is a private single-browser workspace, not a multi-user authentication system. Use HTTPS and `COOKIE_SECURE=true` in production. Add account authentication and provider quotas before exposing a shared paid model to the public.

## Validation

- `npx next typegen`
- `npm exec tsc -- --noEmit --pretty false`
- `npm run build`
- `npx playwright install --with-deps chromium`
- `npx playwright test` with a running preview on port 3000, or set `PLAYWRIGHT_BASE_URL`.

Browser tests cover annotations, persistence, history, quizzes, bookmarks, session creation, deletion, preferences, lecture generation and playback, and mobile navigation. Deterministic provider-contract tests verify the Gemini forced-tool request, user/model history mapping, the OpenAI fallback, billing/blocked-key diagnostics, and drawing-command sanitisation without making paid inference calls.
