# Qrie AI Whiteboard Platform: Master Architecture Blueprint

## Executive Summary

**Qrie** is a multimodal, real-time interactive AI whiteboard tutoring system designed for dynamic, asset-prepared educational delivery. Unlike scripted e-learning software or static video classrooms, Qrie pairs a **Canvas Intelligence Engine (CIE)**, a **Vision Perception & Precision Grounding Engine**, and a **Pedagogical State Machine** with a **Learner Adaptive Model (LAM)**, executing natural voice instruction alongside real-time semantic annotations, directional vector diagrams, and flowcharts. The learning experience is guided by a single unified academic tutor persona: **Professor**.

---

## 1. High-Level Architecture & End-to-End Data Flow

The platform is structured into decoupled, high-performance tiers running on Next.js 16 (App Router), React 19, Node.js 22, and PostgreSQL 17 via Drizzle ORM:

```
 +---------------------------------------------------------------------------------------+
 |                                  CLIENT LAYER (Web Browser)                           |
 |                                                                                       |
 |  +-----------------------+  +------------------------+  +--------------------------+  |
 |  | Whiteboard 5-Layer SVG|  | StudentLearningBar &   |  | Modular Class Packages   |  |
 |  | • Original Assets     |  | WebRTC Client          |  | • src/classes/*          |  |
 |  | • Professor Marks     |  | • RTCPeerConnection    |  | • human-cell             |  |
 |  | • Doubt Pinpoints     |  | • Audio Tracks         |  |                          |  |
 |  | • Voice-Only Student  |  | • RTCDataChannels:     |  |                          |  |
 |  | • 120 FPS GPU Boost   |  |   - whiteboard-strokes |  |                          |  |
 |  |                       |  |   - tutor-intelligence |  |                          |  |
 |  +-----------+-----------+  +-----------+------------+  +------------+-------------+  |
 +--------------|--------------------------|----------------------------|----------------+
                |                          |                            |
                | RTCDataChannel / WebRTC  | SDP Offer/Answer / ICE     | Modular Import
                v                          v                            v
 +---------------------------------------------------------------------------------------+
 |                                 NEXT.JS SERVER TIER                                   |
 |                                                                                       |
 |  [ /api/sessions ]        [ /api/live ]                 [ /api/curriculum ]           |
 |  • Session Management     • RFC-Compliant WebRTC SDP    • Subject / Chapter Taxonomy  |
 |  • Key Isolation Proxy    • ICE Candidate Registry      • Lesson Preparation Compiler |
 |                           • Boost Mode State Sync                                     |
 |                                                                                       |
 |  [ /api/tutor ]           [ /api/vision ]               [ /api/lam ]                  |
 |  • Professor Orchestrator • Diagram Understanding Engine• Bayesian Knowledge Tracing  |
 |  • Pedagogy Directives    • OCR & Label Extraction      • Concept Mastery Profile     |
 |  • CIE Mark Dispatcher    • Spatial Coordinate Grounding• Remedial Scaffolding Alerts |
 +--------------+--------------------------+----------------------------+----------------+
                |                          |                            |
                v                          v                            v
 +-------------------------------------+   +---------------------------------------------+
 |     CANVAS INTELLIGENCE ENGINE      |   |              PERSISTENCE TIER               |
 |  • Geometry Normalization           |   |                                             |
 |  • Polygon & Anchor Pin Tracking    |   |  PostgreSQL 17 Database:                    |
 |  • Collision-Free Flowchart Engine  |   |  • chalkly_study_sessions                   |
 |  • Vision Grounding Coordinate Calc |   |  • chalkly_learner_mastery                  |
 +-------------------------------------+   +---------------------------------------------+
```

---

## 2. Canvas Intelligence Core (CIE) & 5-Layer Canvas Architecture

The whiteboard renderer strictly separates concerns into five distinct DOM SVG layers:

1. **`assets` (Original Visual Assets)**: Read-only raster and SVG diagrams (e.g., Human Heart, DC Electric Circuit, Human Cell). Teacher and student actions strictly never erase, overwrite, or mutate this layer.
2. **`teacher-permanent`**: Enduring foundational whiteboard landmarks, coordinate grids, and diagram frames.
3. **`teacher-annotations`**: Dynamic professor demonstration marks—vector arrows, polygon chamber highlights, bounding boxes, labels, and flowcharts.
4. **`student`**: Student ink drawings, freehand notes, and practice answers. Protected by security policies so teacher actions cannot delete student work.
5. **`overlays`**: Ephemeral student doubt sketches, laser pinpoints, and temporary visual callouts.

### Coordinate Transformation Pipeline

Visual assets have diverse natural dimensions (e.g., Human Heart $475 \times 526$, DC Circuit $540 \times 320$, Human Cell $430 \times 270$). The CIE maps natural asset coordinates into the standard $1000 \times 330$ whiteboard viewport using scale factors:

$$s_x = \frac{W_{\text{display}}}{W_{\text{natural}}}, \quad s_y = \frac{H_{\text{display}}}{H_{\text{natural}}}$$

$$x_{\text{canvas}} = X_{\text{display}} + x_{\text{orig}} \cdot s_x, \quad y_{\text{canvas}} = Y_{\text{display}} + y_{\text{orig}} \cdot s_y$$

### Boost Mode & WebRTC Real-Time Compositor Pipeline

Boost Mode accelerates the 5-layer whiteboard rendering pipeline to 120 FPS and optimizes WebRTC data transport:
- **Zero-Latency Layer Compositing**: Each layer (`assets`, `teacher-permanent`, `teacher-annotations`, `student`, `overlays`) is assigned a dedicated GPU compositor backing (`transform: translateZ(0)`, `contain: layout paint`).
- **Automatic Background Acceleration**: Enabled by default (`data-boost-mode="true"`) to ensure 120 FPS rendering across high-refresh displays without requiring manual student action.
- **Unordered SCTP Data Channels**: The `whiteboard-strokes` WebRTC data channel switches to `ordered: false` with `maxRetransmits: 0` and `bufferedAmountLowThreshold: 0` for instantaneous packet flush without head-of-line blocking.
- **Continuous Monotonic Clock**: Interpolates smooth SVG vector positions between discrete HTML5 audio ticks.
- **Subpixel Antialiasing**: Maintains `shape-rendering: geometricPrecision` and `text-rendering: optimizeLegibility` across Retina and high-DPI viewports.

---

## 3. Vision Perception & Precision Grounding Subsystem (`src/lib/vision/`)

To enable the AI tutor to visually inspect diagrams and accurately annotate specific regions, Qrie incorporates a dedicated vision subsystem:

- **Diagram Domain Classifier (`diagram-understanding.ts`)**: Classifies whether a diagram represents biological anatomy, circuit schematics, geometric proofs, cellular structures, or process flowcharts.
- **OCR Label Extractor (`ocr.ts`)**: Detects textual labels and formula symbols on the board to prevent text-diagram overlap.
- **Scene Graph Resolver (`scene-graph.ts`)**: Constructs semantic connections between components (e.g., *battery $\to$ switch $\to$ resistor* or *vena cava $\to$ right atrium $\to$ tricuspid valve*).
- **Coordinate Grounding Engine (`grounding.ts`)**: Calculates accurate bounding boxes and normalized coordinates so annotations align with diagram components with zero overlap.
- **Visual Memory Cache (`visual-cache.ts`)**: Caches processed scene graphs and bounds for instant retrieval during live voice turns.
- **REST Vision Endpoint (`/api/vision`)**: Exposes visual feature detection and boundary verification for live classroom turns, verified by 20 passing Playwright tests.

---

## 4. Modular Class Packages & Reusable Asset Pipeline

Classes in Qrie are organized into self-contained modular packages in `src/classes/`:
- **`human-cell`**: The Human Cell (6 organelle landmarks: Nucleus, Mitochondria, Ribosomes, ER, Golgi, Cell Membrane).

The package houses its own code, board scenes, canonical cover thumbnail, intelligence targets, audio files, and script metadata.

---

## 5. Spatial Intelligence & Dynamic Flowchart Generation Engine (`src/lib/spatial/`)

Ported to native TypeScript under `src/lib/spatial/`, the spatial engine provides:
- **Collision-Free Slotting**: Calculates horizontal and vertical bounds, applying sequential vertical step-downs ($\Delta y = 75\text{px}$) to prevent overlap with diagrams and labels.
- **Dynamic Text Scaling**: Dynamically expands box geometry if node titles exceed default dimensions.
- **Directional Connectors**: Renders SVG paths with markers (`marker-end="url(#arrow)"`), supporting cyclical pathways (e.g., pulmonary circulation).

---

## 6. WebRTC Full-Duplex Media & Student Interruption Architecture

Live interaction incorporates WebRTC `RTCPeerConnection`, dual `RTCDataChannel` pipelines, and student voice-only mode:
- **Dual-Peer WebRTC Architecture**:
  - The browser initializes an `RTCPeerConnection` for the student paired with an in-browser AI Tutor Agent `RTCPeerConnection` endpoint.
  - Generates authentic native SDP offers and answers, performs true ICE candidate discovery, and completes DTLS/SCTP handshakes directly on the browser client.
- **WebRTC Full-Duplex Audio**:
  - Bi-directional audio tracks (`addAudioTrack()`, `onRemoteAudioTrack`) for natural voice conversation.
  - Real-time Voice Activity Detection (VAD) detects speech immediately, triggering graceful pause at sentence boundaries.
- **Dedicated Data Channels**:
  - `whiteboard-strokes`: 120 FPS high-frequency stroke and cursor coordinates operating across unordered 0-retransmit SCTP in Boost Mode.
  - `tutor-intelligence`: Conversational interrupts, doubt pinpoint signals, and Professor marks.
  - `duplex-voice`: Telemetry and speech event synchronization.
- **Signaling Gateway (`/api/live`)**:
  - Acts as an HTTP signaling relay for storing and exchanging offers, answers, and ICE candidate pools across sessions.

---

## 7. Pedagogical State Machine & Unified AI Tutor Identity

The classroom engine executes a deterministic 5-stage pedagogical state machine:
1. **`INTRODUCE`**: Frame learning objectives and real-world relevance.
2. **`VISUAL_DEMO`**: CIE triggers visual highlights, chamber fills, and flow vectors.
3. **`CHECKPOINT`**: Socratic conceptual check verifying core principles.
4. **`EVALUATE_AND_REMEDIATE`**: Detects student misconceptions and targets visual remediation.
5. **`SYNTHESIS`**: Summarizes key takeaways and connects to advanced topics.

### Single AI Tutor Identity: Professor

To provide an authoritative, patient, and consistent educational environment, Qrie establishes **Professor** as the single default tutor persona:
- **Scholarly & Rigorous**: Employs accurate academic terminology, clear quantitative steps, and visual proofs.
- **Adaptive Scaffolding**: Automatically integrates Socratic questioning when students are uncertain and provides step-by-step hints when misconceptions are detected.
- **Consistent Voice & Presence**: Displays clear `"Professor:"` speaker tags in live captions, transcripts, and status indicators.

---

## 8. Learner Adaptive Model (LAM) & Bayesian Knowledge Tracing

Student understanding is tracked longitudinally via Bayesian Knowledge Tracing (BKT) stored in PostgreSQL (`chalkly_learner_mastery`):

$$\text{Posterior: } P(L_t \mid \text{Correct}) = \frac{P(L_{t-1}) \cdot (1 - P(S))}{P(L_{t-1}) \cdot (1 - P(S)) + (1 - P(L_{t-1})) \cdot P(G)}$$

$$\text{Next Prior: } P(L_{t+1}) = P(L_t \mid \text{Obs}) + (1 - P(L_t \mid \text{Obs})) \cdot P(T)$$

Where:
- Prior $P(L_0) = 0.35$
- Learning transit $P(T) = 0.12$
- Guess probability $P(G) = 0.15$
- Slip probability $P(S) = 0.08$

The LAM compiles student profiles into **Active Cognitive Directives**, automatically adjusting LLM prompts and deterministic fallbacks to remediate active misconceptions before introducing advanced topics.

---

## 9. Runtime Doubt Resolution & Whiteboard Preservation Architecture

The interactive learning experience allows students to interrupt a running or paused lecture at any timestamp via voice mic to ask questions without disrupting the visual state:

- **Whiteboard Element & Stroke Preservation**:
  - In `src/components/Studio.tsx`, premature `closeClass()` execution is strictly prevented when questions are asked during a paused or running lecture.
  - The lesson key reference (`prevLessonKeyRef`) ensures that `closeClass()` is only triggered when explicitly switching between distinct lessons, guaranteeing whiteboard diagrams, progressive ink strokes, and lesson progress remain 100% stable without being wiped or reset.
- **Voice-First Minimalist Doubt Resolution**:
  - When doubts are resolved during active lectures, the tutor responds concisely in 2–3 spoken sentences, keeping the whiteboard elements array empty (`elements: []`). This preserves existing diagram annotations and avoids cluttering the visual learning stage.
- **Real-Time Voice Feedback & Audio Fallback Pipeline**:
  - Synthesizes dynamic speech via server-side `/api/tts` with an optimized 4500ms timeout.
  - If server synthesis exceeds the timeout, experiences network latency, or hits rate limits, the client instantly falls back to browser speech synthesis (`window.speechSynthesis`) with phonetic brand pronunciation ("Curie" / "क्यूरी").
  - The tutor never falls silent, ensuring continuous student engagement.

---

## 10. Enterprise Cloud AI & Production Typography Infrastructure

- **Google Cloud Vertex AI & Enterprise Agent Platform Integration**:
  - First-class support for `USE_VERTEX_AI=true`, routing requests to `${location}-aiplatform.googleapis.com` under `GOOGLE_CLOUD_PROJECT` and `GOOGLE_CLOUD_REGION`.
  - Supports Bearer token authentication (`VERTEX_BEARER_TOKEN`, `GOOGLE_ACCESS_TOKEN`, or OAuth `ya29.` tokens) alongside `X-Goog-Api-Key` headers.
  - Bi-directional fallback between Vertex AI and Google AI Studio: automatically switches to the alternative provider upon encountering HTTP 402, 403, or 404 responses.
  - Automatic HTTP 402 prepayment credit recovery: if project prepayment credits are depleted, Professor answers instantly using built-in curriculum intelligence, suppressing disruptive technical model error toasts during live classroom instruction.
- **Production Typography & Hand-Drawn Font Resilience**:
  - Resolved CSS invalid-at-computed-value fallback for `--font-caveat` in `globals.css` (`font-family: var(--font-caveat, 'Caveat Variable'), 'Caveat Variable', cursive`).
  - Ensures production SVG text and blackboard equations correctly render in the Caveat handwriting font across all target platforms and browsers.

---

## 11. Query Resolver Topic Relevance Verification Engine & Unified Persona Architecture (v2.2)

Version 2.2 introduces the **Query Resolver Topic Relevance Verification Engine** (`src/lib/curriculum-answers.ts` and `src/app/api/tutor/route.ts`), which acts as an intelligent pedagogical filter and context-aware doubt resolver during active classroom instruction:

### A. Multi-Dimensional Relevance Verification Matrix
Before processing a student interruption inquiry, the Query Resolver evaluates a multi-factor relevance matrix:
1. **Interactive Classroom Cues**:
   - Universal clarification and repetition cues (*"repeat"*, *"again"*, *"what did you say"*, *"didn't understand"*, *"explain this"*, *"yeh kya hai"*, *"samjhao"*) are guaranteed immediate relevance.
2. **Visual & Whiteboard Awareness**:
   - Inquiries referencing on-screen visual elements (*"What is that green border?"*, *"Why is there a red circle in the center?"*, *"Explain bullet point 4: Protein Factory"*, *"What does the arrow point to?"*, *"What is written next to number 3?"*) are directly recognized as in-scope.
3. **Dynamic Whiteboard & Region Inspection**:
   - Context is dynamically compiled from the live stage: `context.currentMarks` (SVG text and image alt descriptions) and `context.currentRegions` (landmarks, labels, and aliases). Newly rendered diagram labels or formulas are immediately available to the relevance validator.
4. **Curriculum & Concept Flow Progression**:
   - Understands curriculum context beyond just the current 30-second timestamp: questions regarding prerequisites, next slides, class agenda, or related comparative concepts (e.g. comparing plant cell walls to animal cell membranes) are validated as relevant.
5. **Explicit Off-Topic Filtration**:
   - Intercepts inquiries unrelated to the academic subject (e.g., cricket/football scores, movies, actors, recipes, video games, weather, politics).

### B. Polite Teacher Deferral & Seamless Auto-Resume
When an off-topic query is detected:
- **Pedagogical Deferral Tone**: The AI tutor does not produce a harsh error or abrupt silence. Instead, Professor gently acknowledges the curiosity and explains the need to maintain focus on the active topic, offering to discuss the off-topic subject after class.
- **Multilingual Deferral**: Spoken and caption-rendered deferrals are localized into English, Devanagari Hindi, or conversational Hinglish.
- **Whiteboard Visual Preservation**: Deferrals return an empty elements array (`elements: []`), guaranteeing that no diagram elements, progressive ink marks, or student notes are erased or modified.
- **Automated Lecture Restoration**: The client automatically triggers `resumeLectureFromDoubt()`, resuming narration and vector animations from the exact pause point without requiring manual student intervention.

### C. Voice & Persona Unification (Aoede)
- Both the **Class AI Teacher** (delivering structured lectures) and the **Query Resolver** (handling student live doubts and interactive turns) use the identical neural voice **Aoede** and identical pedagogical persona (**Professor**).
- Eliminates acoustic dissonance and preserves educator rapport across lectures, live speech interruptions, and chat-based Q&A.
