# Qrie Codebase Audit: Architecture, Gaps & Resolutions

> **Status:** All historical architectural gaps have been **100% resolved and verified**. For current specifications, refer to [docs/MASTER_ARCHITECTURE.md](docs/MASTER_ARCHITECTURE.md), [docs/CLASS_AND_TUTOR_ARCHITECTURE.md](docs/CLASS_AND_TUTOR_ARCHITECTURE.md), and [FINAL_PROJECT_COMPLETION_REPORT.md](FINAL_PROJECT_COMPLETION_REPORT.md).

---

## 1. System Architecture Overview

The platform is a unified, high-performance TypeScript application running on Next.js 16 (App Router), React 19, and PostgreSQL 17:

```mermaid
flowchart TD
    subgraph ClientBrowser ["Browser Client (Next.js 16 + React 19)"]
        UI["Studio App Shell"]
        Whiteboard["SVG Vector Whiteboard (1000x330)"]
        AudioPlayer["Lecture Audio & Cues Hook"]
        LearningBar["Student Learning Control Bar"]
        SpeechIn["Web Speech API + VAD"]
        TranscriptPanel["Unified Conversation Transcript"]
    end

    subgraph NextServer ["Next.js Server (Node.js App Router)"]
        TutorRoute["POST /api/tutor (Professor Persona)"]
        VisionRoute["POST /api/vision (Vision Grounding Engine)"]
        TTSRoute["POST /api/tts (Gemini TTS / Browser Fallback)"]
        SessionRoute["/api/sessions (CRUD)"]
        LiveRoute["/api/live (WebRTC Relay)"]
        LAMRoute["/api/lam (Bayesian Knowledge Tracing)"]
    end

    subgraph DatabaseLayer ["PostgreSQL 17 (Port 5433)"]
        Drizzle["Drizzle ORM"]
        SessionsTable[("chalkly_study_sessions")]
        MasteryTable[("chalkly_learner_mastery")]
    end

    subgraph ExternalAI ["External AI Providers"]
        GeminiAPI["Google Gemini 2.5 Flash / Pro"]
        VertexTTS["Gemini TTS"]
    end

    UI --> Whiteboard
    UI --> AudioPlayer
    UI --> LearningBar
    UI --> SpeechIn
    UI --> TranscriptPanel

    SpeechIn -->|Transcribed Text| TutorRoute
    TranscriptPanel -->|User Query| TutorRoute
    Whiteboard -->|Diagram Snapshot| VisionRoute
    AudioPlayer -->|Playback State| UI
    TutorRoute --> GeminiAPI
    TutorRoute --> SessionRoute
    UI --> TTSRoute
    TTSRoute --> VertexTTS
    SessionRoute --> Drizzle
    Drizzle --> SessionsTable
    Drizzle --> MasteryTable
```

---

## 2. Historical Gap Resolution Matrix

| Historical Gap | Root Cause | Resolution Implemented | Verification Proof |
|---|---|---|---|
| **Gap 1: Python-Web Disconnect** | Standalone Python spatial engine targeted external Excalidraw server on port 3000. | Ported all geometric algorithms, bounding box calculations, collision avoidance, and flowchart layout logic to native TypeScript under `src/lib/spatial/`. | `tests/spatial.spec.ts` (14/14 passed). |
| **Gap 2: Duplex Voice & VAD** | Lack of WebRTC signaling and real-time Voice Activity Detection. | Implemented WebRTC `RTCPeerConnection` and dual `RTCDataChannel` architecture (`whiteboard-strokes`, `tutor-intelligence`) with Web Audio VAD in `src/lib/duplex-voice.ts`. | `tests/duplex-voice.spec.ts` (5/5 passed), `tests/webrtc-boost.spec.ts` (11/11 passed). |
| **Gap 3: Missing Curriculum Taxonomy** | Flat catalog with no hierarchical Subject $\to$ Chapter $\to$ Topic selection. | Implemented `src/lib/curriculum/` taxonomy and 3-step interactive selector bundling prerequisite assets and concepts. | `tests/curriculum-preparation.spec.ts` (6/6 passed). |
| **Gap 4: Monolithic Database** | Single JSONB column lacking longitudinal student mastery tracking. | Added Learner Adaptive Model (`chalkly_learner_mastery`) table with Bayesian Knowledge Tracing persistence. | `tests/learner-adaptive-model.spec.ts` (4/4 passed). |
| **Gap 5: Meeting Feature Overhead** | Distracting meeting UI (camera tile, screen share, hand raise, meeting clocks, leave call modal). | Removed meeting clutter; created clean Student Learning Bar and established single **Professor** tutor persona. | `tests/all-classes-voice-sync-annotations.spec.ts` (4/4 passed). |
| **Gap 6: Diagram Vision & Alignment** | AI tutor lacked spatial vision to ground annotations to diagrams on the board. | Built Vision Perception & Precision Grounding Engine (`src/lib/vision/`, `/api/vision`) with OCR label extraction, boundary grounding, and scene graph resolution. | `tests/vision-grounding.spec.ts` (20/20 passed). |

---

## 3. Current System State

- **Branch**: `main`
- **Active Tests**: 115+ automated tests passing with 0 failures
- **Production Readiness**: 100% verified across Next.js 16, PostgreSQL 17, and WebRTC
