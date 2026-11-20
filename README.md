# Chalkly — AI Learning Studio

A Next.js App Router application featuring an interactive vector whiteboard, an AI tutor with forced whiteboard function calling, a Google Meet-style studio interface, and private PostgreSQL-backed learning sessions.

---

## Architecture Overview

Chalkly blends real-time 60 FPS vector canvas rendering with multimodal AI models (Gemini 2.5 Flash / Pro) and a familiar Google Meet classroom layout.

For an in-depth breakdown with data models and Mermaid diagrams, see [docs/CLASS_AND_TUTOR_ARCHITECTURE.md](docs/CLASS_AND_TUTOR_ARCHITECTURE.md).

```
+-----------------------------------------------------------------------------------+
| Topbar: Navigation / Breadcrumbs / Session Save Status / Gemini Status Strip      |
+-----------------------------------------------------------------------------------+
|                                                                                   |
|  INTERACTIVE WHITEBOARD CANVAS (Full Height)                                      |
|                                                                                   |
|  [Tutor Participant Tile]                                                         |
|  - Animated TeacherCam (CSS-only 60 FPS compositor motion)                         |
|  - Active Speaker Green Outline (#34a853) & Sound-wave Equalizer                  |
|  - "AI Tutor" Tag                                                                 |
|  - Toggle visibility ON/OFF via Camera button                                      |
|                                                                                   |
|  [Drawing Toolbar: Pen, Eraser, Rect, Ellipse, Text, Image Assets, Colors]         |
|                                                                                   |
+-----------------------------------------------------------------------------------+
| Live Captions Overlay (Centered Subtitles: Student & Tutor speech)               |
+-----------------------------------------------------------------------------------+
| GOOGLE MEET BOTTOM CONTROL BAR (#202124)                                          |
| [12:00 PM | Lesson Title]  [Mic] [Cam] [CC] [Hand] [Present] [Leave]  [Info] [Chat]  |
+-----------------------------------------------------------------------------------+
                                                                   |
                                          (Toggles from right) --> | [In-Call Messages]
                                                                   | - Call Disclaimer
                                                                   | - Message History
                                                                   | - Thinking Dots
                                                                   | - Question Chips
                                                                   | - Chat Composer
```

---

## 1. How Classes Are Made

Classes in Chalkly are organized into two pipelines:

### A. Pre-recorded Visual Masterclasses
- **Curriculum Lessons**: *The Human Heart*, *The Human Cell*, *Pythagorean Theorem*, *Understanding Fractions*, *Water Cycle*, and *Linear Equations*.
- **Diagram Asset Catalog (`src/lib/assets.ts`)**: High-resolution anatomical and scientific SVG diagrams equipped with mapped coordinate regions (e.g., Superior Vena Cava, Right Atrium, Aorta).
- **2-Minute 4-Chapter Structure (`src/lib/recorded-classes.ts`)**:
  1. **Chapter 1 (0:00–0:28)**: Core concept and diagram setup.
  2. **Chapter 2 (0:28–1:02)**: Step-by-step vector demonstration.
  3. **Chapter 3 (1:02–1:36)**: Practice problem with an interactive *"Your Turn"* thinking pause.
  4. **Chapter 4 (1:36–2:00)**: Worked answer reveal and summary.
- **Narration Audio**: Built locally with [Piper TTS](https://github.com/OHF-Voice/piper1-gpl) using the LJ Speech medium voice. Spoken cues in `src/lib/class-scripts.json` compile into audio synced with exact millisecond timestamps.

### B. Dynamic AI-Generated Classes
- When exploring custom topics or asking spontaneous questions, the AI tutor uses Gemini to create new multi-page lessons dynamically on the fly.

---

## 2. How Classes Work

- **Sub-Millisecond Timeline Synchronization (`src/components/useClassPlayback.ts`)**:
  - An HTML5 audio clock monitored via `requestAnimationFrame` keeps captions, marks, and pen movement aligned.
  - If audio is muted or fails to load, a resilient fallback clock ensures board animations and captions continue without interruption.
- **60 FPS Vector Stroke Interpolation (`Whiteboard.tsx`)**:
  - Marks are rendered as native SVG (`<path>`, `<rect>`, `<ellipse>`, `<text>`, `<image>`).
  - The teacher's marker cursor glides using GPU-accelerated CSS `transform: translate3d` without triggering DOM layout recalculations.
- **Independent Ink Layering**:
  - The tutor's demonstration lives on a managed tutor layer.
  - The student can draw, annotate, solve practice challenges, and erase on their own student layer (`page.ink`) without overwriting the lesson's demonstration.

---

## 3. How the AI Tutor Interacts

- **Forced Tool Calling (`draw_on_whiteboard`)**:
  - Calls to `/api/tutor` force Gemini to invoke `draw_on_whiteboard` (`toolConfig.functionCallingConfig.mode = "ANY"`).
  - The model responds with explanation narration, structured vector marks (coordinates, sizes, colors, paths), and follow-up question chips.
- **Multilingual Support**:
  - Configurable in **Settings**:
    - **English (`en`)**: Academic English.
    - **Hinglish (`hinglish`)**: Conversational Indian teaching style in Roman script (*"Is diagram mein blood Vena Cava se enter hota hai"*).
    - **Hindi (`hi`)**: Devanagari script for both voice explanation and whiteboard text annotations.
- **Voice Recognition & Read Aloud**:
  - Speech-to-text via browser Web Speech Recognition.
  - Spoken answers via browser Speech Synthesis or audio generation with real-time animated speech equalizers.

---

## 4. Google Meet Studio Environment

Chalkly provides an authentic Google Meet classroom experience:
- **Bottom Control Bar (`src/components/GoogleMeetBar.tsx`)**:
  - **Left**: Live digital clock, green active status dot, and session title.
  - **Microphone (`Ctrl + d`)**: Toggle live speech recognition.
  - **Camera (`Ctrl + e`)**: Toggle the teacher's avatar between **visible** and **hidden**.
  - **Captions (`c`)**: Toggle real-time closed captions.
  - **Raise Hand**: Send a question signal to the tutor.
  - **Present Whiteboard**: Screen share status indicator.
  - **Leave Call (Red Pill Button)**: Opens the "You left the meeting" modal with Rejoin or Return to Workspace actions.
  - **Right Controls**: Meeting details, participant count ("2"), and sliding chat drawer toggle with unread indicator.
- **Tutor Participant Tile (`src/components/TeacherCam.tsx`)**:
  - Dark participant card with active speaker green outline (`#34a853`).
  - Animated sound-wave equalizer when the tutor speaks.
- **Sliding In-Call Messages (`src/components/SlidingChatPanel.tsx`)**:
  - Slides out from the right with call disclaimer notice, full chat history, live thinking status, and question composer.
- **Live Captions Overlay (`src/components/LiveCaptionsOverlay.tsx`)**:
  - Centered floating subtitle banner above the control bar.

---

## Local Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```
2. **Configure PostgreSQL**:
   Set `DATABASE_URL` in `.env` (refer to `.env.example`).
3. **Push database schema**:
   ```bash
   npx drizzle-kit push
   ```
4. **Run the development server**:
   ```bash
   npm run dev
   ```

---

## Validation & Testing

```bash
# Typecheck
npm run typecheck

# Unit and model contract tests
npx playwright test tests/assets.spec.ts tests/model-tool.spec.ts

# End-to-end studio browser tests (requires running dev server on port 3001 or 3000)
PLAYWRIGHT_BASE_URL=http://127.0.0.1:3001 npx playwright test tests/studio.spec.ts
```

All 24 automated tests verify:
- Vector stroke persistence, undo/redo, shapes, text, erasing, and bookmarking.
- Audio clock playback, cue synchronization, chapter navigation, and offline caption fallbacks.
- Google Meet control bar, sliding chat drawer, live captions overlay, and camera show/hide toggling.
- Gemini forced tool call schema contracts, multilingual Hinglish/Hindi prompt generation, and diagram asset region mapping.
