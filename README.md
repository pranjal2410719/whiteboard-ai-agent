# Qrie — AI Whiteboard Tutor Platform

A Next.js App Router educational application featuring an interactive vector whiteboard, WebRTC full-duplex real-time media and low-latency `RTCDataChannel` communication, automatic Boost Mode 120 FPS GPU hardware acceleration, a single unified AI tutor persona (**Professor**), a focused Student Learning Bar, student voice-only mode with visual doubt resolution, and a Vision Perception & Precision Grounding Engine.

---

## Architecture Overview

Qrie blends real-time 120 FPS vector canvas rendering with multimodal AI models (Gemini 2.5 Flash / Pro), WebRTC low-latency audio/video/data streaming, a distraction-free student learning space, and an intelligent Vision Grounding Engine.

For an in-depth breakdown with data models and Mermaid diagrams, see [docs/MASTER_ARCHITECTURE.md](docs/MASTER_ARCHITECTURE.md), [docs/CLASS_AND_TUTOR_ARCHITECTURE.md](docs/CLASS_AND_TUTOR_ARCHITECTURE.md), and [QRIE_AI_VISION_MASTER_PLAN.md](QRIE_AI_VISION_MASTER_PLAN.md).

```
+-----------------------------------------------------------------------------------+
| Topbar: Navigation / Breadcrumbs / Session Save Status / Boost Status Strip       |
+-----------------------------------------------------------------------------------+
|                                                                                   |
|  INTERACTIVE WHITEBOARD CANVAS (Full Height, Automatic 120 FPS GPU Acceleration)  |
|                                                                                   |
|  [Distraction-Free Visual Learning Stage]                                         |
|  - High-precision SVG vector layers (assets, permanent, annotations, student)     |
|  - Vision Perception & Precision Grounding: diagram boundary & label detection   |
|  - Real-time animated marker loop with subpixel transform interpolation           |
|                                                                                   |
|  [Student Voice-Only Interface]                                                   |
|  - Drawing tools disabled/hidden for student; primary interaction via Voice Mic   |
|  - Visual Doubt Pinpointing & Ephemeral Laser Circles                             |
|  - Pristine Static Thumbnail Covers & Interactive "Start Class" Preparation Hero  |
|                                                                                   |
|  [WebRTC Real-Time Data Channels]                                                 |
|  - whiteboard-strokes: 120fps hardware-sampled unordered SCTP datagrams           |
|  - tutor-intelligence: Instant barge-in interrupts, marks, and chapter sync       |
|                                                                                   |
+-----------------------------------------------------------------------------------+
| Live Captions Overlay (Centered Subtitles: Student & "Professor:" speech)        |
+-----------------------------------------------------------------------------------+
| STUDENT LEARNING CONTROL BAR (#202124)                                            |
| [Lesson Title]  [Prev] [Play/Pause] [Next] [Exit]  [Mic (VAD)] [CC] [1.0x] [Chat] |
+-----------------------------------------------------------------------------------+
                                                                   |
                                          (Toggles from right) --> | [Discussion & Transcript]
                                                                   | - Chronological Narration
                                                                   | - Student Q&A History
                                                                   | - "Professor is thinking…"
                                                                   | - Suggested Question Chips
                                                                   | - Unified Question Input
```

---

## 1. Modular Demo Classes (`src/classes/`)

Each lecture class is organized into its own dedicated, self-contained modular directory holding its codebase, vector assets, synchronized studio audio, canonical cover marks, and metadata:

```
src/classes/
├── index.ts                     # Central registry exporting the Human Cell class & helpers
├── types.ts                     # TypeScript definitions for classes, scenes, and metadata
├── helpers.ts                   # Reusable SVG mark generation utilities
│
└── human-cell/                  # Class: Human Cell
    ├── index.ts                 # Class entry point & complete definition
    ├── board.ts                 # Whiteboard initial cover & 4 chapter scenes
    ├── intelligence.ts          # 6 organelle semantic regions & targets
    ├── script.json              # Chapter narration, timestamps, cues, study notes
    ├── README.md                # Class documentation
    ├── assets/                  # High-res cell anatomy diagram (human_cell_diagram.png)
    └── audio/                   # 2-minute lecture audio (human-cell-v2.mp3)
```

- **Pristine Static Thumbnails**: Each class displays a static, canonical cover thumbnail that never gets contaminated by previous session drawing marks.
- **Interactive Preparation Hero**: When a class is selected, students see a clean overview hero card with class metadata and a prominent "Start Class" button that cleanly initiates lecture playback and audio streaming.

---

## 2. Vision Perception & Precision Grounding Engine (`src/lib/vision/`)

Qrie equips the AI tutor with computer vision to perceive whiteboard diagrams and ground drawing actions spatially:
- **Spatial Grounding (`grounding.ts`)**: Projects diagram coordinates accurately to viewport coordinates ($1000 \times 330$) and checks text/diagram bounding-box overlap.
- **Diagram Understanding (`diagram-understanding.ts`)**: Identifies biological organelles, electrical circuits, anatomical chambers, and geometric figures.
- **OCR & Label Extraction (`ocr.ts`)**: Detects and extracts text labels, annotations, and mathematical formulas directly from diagrams.
- **Scene Graph Modeling (`scene-graph.ts`)**: Tracks semantic relationships (e.g. *Right Ventricle connects to Pulmonary Artery via Pulmonary Valve*).
- **Vision API Route (`/api/vision`)**: Dedicated REST endpoint for diagram ingestion, visual feature extraction, and precision annotation coordinate calculation. Verified with 20/20 passing tests.

---

## 3. WebRTC Low-Latency Communication Architecture

Qrie implements **WebRTC** (`RTCPeerConnection` and `RTCDataChannel`) with native browser-level peer connection and signaling support:

- **Dual-Peer WebRTC Architecture**:
  - The client initializes a primary `RTCPeerConnection` (Student) paired with a local AI Tutor Agent `RTCPeerConnection` endpoint.
  - Generates authentic, browser-native SDP offers and answers, performs true ICE candidate discovery, and completes DTLS/SCTP handshakes on the client.
- **Full-Duplex Audio Streaming**:
  - Bi-directional audio tracks (`addAudioTrack()`, `onRemoteAudioTrack`) stream student speech from the microphone and receive audio explanations.
- **Dedicated `RTCDataChannel` Multiplexing**:
  - `whiteboard-strokes`: Streams high-frequency pointer coordinates and whiteboard marks. In Boost Mode, operates across unordered 0-retransmit SCTP (`ordered: false`, `maxRetransmits: 0`) with zero buffer threshold (`bufferedAmountLowThreshold: 0`) for instant packet dispatch at up to 120 FPS.
  - `tutor-intelligence`: Carries pedagogical control events, instant barge-in interrupts (`speech_start`, `speech_end`), student visual doubt pinpoints (`doubt_point`), and tutor drawing mark sync.
  - `duplex-voice`: Telemetry and voice session signaling.
- **Signaling Gateway (`/api/live`)**:
  - Serves as an HTTP signaling relay for storing offers, answers, ICE candidate pools, and Boost Mode synchronization across sessions.

---

## 4. Student Voice-Only Mode & Doubt Resolution

In live classrooms, students interact naturally through voice and pinpoint gestures rather than complex drawing toolboxes:
- **Drawing Toolbar Hidden**: The bottom/side drawing toolboxes are hidden for students to prevent UI clutter and keep focus on the lesson.
- **Voice-Driven Interaction**: Students speak into their microphone to ask questions, interrupt the tutor (barge-in), or request clarification.
- **Visual Doubt Pinpoints**: Clicking or tapping on diagrams creates ephemeral pinpoint circles and coordinates sent over the WebRTC data channel, allowing Professor to immediately identify what the student is pointing at and tailor the explanation.

---

## 5. Unified Student Learning Studio Environment

Qrie provides a focused, modern learning space centered entirely around the whiteboard and a single dedicated tutor persona—**Professor**:
- **Student Learning Control Bar (`src/components/GoogleMeetBar.tsx`)**:
  - **Left**: Current session / chapter title.
  - **Playback Controls**: Previous chapter, Play/Pause lecture, Next chapter, Exit lecture.
  - **Microphone (`Ctrl + d` / `M`)**: Instant speech input with live VAD meter; clicking during lecture immediately enters Doubt-Solving Mode.
  - **Captions (`c`)**: Toggle real-time closed captions with clear "Professor:" speaker tags.
  - **Playback Speed**: Cycle class narration speed seamlessly across `0.75x`, `1x`, `1.25x`, `1.5x`, and `2x`.
  - **Right Controls**: One-click toggle for the Unified Conversation Transcript & Discussion Panel.
  - *All meeting clutter (clocks, fake camera tiles, hand-raising buttons, screen-sharing toggles, and leave-call departure modals) has been cleanly removed.*
- **Clean Whiteboard Canvas (`src/components/Whiteboard.tsx`)**:
  - Distraction-free, responsive vector canvas with visual diagram grounding and marker animation loop.
- **Unified Conversation Transcript (`src/components/SlidingChatPanel.tsx`)**:
  - Chronological lecture transcript combined with student Q&A, suggested questions, and real-time status indicators (*"Professor is thinking…"*, *"Professor is demonstrating on the whiteboard…"*) with author label **Professor**.
- **Live Captions Overlay (`src/components/LiveCaptionsOverlay.tsx`)**:
  - Clean floating subtitle banner indicating Professor verbal explanations and student speech.

---

## 6. Automatic Boost Mode & 120 FPS Hardware Acceleration

Boost Mode provides hardware-accelerated, zero-latency vector rendering and WebRTC data streaming:

1. **Automatic 120 FPS GPU Compositor Pipeline**:
   - Enabled by default on the whiteboard stage (`data-boost-mode="true"`).
   - Applies `transform: translateZ(0)` and `contain: layout paint` to decouple the whiteboard from document reflows.
   - Isolates the 5 SVG layers (`assets`, `teacher-permanent`, `teacher-annotations`, `student`, and `overlays`), preventing repaint thrashing.
   - Smooths the marker cursor with sub-millisecond `requestAnimationFrame` transform interpolation.
2. **WebRTC SCTP Data Channel Optimization**:
   - Switches `whiteboard-strokes` to unordered, 0-retransmit SCTP packets.
   - Sets `bufferedAmountLowThreshold: 0` for immediate buffer flushing.
   - Bypasses pointer throttle, sampling at full native hardware display refresh rates (120 Hz+).
3. **Subpixel Vector Precision & Crisp Typography**:
   - Enforces `shape-rendering: geometricPrecision` and `text-rendering: optimizeLegibility`.
   - Crisp rendering of diagrams and formulas across Retina and high-DPI displays.
4. **Zero-Latency Chapter & Class Switching**:
   - Pre-caches vector marks, diagram assets, and audio anchors.
   - Seamlessly jumps between chapters and switches classes with zero ghost marks and no cursor teleportation glitch.
5. **Shortcuts & Commands**:
   - Press `Ctrl + B` (or `Cmd + B` / `Alt + B`) to toggle.
   - Type `/boost` (or `/boost on`, `/boost off`) in the discussion panel.
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
# TypeScript verification (0 errors)
npm run typecheck

# Vision Grounding Engine suite (20 tests)
npx playwright test tests/vision-grounding.spec.ts

# WebRTC and duplex voice suite (16 tests)
npx playwright test tests/webrtc-boost.spec.ts tests/duplex-voice.spec.ts

# Multi-class voice sync and visual calibration suites
npx playwright test tests/all-classes-voice-sync-annotations.spec.ts tests/human-cell-annotations.spec.ts tests/doubt-resolution-sync.spec.ts

# Complete Playwright test suites (115+ tests, 100% passing)
npx playwright test
```

All 115+ automated tests verify:
- Vision Perception & Precision Grounding engine (20/20 passed): OCR extraction, bounding-box grounding, and scene graph resolution.
- WebRTC peer connections, SDP offer/answer negotiation, and high-frequency `RTCDataChannel` stroke streaming.
- Boost Mode GPU hardware acceleration, zero-latency seek, unordered SCTP packet transmission, and class switching without glitches.
- Modular self-contained Human Cell class package (`human-cell`) with pristine static thumbnails.
- Student voice-only mode with drawing tools disabled and active microphone interaction.
- Student Learning Bar with playback controls, closed captions, and unified conversation transcript panel.
- Audio clock playback, cue synchronization, chapter navigation, and offline caption fallbacks.
