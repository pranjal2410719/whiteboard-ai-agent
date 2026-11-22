# Qrie Codebase Audit: Current State

> **Audit Date:** November 20, 2026  
> **Auditor:** Senior Software Architect & Technical Lead  
> **Repository:** `whiteboard-ai-agent` (Qrie · AI Classroom)  
> **Primary Branches:** `main` (clean, verified, synced with remote)

---

## 1. Executive Summary & Project Reality

The Qrie repository represents an innovative, hybrid AI tutoring system. A rigorous inspection of the codebase reveals that the repository currently contains **two distinct, parallel subsystems** that were developed side-by-side:

```
                                  REPOSITORY ROOT
                                         │
        ┌────────────────────────────────┴────────────────────────────────┐
        ▼                                                                 ▼
[Next.js 16 Web Application]                              [Python 3 Autonomous Agent]
  - Location: `src/`, `public/`                             - Location: `whiteboard_tutor_agent/`, `tests/test_*.py`
  - Tech: React 19, TypeScript, Drizzle ORM, PG 17          - Tech: Python 3.13, Requests, HTTP Server
  - Canvas: Custom SVG Vector Whiteboard                    - Canvas: External Excalidraw Canvas Server (Port 3000)
  - Features: Demo Lectures, Google Meet Bar,               - Features: Spatial Engine, Flowchart Manager,
    Gemini/OpenAI Tool-calling, Web Speech TTS/STT            Curriculum State Machine, CLI & REST Server
```

1. **The Web Platform (`src/`)**: A Next.js 16 (App Router) full-stack TypeScript application featuring an SVG-based vector whiteboard with handwriting simulation, pre-recorded audio lecture playback with cue-synchronized whiteboard animations, a Google Meet bottom control bar, live captions overlay, and an AI tutor turn handler powered by Google Gemini (with OpenAI fallback) and PostgreSQL 17 via Drizzle ORM.
2. **The Python Autonomous Agent (`whiteboard_tutor_agent/`)**: A Python 3.13 engine featuring geometric bounding-box spatial awareness, semantic element tracking, flowchart generation, and a multi-step curriculum engine that interacts with an external **Excalidraw canvas server** via REST.

**Key Finding:** The Web application does not currently call the Python agent, nor does it use Excalidraw. The web application renders its own in-house SVG whiteboard. Both subsystems are functional in their own environments, but their capabilities have not yet been unified.

---

## 2. Technology Stack Inventory

### 2.1 Web Platform (`src/`)
| Layer | Technology | Version | Evidence / Source File |
|---|---|---|---|
| **Framework** | Next.js (App Router) | `16.4.6` | [`package.json`](file:///home/vscode-gcp/projects/qrie_tutors/test06/ai-whiteboard-tutor-platform%20(1)/package.json#L20) |
| **UI Library** | React & React DOM | `19.2.6` | [`package.json`](file:///home/vscode-gcp/projects/qrie_tutors/test06/ai-whiteboard-tutor-platform%20(1)/package.json#L22-L23) |
| **Language** | TypeScript | `5.9.3` | [`package.json`](file:///home/vscode-gcp/projects/qrie_tutors/test06/ai-whiteboard-tutor-platform%20(1)/package.json#L36), [`tsconfig.json`](file:///home/vscode-gcp/projects/qrie_tutors/test06/ai-whiteboard-tutor-platform%20(1)/tsconfig.json) |
| **Styling** | Tailwind CSS v4, PostCSS | `4.1.17` | [`package.json`](file:///home/vscode-gcp/projects/qrie_tutors/test06/ai-whiteboard-tutor-platform%20(1)/package.json#L35), [`src/app/globals.css`](file:///home/vscode-gcp/projects/qrie_tutors/test06/ai-whiteboard-tutor-platform%20(1)/src/app/globals.css) |
| **Icons** | Lucide React | `1.75.0` | [`package.json`](file:///home/vscode-gcp/projects/qrie_tutors/test06/ai-whiteboard-tutor-platform%20(1)/package.json#L19) |
| **Typography** | Fontsource Caveat, DM Sans | `5.3.0` | [`package.json`](file:///home/vscode-gcp/projects/qrie_tutors/test06/ai-whiteboard-tutor-platform%20(1)/package.json#L14-L15) |
| **Database ORM** | Drizzle ORM & Drizzle Kit | `0.45.2` / `0.31.10` | [`package.json`](file:///home/vscode-gcp/projects/qrie_tutors/test06/ai-whiteboard-tutor-platform%20(1)/package.json#L18) |
| **Database Engine** | PostgreSQL 17 (node-postgres) | `8.20.0` | [`package.json`](file:///home/vscode-gcp/projects/qrie_tutors/test06/ai-whiteboard-tutor-platform%20(1)/package.json#L21), [`src/db/index.ts`](file:///home/vscode-gcp/projects/qrie_tutors/test06/ai-whiteboard-tutor-platform%20(1)/src/db/index.ts#L1-L24) |
| **Real-Time Transport** | WebRTC & RTCDataChannels | RFC 4145 / 5761 / SCTP | [`src/lib/duplex-voice.ts`](file:///home/vscode-gcp/projects/qrie_tutors/test06/ai-whiteboard-tutor-platform%20(1)/src/lib/duplex-voice.ts), [`src/app/api/live/route.ts`](file:///home/vscode-gcp/projects/qrie_tutors/test06/ai-whiteboard-tutor-platform%20(1)/src/app/api/live/route.ts) |
| **Modular Classes** | Self-Contained Lecture Packages | 4 Canonical Classes | [`src/classes/`](file:///home/vscode-gcp/projects/qrie_tutors/test06/ai-whiteboard-tutor-platform%20(1)/src/classes/) |
| **Acceleration Engine** | Boost Mode (120 FPS GPU & SCTP) | Native Hardware / CSS | [`src/components/Whiteboard.tsx`](file:///home/vscode-gcp/projects/qrie_tutors/test06/ai-whiteboard-tutor-platform%20(1)/src/components/Whiteboard.tsx), [`src/components/GoogleMeetBar.tsx`](file:///home/vscode-gcp/projects/qrie_tutors/test06/ai-whiteboard-tutor-platform%20(1)/src/components/GoogleMeetBar.tsx) |
| **Testing** | Playwright Test | `1.65.1` | [`package.json`](file:///home/vscode-gcp/projects/qrie_tutors/test06/ai-whiteboard-tutor-platform%20(1)/package.json#L16), [`playwright.config.ts`](file:///home/vscode-gcp/projects/qrie_tutors/test06/ai-whiteboard-tutor-platform%20(1)/playwright.config.ts) |

### 2.2 Python Autonomous Agent Subsystem (`whiteboard_tutor_agent/`)
| Layer | Technology | Details | Evidence / Source File |
|---|---|---|---|
| **Runtime** | Python 3.13 | Native dataclasses, urllib, http.server | [`whiteboard_tutor_agent/__init__.py`](file:///home/vscode-gcp/projects/qrie_tutors/test06/ai-whiteboard-tutor-platform%20(1)/whiteboard_tutor_agent/__init__.py) |
| **HTTP Server** | Python `http.server` | Lightweight REST server on port 8899/8000 | [`whiteboard_tutor_agent/server.py`](file:///home/vscode-gcp/projects/qrie_tutors/test06/ai-whiteboard-tutor-platform%20(1)/whiteboard_tutor_agent/server.py#L1-L40) |
| **Canvas Client** | Requests HTTP client | REST interface targeting Excalidraw server | [`whiteboard_tutor_agent/canvas_client.py`](file:///home/vscode-gcp/projects/qrie_tutors/test06/ai-whiteboard-tutor-platform%20(1)/whiteboard_tutor_agent/canvas_client.py#L1-L50) |
| **Testing** | Python `unittest` | 60 unit tests covering all modules | [`tests/test_*.py`](file:///home/vscode-gcp/projects/qrie_tutors/test06/ai-whiteboard-tutor-platform%20(1)/tests/) |

---

## 3. Application Structure & Module Breakdown

```
ai-whiteboard-tutor-platform/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── assets/route.ts        # GET /api/assets — Catalog of diagrams with coordinates
│   │   │   ├── connection/route.ts    # POST /api/connection — Validates Gemini/OpenAI API keys
│   │   │   ├── health/route.ts        # GET /api/health — Database connectivity healthcheck
│   │   │   ├── sessions/route.ts      # GET/POST /api/sessions — Session creation and listing
│   │   │   ├── sessions/[id]/route.ts # GET/PATCH/DELETE /api/sessions/[id] — CRUD for session data
│   │   │   ├── tts/route.ts           # POST /api/tts — Vertex AI Gemini TTS PCM-to-WAV synthesis
│   │   │   └── tutor/route.ts         # POST /api/tutor — Core AI tutor turn orchestrator
│   │   ├── globals.css                # Universal CSS (Google Meet bar, whiteboard, animations)
│   │   ├── layout.tsx                 # HTML root with fonts (Caveat, DM Sans, Kalam, Devanagari)
│   │   └── page.tsx                   # Main entry point mounting <Studio />
│   ├── components/
│   │   ├── Brand.tsx                  # Qrie AI Classroom vector logo & mark
│   │   ├── ClassNotes.tsx             # Pre-recorded class summary notes dialog
│   │   ├── Dialogs.tsx                # NewSessionDialog, SettingsDialog, HelpDialog, Transcript
│   │   ├── GoogleMeetBar.tsx          # Google Meet bottom bar with call controls & states
│   │   ├── LeaveCallDialog.tsx        # Call departure confirmation modal
│   │   ├── LecturePlayer.tsx          # Legacy playback controls (superseded by GoogleMeetBar integrated controls)
│   │   ├── Library.tsx                # Saved boards and history view
│   │   ├── LiveCaptionsOverlay.tsx    # Real-time speech transcript & tutor caption overlay
│   │   ├── SlidingChatPanel.tsx       # Sliding sidebar chat drawer for text dialogue
│   │   ├── Studio.tsx                 # Master classroom coordinator & state hub
│   │   ├── TeacherCam.tsx             # Animated SVG talking portrait avatar
│   │   ├── useClassPlayback.ts        # Audio playback synchronization & cue boundary hook
│   │   └── Whiteboard.tsx             # SVG vector canvas, drawing tools, marker loop
│   ├── db/
│   │   ├── index.ts                   # PostgreSQL pool connection via drizzle-orm
│   │   └── schema.ts                  # Drizzle table definition: chalkly_study_sessions
│   └── lib/
│       ├── annotate.ts                # Precision coordinate mapping for diagram regions
│       ├── assets.ts                  # Bundled visual asset definitions & lookup logic
│       ├── class-scripts.json         # 4 curated visual masterclass lectures (Heart, Cell, Pythagoras, Fractions) with timestamps & narrations
│       ├── diagrams.ts                # Bundled diagram metadata with anatomical regions
│       ├── lessons.ts                 # Guided lessons fallback & topic catalogs
│       ├── recorded-classes.ts        # Prerecorded class vector board layouts & mark generators
│       ├── store.ts                   # Cookie-based workspace management & DB queries
│       ├── tutor.ts                   # Gemini & OpenAI function calling, schema & system prompts
│       └── types.ts                   # Core TypeScript domain models (BoardMark, BoardPage, etc.)
├── whiteboard_tutor_agent/            # Standalone Python Subsystem
│   ├── canvas_client.py               # Excalidraw REST API client
│   ├── cli.py                         # Interactive terminal learning interface
│   ├── curriculum.py                  # Structured Physics/Biology lesson steps & evaluation
│   ├── flowchart_manager.py           # Automated flowchart layout & semantic node tracking
│   ├── llm_client.py                  # Gemini, OpenAI, Ollama & heuristic evaluation client
│   ├── semantic_element.py            # 5W tracking (Who, What, Where, When, Why) for canvas elements
│   ├── server.py                      # Standalone Python HTTP REST API server
│   ├── spatial_context.py             # Geometric bounding-box calculation & spatial collision
│   ├── tutor_agent.py                 # Central pedagogical coordinator for Excalidraw
│   ├── web_ui.py                      # Standalone HTML classroom interface
│   └── whiteboard_ops.py              # High-level operations: DRAW, ERASE, LIGHT, ANNOTATE, ALIGN
└── public/
    ├── assets/                        # SVG diagrams, heart JPEG/PNG, assets-manifest.json
    ├── class-audio/                   # Pre-recorded MP3 audio files for 6 demo lectures
    └── diagrams/                      # Standalone SVG diagrams
```

---

## 4. Database Architecture & Persistence

### 4.1 Schema Definition
Inspection of [`src/db/schema.ts`](file:///home/vscode-gcp/projects/qrie_tutors/test06/ai-whiteboard-tutor-platform%20(1)/src/db/schema.ts#L1-L10) reveals a **single-table, JSONB-centric schema**:

```sql
CREATE TABLE chalkly_study_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL,
    data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
CREATE INDEX chalkly_session_workspace_idx ON chalkly_study_sessions (workspace_id);
```

### 4.2 Data Payload Structure
All domain state is packed into the `data` JSONB column (`SessionData` in [`src/lib/types.ts`](file:///home/vscode-gcp/projects/qrie_tutors/test06/ai-whiteboard-tutor-platform%20(1)/src/lib/types.ts#L42-L50)):
- `title`: string
- `subject`: string
- `lessonKey`: string (e.g. `"pythagoras"`, `"human-cell"`)
- `pages`: Array of `BoardPage` objects:
  - `id`: UUID string
  - `title`: string
  - `marks`: Array of `BoardMark` vector elements (tutor-drawn)
  - `ink`: Array of `BoardMark` vector elements (student-drawn)
  - `cursor`: `{ x, y }` position of the animated marker
  - `narration`: Optional spoken narration string
  - `seconds`: Duration in seconds
  - `cues`: Array of `LessonCue` timing boundaries
  - `regions`: Array of `DiagramRegion` bounding boxes
- `messages`: Chat message history `[{ role: "user" | "assistant", content }]`
- `suggestions`: Array of follow-up suggestion strings
- `saved`: Boolean bookmark indicator
- `mode`: `"guided" | "llm"`
- `quiz`: Optional quiz `{ answer, explanation, hint }`
- `lecture`: Optional lecture metadata `{ title, totalSeconds, startIndex, sceneCount }`

### 4.3 Workspace Identification & Authentication
- **Mechanism:** Anonymous HTTP-only cookie named `chalkly_workspace` ([`src/lib/store.ts`](file:///home/vscode-gcp/projects/qrie_tutors/test06/ai-whiteboard-tutor-platform%20(1)/src/lib/store.ts#L9-L16)).
- **Authentication:** None. No user accounts, passwords, OAuth, or JWT tokens exist.
- **Authorization:** Sessions are scoped strictly by matching `workspace_id` in the query filter.

---

## 5. AI Models, Prompts & Tool-Calling Architecture

### 5.1 Model Integrations
- **Google Gemini**: Integrates with the Generative Language REST API (`https://generativelanguage.googleapis.com/v1beta/models/...:generateContent`) with automatic fallback to **Google Cloud Vertex AI** (`https://${location}-aiplatform.googleapis.com/v1/projects/...`).
- **OpenAI**: Integrates with OpenAI-compatible REST API (`https://api.openai.com/v1/chat/completions`).
- **API Keys**: Configured globally in `.env` (`GEMINI_API_KEY`) or supplied dynamically by the client in HTTP headers (`x-gemini-key`, `x-openai-key`).

### 5.2 Structured Tool Definition (`draw_on_whiteboard`)
Both Gemini and OpenAI are constrained via structured function calling ([`src/lib/tutor.ts`](file:///home/vscode-gcp/projects/qrie_tutors/test06/ai-whiteboard-tutor-platform%20(1)/src/lib/tutor.ts#L96-L115)):
- `title`: Lesson title
- `subject`: Subject name
- `explanation`: Spoken explanation text
- `suggestions`: 2–3 follow-up prompts
- `elements`: Vector elements to draw (`text`, `path`, `rect`, `ellipse`, `image`)
- `annotations`: Diagram regions to highlight or wire (`region`, `style`, `label`)
- `scenes`: Array of 3 sequential scenes for 2-minute lecture generation

### 5.3 Spatial Context Injection (`boardSummary`)
Before every AI turn, the tutor generates a spatial inventory of the current board page ([`src/lib/tutor.ts`](file:///home/vscode-gcp/projects/qrie_tutors/test06/ai-whiteboard-tutor-platform%20(1)/src/lib/tutor.ts#L225-L230), [`src/lib/annotate.ts`](file:///home/vscode-gcp/projects/qrie_tutors/test06/ai-whiteboard-tutor-platform%20(1)/src/lib/annotate.ts#L10-L40)). The AI is informed of all existing diagram regions (e.g. `nucleus`, `mitochondria`, `membrane`) so it does not hallucinate new coordinates.

### 5.4 Multilingual Support
System prompt directives enforce full spoken and written responses in:
- English (`en-US`)
- Hindi (`hi-IN`, Devanagari script)
- Hinglish (`en-IN / Roman Hindi`, conversational phonetic Hindi with English terminology)

---

## 6. Voice, Audio & Speech Infrastructure

1. **Pre-recorded MP3 Audio**:
   - Located in `public/class-audio/`.
   - Active curriculum masterclasses are backed by synchronized audio files: `heart-diagram-v2.mp3`, `human-cell-v2.mp3`, `pythagoras-v2.mp3`, and `fractions-v2.mp3`.
   - Legacy prototype classes (`gravity-friction`, `linear-equations`, `water-cycle`) have been retired from prerecorded scripts and superseded by the 5 Canvas Intelligence Engine (CIE) benchmark diagrams (`heart-diagram`, `cell-diagram`, `water-diagram`, `circuit-diagram`, `inclined-diagram`).
   - If audio fails to load or is unconfigured, the app gracefully falls back to browser Web SpeechSynthesis and monotonic visual clock interpolation.
2. **Dynamic Speech-to-Text (STT)**:
   - Client-side Web Speech API (`window.webkitSpeechRecognition` / `window.SpeechRecognition`) in [`src/components/Studio.tsx`](file:///home/vscode-gcp/projects/qrie_tutors/test06/ai-whiteboard-tutor-platform%20(1)/src/components/Studio.tsx#L295-L330).
   - Real-time partial results are streamed to `liveUserSpeech` state and displayed on the `LiveCaptionsOverlay`.
   - Automatic 1.7-second silence detection triggers submission.
3. **Dynamic Text-to-Speech (TTS)**:
   - Server-side route [`/api/tts`](file:///home/vscode-gcp/projects/qrie_tutors/test06/ai-whiteboard-tutor-platform%20(1)/src/app/api/tts/route.ts#L1-L104) connects to Google Cloud Vertex AI using `gemini-2.5-flash-preview-tts` (Zephyr voice), synthesizing 24kHz PCM L16 audio and packaging it into a valid WAV container.
   - If server TTS fails or is unconfigured, [`src/components/Studio.tsx`](file:///home/vscode-gcp/projects/qrie_tutors/test06/ai-whiteboard-tutor-platform%20(1)/src/components/Studio.tsx#L240-L255) falls back to `window.speechSynthesis`.

---

## 7. Whiteboard & Vector Rendering Architecture

1. **SVG Coordinate System**:
   - Fixed virtual resolution: **1000 × 330 units** (3:1 aspect ratio).
   - Left half ($x = 45 \dots 470$): Titles, formulas, equations, explanations.
   - Right half ($x = 550 \dots 930$): Diagrams, geometric figures, charts.
   - Responsive stacking: For viewports $\le 900\text{px}$, right-side content is dynamically translated downward ($x - 463, y + 230$), transforming into a 500 × 550 stacked mobile layout.
2. **Stroke Interpolation & Handwriting Simulation**:
   - Every mark (path, rect, ellipse, text) is sampled into equidistant point arrays via `samplePoints()` and SVG `getTotalLength()` ([`src/components/Whiteboard.tsx`](file:///home/vscode-gcp/projects/qrie_tutors/test06/ai-whiteboard-tutor-platform%20(1)/src/components/Whiteboard.tsx#L32-L48)).
   - An SVG `<MarkerCursor />` tracks the exact pen tip in real-time via `requestAnimationFrame`.
   - Strokes are revealed progressively using SVG `stroke-dasharray` and `stroke-dashoffset` tricks.
3. **Student Drawing Layer**:
   - Kept in `page.ink` array, separate from tutor's `page.marks`.
   - Undo/Redo stacks (`undoStack`, `redoStack`) operate exclusively on `page.ink`, guaranteeing student edits can never corrupt or delete AI-drawn lesson content.
4. **Boost Mode & 120 FPS Hardware Acceleration**:
   - Isolates the 5 SVG layers (`assets`, `teacher-permanent`, `teacher-annotations`, `student`, `overlays`) into dedicated GPU backing stores via `transform: translateZ(0)` and `contain: layout paint`.
   - Continuous monotonic clock interpolation in `useClassPlayback.ts` eliminates jitter between audio decoder ticks.
   - Eliminates cursor flicker and teleportation glitches during chapter seeking and class switching.
   - Persisted across sessions via `localStorage.getItem("chalkly.boostMode")` and controllable via Meet Bar `Zap` button, workspace top bar, `Ctrl + B`, or `/boost` chat command. (See [docs/BOOST_MODE_AND_PERFORMANCE.md](docs/BOOST_MODE_AND_PERFORMANCE.md)).

---

## 8. Verification & Test Execution Status

### 8.1 TypeScript & Unit Tests (Sandboxed)
```bash
npm run typecheck && npx playwright test tests/assets.spec.ts tests/model-tool.spec.ts
```
**Result:** **16 passed in 1.2s** (0 errors).
- Validated all diagram assets, region landmarks, coordinate bounding boxes, and precision wiring.
- Validated Gemini tool declarations, multilingual prompt directives, and two-minute lecture capping.

### 8.2 End-to-End Playwright Tests
```bash
PLAYWRIGHT_BASE_URL=http://127.0.0.1:3001 npx playwright test tests/studio.spec.ts
```
**Result:** **8 passed in 28.6s** (0 failures).
- Test 1: Student pen, text, shapes, undo, erasing, and bookmarks persist (`4.4s`).
- Test 2: Tutor drawing replay, worked examples, quizzes, and conversation history (`2.6s`).
- Test 3: New lessons, workspace preferences, search, and deletion (`3.0s`).
- Test 4: Whiteboard reveals practice answer on cue and saves notes (`4.7s`).
- Test 5: All 4 core sessions have distinct recording and study notes (`5.3s`).
- Test 6: Tutor cam animates without covering board or slowing marker (`3.5s`).
- Test 7: Class captions and drawings play if audio cannot load (`2.4s`).
- Test 8: Mobile layout stacks diagram and keeps navigation accessible (`2.0s`).

### 8.3 Python Subsystem Tests
```bash
python3 -m unittest discover tests
```
**Result:** **60 passed in 0.348s** (0 failures).
- Validates SpatialContext, BoundingBox calculations, FlowchartManager, Curriculum steps, SemanticElement 5W tracking, and WhiteboardOperations.
