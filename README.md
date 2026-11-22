# Chalkly — AI Learning Studio

A Next.js App Router educational application featuring an interactive vector whiteboard, WebRTC full-duplex real-time media and low-latency `RTCDataChannel` communication, Boost Mode 120 FPS GPU hardware acceleration, an AI tutor with forced whiteboard function calling, a Google Meet-style studio interface, student voice-only mode, and private PostgreSQL-backed learning sessions.

---

## Architecture Overview

Chalkly blends real-time 120 FPS vector canvas rendering with multimodal AI models (Gemini 2.5 Flash / Pro), WebRTC low-latency audio/video/data streaming, and a familiar Google Meet classroom layout.

For an in-depth breakdown with data models and Mermaid diagrams, see [docs/MASTER_ARCHITECTURE.md](docs/MASTER_ARCHITECTURE.md) and [docs/CLASS_AND_TUTOR_ARCHITECTURE.md](docs/CLASS_AND_TUTOR_ARCHITECTURE.md).

```
+-----------------------------------------------------------------------------------+
| Topbar: Navigation / Breadcrumbs / Session Save Status / Boost Mode Indicator     |
+-----------------------------------------------------------------------------------+
|                                                                                   |
|  INTERACTIVE WHITEBOARD CANVAS (Full Height, 120 FPS GPU Acceleration)            |
|                                                                                   |
|  [Tutor Participant Tile]                                                         |
|  - Animated TeacherCam (CSS-only 60 FPS compositor motion)                         |
|  - Active Speaker Green Outline (#34a853) & Sound-wave Equalizer                  |
|  - "AI Tutor" Tag                                                                 |
|  - Toggle visibility ON/OFF via Camera button                                      |
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
| Live Captions Overlay (Centered Subtitles: Student & Tutor speech)               |
+-----------------------------------------------------------------------------------+
| GOOGLE MEET BOTTOM CONTROL BAR (#202124)                                          |
| [12:00 PM | Lesson Title]  [Mic] [Cam] [CC] [Hand] [Present] [Zap Boost] [Leave] |
+-----------------------------------------------------------------------------------+
                                                                   |
                                          (Toggles from right) --> | [In-Call Messages]
                                                                   | - Call Disclaimer
                                                                   | - Message History
                                                                   | - Thinking Dots
                                                                   | - Slash Commands (/boost)
                                                                   | - Chat Composer
```

---

## 1. Modular Demo Classes (`src/classes/`)

Each lecture class is organized into its own dedicated, self-contained modular directory holding its codebase, vector assets, synchronized studio audio, canonical cover marks, and metadata:

```
src/classes/
├── index.ts                     # Central registry exporting all 4 classes & helpers
├── types.ts                     # TypeScript definitions for classes, scenes, and metadata
├── helpers.ts                   # Reusable SVG mark generation utilities
│
├── heart-diagram/               # Class 01: Human Heart & Double Circulation
│   ├── index.ts                 # Class entry point & complete definition
│   ├── board.ts                 # Whiteboard initial cover & 8 chapter scenes
│   ├── intelligence.ts          # 14 anatomical semantic regions & targets
│   ├── script.json              # Chapter narration, timestamps, cues, study notes
│   ├── README.md                # Class documentation
│   ├── assets/                  # High-res diagrams (four chambers, circulation, cardiac cycle)
│   └── audio/                   # 10-minute lecture audio (heart-diagram-v2.mp3)
│
├── circuit-diagram/             # Class 02: DC Electric Circuit
│   ├── index.ts                 # Class entry point & complete definition
│   ├── board.ts                 # Whiteboard initial cover & 4 chapter scenes
│   ├── intelligence.ts          # 5 circuit schematic semantic regions & targets
│   ├── script.json              # Chapter narration, timestamps, cues, study notes
│   ├── README.md                # Class documentation
│   ├── assets/                  # Vector circuit schematic (electric-circuit.svg)
│   └── audio/                   # 2-minute lecture audio (circuit-diagram-v2.mp3)
│
├── pythagoras/                  # Class 03: Pythagoras Theorem
│   ├── index.ts                 # Class entry point & complete definition
│   ├── board.ts                 # Whiteboard initial cover & 4 chapter scenes
│   ├── intelligence.ts          # Right-triangle geometry semantic regions & targets
│   ├── script.json              # Chapter narration, timestamps, cues, study notes
│   ├── README.md                # Class documentation
│   ├── assets/                  # Geometric diagram vector (pythagoras-triangle.svg)
│   └── audio/                   # 2-minute lecture audio (pythagoras-v2.mp3)
│
└── human-cell/                  # Class 04: Human Cell
    ├── index.ts                 # Class entry point & complete definition
    ├── board.ts                 # Whiteboard initial cover & 4 chapter scenes
    ├── intelligence.ts          # 6 organelle semantic regions & targets
    ├── script.json              # Chapter narration, timestamps, cues, study notes
    ├── README.md                # Class documentation
    ├── assets/                  # High-res cell anatomy & mitochondria diagrams
    └── audio/                   # 2-minute lecture audio (human-cell-v2.mp3)
```

- **Pristine Static Thumbnails**: Each class displays a static, canonical cover thumbnail that never gets contaminated by previous session drawing marks.
- **Interactive Preparation Hero**: When a class is selected, students see a clean overview hero card with class metadata and a prominent "Start Class" button that cleanly initiates lecture playback and audio streaming.

---

## 2. WebRTC Low-Latency Communication Architecture

Chalkly implements **WebRTC** (`RTCPeerConnection` and `RTCDataChannel`) with native browser-level peer connection and signaling support:

- **Dual-Peer WebRTC Architecture**:
  - The client initializes a primary `RTCPeerConnection` (Student) paired with a local AI Tutor Agent `RTCPeerConnection` endpoint.
  - Generates authentic, browser-native SDP offers and answers, performs true ICE candidate discovery, and completes DTLS/SCTP handshakes on the client.
- **Full-Duplex Media Tracks**:
  - **Audio Tracks**: Streams student speech from the microphone and attaches audio receivers.
  - **Video Tracks**: Screen-sharing transceivers dynamically attached/detached via the Google Meet Bar "Present" control.
- **Dedicated `RTCDataChannel` Multiplexing**:
  - `whiteboard-strokes`: Streams high-frequency pointer coordinates and whiteboard marks. In Boost Mode, operates across unordered 0-retransmit SCTP (`ordered: false`, `maxRetransmits: 0`) with zero buffer threshold (`bufferedAmountLowThreshold: 0`) for instant packet dispatch at up to 120 FPS.
  - `tutor-intelligence`: Carries pedagogical control events, instant barge-in interrupts (`speech_start`, `speech_end`), student visual doubt pinpoints (`doubt_point`), and tutor drawing mark sync.
  - `duplex-voice`: Telemetry and voice session signaling.
- **Signaling Gateway (`/api/live`)**:
  - Serves as an HTTP signaling relay for storing offers, answers, ICE candidate pools, and Boost Mode synchronization across sessions.

---

## 3. Student Voice-Only Mode

In live classrooms, students interact naturally through voice rather than complex drawing toolboxes:
- **Drawing Toolbar Hidden**: The bottom/side drawing toolboxes are hidden for students to prevent UI clutter and keep focus on the lesson.
- **Voice-Driven Interaction**: Students speak into their microphone to ask questions, interrupt the tutor (barge-in), or request clarification.
- **Visual Doubt Pinpoints**: Clicking or tapping on diagrams creates ephemeral pinpoint circles and coordinates sent over the WebRTC data channel, allowing the AI tutor to immediately identify what the student is pointing at and tailor the explanation.

---

## 4. Unified Student Learning Studio Environment

Qrie provides a focused, modern learning space centered entirely around the whiteboard and a single dedicated tutor persona—**Professor**:
- **Student Learning Control Bar (`src/components/GoogleMeetBar.tsx`)**:
  - **Left**: Current session / chapter title.
  - **Playback Controls**: Previous chapter, Play/Pause lecture, Next chapter, Exit lecture.
  - **Microphone (`Ctrl + d` / `M`)**: Instant speech input with live VAD meter; clicking during lecture immediately enters Doubt-Solving Mode.
  - **Captions (`c`)**: Toggle real-time closed captions with clear "Professor:" speaker tags.
  - **Playback Speed**: Cycle class narration speed seamlessly across `0.75x`, `1x`, `1.25x`, `1.5x`, and `2x`.
  - **Right Controls**: One-click toggle for the Unified Conversation Transcript & Discussion Panel.
  - *All meeting noise (clocks, fake camera tiles, hand-raising buttons, screen-sharing toggles, and leave-call departure modals) has been cleanly removed.*
- **Clean Whiteboard Canvas (`src/components/Whiteboard.tsx`)**:
  - Distraction-free, responsive vector canvas with visual diagram grounding and marker animation loop.
- **Unified Conversation Transcript (`src/components/SlidingChatPanel.tsx`)**:
  - Chronological lecture transcript combined with student Q&A, suggested questions, and real-time status indicators (*"Professor is thinking…"*, *"Professor is demonstrating on the whiteboard…"*) with author label **Professor**.
- **Live Captions Overlay (`src/components/LiveCaptionsOverlay.tsx`)**:
  - Clean floating subtitle banner indicating Professor verbal explanations and student speech.

---

## 5. Boost Mode & 120 FPS Hardware Acceleration

Boost Mode provides hardware-accelerated, zero-latency vector rendering and WebRTC data streaming:

1. **120 FPS GPU Compositor Pipeline**:
   - Applies `transform: translateZ(0)` and `contain: layout paint` to decouple the whiteboard from document reflows.
   - Isolates the 5 SVG layers (`assets`, `teacher-permanent`, `teacher-annotations`, `student`, and `overlays`), preventing repaint thrashing.
   - Smooths the marker cursor with sub-millisecond requestAnimationFrame transform interpolation.
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
5. **Activation Methods**:
   - **Meet Bar**: Click the `Zap` button in the Google Meet bottom bar.
   - **Topbar**: Click the `Boost` button in the workspace top bar.
   - **Keyboard Shortcut**: Press `Ctrl + B` (or `Cmd + B` / `Alt + B`).
   - **Slash Commands**: Type `/boost` (or `/boost on`, `/boost off`) in the in-call chat.
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
# TypeScript verification
npm run typecheck

# WebRTC and duplex voice suite (14 tests)
npx playwright test tests/webrtc-boost.spec.ts tests/duplex-voice.spec.ts

# Visual and studio regression suites
npx playwright test tests/studio.spec.ts tests/static-thumbnail-and-class-prep.spec.ts tests/visual-cell-sync.spec.ts tests/visual-heart-sync.spec.ts

# Run all Playwright test suites (115+ tests)
npx playwright test
```

All 115+ automated tests verify:
- WebRTC peer connections, SDP offer/answer negotiation, and high-frequency `RTCDataChannel` stroke streaming.
- Boost Mode GPU hardware acceleration, zero-latency seek, unordered SCTP packet transmission, and class switching without glitches.
- Four modular self-contained classes (`heart-diagram`, `circuit-diagram`, `pythagoras`, `human-cell`) with pristine static thumbnails.
- Student voice-only mode with drawing tools disabled and active microphone interaction.
- Google Meet control bar, sliding chat drawer, live captions overlay, and camera show/hide toggling.
- Audio clock playback, cue synchronization, chapter navigation, and offline caption fallbacks.
