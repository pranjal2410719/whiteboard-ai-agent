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
- **Curriculum Lessons**: *Human Heart & Blood Flow* (`heart-diagram`), *The Human Cell* (`human-cell`), *The Pythagorean Theorem* (`pythagoras`), and *Understanding Fractions* (`fractions`).
- **Interactive Canvas Intelligence Benchmark Diagrams (`src/lib/canvas-intelligence/`)**:
  - *Human Heart* (14 landmarks, vascular circulation circuits, chamber fills)
  - *The Human Cell* (10 organelles: Nucleus, Mitochondria, Ribosomes, ER, Golgi)
  - *Hydrologic Water Cycle* (Evaporation, condensation, precipitation, runoff)
  - *DC Electric Circuit* (Resistor, battery, capacitor, current vectors)
  - *Inclined Plane Mechanics* (Normal force, friction, gravitational decomposition)
- **Diagram Asset Catalog (`src/lib/assets.ts`)**: High-resolution anatomical and scientific SVG diagrams equipped with mapped coordinate regions (e.g., Superior Vena Cava, Right Atrium, Aorta).
- **2-Minute 4-Chapter Structure (`src/lib/recorded-classes.ts`)**:
  1. **Chapter 1 (0:00–0:28)**: Core concept and diagram setup.
  2. **Chapter 2 (0:28–1:02)**: Step-by-step vector demonstration.
  3. **Chapter 3 (1:02–1:36)**: Practice problem with an interactive *"Your Turn"* thinking pause.
  4. **Chapter 4 (1:36–2:00)**: Worked answer reveal and summary.
- **Narration Audio**: Studio-quality synchronized narration files in `public/class-audio/` synced with exact millisecond timestamps and cue events.

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
  - **Boost Mode (`Zap` icon / `Ctrl + b` / `/boost`)**: Toggle 120 FPS GPU hardware acceleration, subpixel vector antialiasing, and zero seek latency.
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

## 5. Boost Mode & 120 FPS Hardware Acceleration

Boost Mode provides hardware-accelerated, zero-latency vector rendering for classroom whiteboards:

1. **120 FPS GPU Compositor Pipeline**:
   - Applies `transform: translateZ(0)` and `contain: layout paint` to decouple the whiteboard from document reflows.
   - Isolates the 5 SVG layers (`assets`, `teacher-permanent`, `teacher-annotations`, `student`, and `overlays`), preventing repaint thrashing.
   - Smooths the marker cursor with sub-millisecond requestAnimationFrame transform interpolation.
2. **Subpixel Vector Precision & Graphyphy Typography**:
   - Enforces `shape-rendering: geometricPrecision` and `text-rendering: optimizeLegibility`.
   - Crisp rendering of diagrams and handwritten math formulas across high-DPI displays.
3. **Zero-Latency Chapter & Class Switching**:
   - Pre-caches vector marks, diagram assets, and audio anchors.
   - Seamlessly jumps between chapters and switches classes with zero ghost marks and no cursor teleportation glitch.
4. **Activation Methods**:
   - **Meet Bar**: Click the `Zap` button in the Google Meet bottom bar.
   - **Topbar**: Click the `Boost` button in the workspace top bar.
   - **Keyboard Shortcut**: Press `Ctrl + B` (or `Cmd + B` / `Alt + B`).
   - **Slash Commands**: Type `/boost` in the in-call chat (or `/gsd` / `/graphy`).
   - For an in-depth architecture deep-dive, see [docs/BOOST_MODE_AND_PERFORMANCE.md](docs/BOOST_MODE_AND_PERFORMANCE.md).

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

# Unit and integration test suites
npx playwright test tests/asset-pipeline.spec.ts tests/class-chapter-switch-glitch.spec.ts tests/spatial.spec.ts

# Run all Playwright test suites (100+ tests)
npx playwright test
```

All 100+ automated tests verify:
- Boost Mode GPU hardware acceleration, zero-latency seek, and class switching without visual glitches or cursor flicker.
- Vector stroke persistence, student layer undo/redo isolation, shapes, text, erasing, and bookmarking.
- Audio clock playback, cue synchronization, chapter navigation, and offline caption fallbacks.
- Google Meet control bar, sliding chat drawer, live captions overlay, and camera show/hide toggling.
- Canvas Intelligence Engine (CIE) 5-layer SVG coordinate mappings across all 5 benchmark diagrams.
- Pedagogical state machine, Learner Adaptive Model (LAM) Bayesian knowledge tracing, and VAD duplex audio.
