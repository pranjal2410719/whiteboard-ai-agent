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
 |  | • Professor Marks     |  | • RTCPeerConnection    |  | • heart-diagram          |  |
 |  | • Doubt Pinpoints     |  | • Audio Tracks         |  | • circuit-diagram        |  |
 |  | • Voice-Only Student  |  | • RTCDataChannels:     |  | • pythagoras             |  |
 |  | • 120 FPS GPU Boost   |  |   - whiteboard-strokes |  | • human-cell             |  |
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

Classes in Qrie are organized into four canonical, self-contained modular packages in `src/classes/`:
- **`heart-diagram`**: Human Heart & Double Circulation (14 landmarks, 4 chambers, vascular loops, 10-minute audio, 8 chapter scenes).
- **`circuit-diagram`**: DC Electric Circuit (5 circuit regions, battery, switch, resistor, capacitor, schematic vector).
- **`pythagoras`**: Pythagoras Theorem (right-triangle geometry, square areas, algebraic proofs).
- **`human-cell`**: The Human Cell (6 organelle landmarks: Nucleus, Mitochondria, Ribosomes, ER, Golgi, Cell Membrane).

Each package houses its own code, board scenes, canonical cover thumbnail, intelligence targets, audio files, and script metadata.

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
