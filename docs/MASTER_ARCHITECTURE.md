# Qrie AI Whiteboard Platform: Master Architecture Blueprint

## Executive Summary

**Qrie** is a multimodal, real-time interactive AI whiteboard tutoring system designed for dynamic, asset-prepared educational delivery. Unlike scripted e-learning software or static video classrooms, Qrie pairs a **Canvas Intelligence Engine (CIE)** and a **Pedagogical State Machine** with a **Learner Adaptive Model (LAM)**, executing natural voice instruction alongside real-time semantic annotations, directional vector diagrams, and flowcharts.

---

## 1. High-Level Architecture & End-to-End Data Flow

The platform is structured into decoupled, high-performance tiers running on Next.js 16 (App Router), React 19, Node.js 22, and PostgreSQL 17 via Drizzle ORM:

```
 +---------------------------------------------------------------------------------------+
 |                                  CLIENT LAYER (Web Browser)                           |
 |                                                                                       |
 |  +-----------------------+  +------------------------+  +--------------------------+  |
 |  | Whiteboard 5-Layer SVG|  | GoogleMeetBar & WebRTC |  | Modular Class Packages   |  |
 |  | • Original Assets     |  | • RTCPeerConnection    |  | • src/classes/*          |  |
 |  | • Teacher Annotations |  | • Audio/Video Tracks   |  | • heart-diagram          |  |
 |  | • Doubt Pinpoints     |  | • RTCDataChannels:     |  | • circuit-diagram        |  |
 |  | • Voice-Only Student  |  |   - whiteboard-strokes |  | • pythagoras             |  |
 |  | • 120 FPS GPU Boost   |  |   - tutor-intelligence |  | • human-cell             |  |
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
 |  [ /api/tutor ]                                         [ /api/lam ]                  |
 |  • Teaching Orchestrator                                • Bayesian Knowledge Tracing  |
 |  • Persona Directives Injection                         • Concept Mastery Profile     |
 |  • CIE Mark Dispatcher                                  • Remedial Scaffolding Alerts |
 +--------------+-------------------------------------------------------+----------------+
                |                                                       |
                v                                                       v
 +-------------------------------------+       +-----------------------------------------+
 |     CANVAS INTELLIGENCE ENGINE      |       |          PERSISTENCE TIER               |
 |  • Geometry Normalization           |       |                                         |
 |  • Polygon & Anchor Pin Tracking    |       |  PostgreSQL 17 Database:                |
 |  • Collision-Free Flowchart Engine  |       |  • chalkly_study_sessions               |
 |  • Action Validator & Debounce      |       |  • chalkly_learner_mastery              |
 +-------------------------------------+       +-----------------------------------------+
```

---

## 2. Canvas Intelligence Core (CIE) & 5-Layer Canvas Architecture

The whiteboard renderer strictly separates concerns into five distinct DOM SVG layers:

1. **`assets` (Original Visual Assets)**: Read-only raster and SVG diagrams (e.g., Human Heart, DC Electric Circuit). Teacher and student actions strictly never erase, overwrite, or mutate this layer.
2. **`teacher-permanent`**: Enduring foundational whiteboard landmarks, coordinate grids, and diagram frames.
3. **`teacher-annotations`**: Dynamic teacher demonstration marks—vector arrows, polygon chamber highlights, bounding boxes, labels, and flowcharts.
4. **`student`**: Student ink drawings, freehand notes, and practice answers. Protected by security policies so teacher actions cannot delete student work.
5. **`overlays`**: Ephemeral student doubt sketches, laser pointers, and WebRTC screen-sharing backdrops.

### Coordinate Transformation Pipeline

Visual assets have diverse natural dimensions (e.g., Human Heart $475 \times 526$, DC Circuit $540 \times 320$). The CIE maps natural asset coordinates into the standard $1000 \times 330$ whiteboard viewport using scale factors:

$$s_x = \frac{W_{\text{display}}}{W_{\text{natural}}}, \quad s_y = \frac{H_{\text{display}}}{H_{\text{natural}}}$$

$$x_{\text{canvas}} = X_{\text{display}} + x_{\text{orig}} \cdot s_x, \quad y_{\text{canvas}} = Y_{\text{display}} + y_{\text{orig}} \cdot s_y$$

### Boost Mode & WebRTC Real-Time Compositor Pipeline

Boost Mode accelerates the 5-layer whiteboard rendering pipeline to 120 FPS and optimizes WebRTC data transport:
- **Zero-Latency Layer Compositing**: Each layer (`assets`, `teacher-permanent`, `teacher-annotations`, `student`, `overlays`) is assigned a dedicated GPU compositor backing (`transform: translateZ(0)`, `contain: layout paint`).
- **Unordered SCTP Data Channels**: The `whiteboard-strokes` WebRTC data channel switches to `ordered: false` with `maxRetransmits: 0` and `bufferedAmountLowThreshold: 0` for instantaneous packet flush without head-of-line blocking.
- **Continuous Monotonic Clock**: Interpolates smooth SVG vector positions between discrete HTML5 audio ticks.
- **Subpixel Antialiasing**: Maintains `shape-rendering: geometricPrecision` and `text-rendering: optimizeLegibility` across Retina and high-DPI viewports.
- **Interactive Control**: Toggleable via Google Meet Bar (`Zap` icon), workspace top bar, `Ctrl + B` keyboard shortcut, or `/boost` chat command. (See [docs/BOOST_MODE_AND_PERFORMANCE.md](BOOST_MODE_AND_PERFORMANCE.md)).

---

## 3. Modular Class Packages & Reusable Asset Pipeline

Classes in Chalkly are organized into four canonical, self-contained modular packages in `src/classes/`:
- **`heart-diagram`**: Human Heart & Double Circulation (14 landmarks, 4 chambers, vascular loops, 10-minute audio, 8 chapter scenes).
- **`circuit-diagram`**: DC Electric Circuit (5 circuit regions, battery, switch, resistor, capacitor, schematic vector).
- **`pythagoras`**: Pythagoras Theorem (right-triangle geometry, square areas, algebraic proofs).
- **`human-cell`**: The Human Cell (6 organelle landmarks: Nucleus, Mitochondria, Ribosomes, ER, Golgi, Cell Membrane).

Each package houses its own code, board scenes, canonical cover thumbnail, intelligence targets, audio files, and script metadata.

### Element Verification & Safety Policy

Every landmark maintains explicit verification metadata:
- `verificationStatus`: `"verified"` | `"tentative"` | `"unverified"`
- `confidence`: $0.0 \dots 1.0$
- Actions on unverified elements are rejected by `ActionValidator` unless explicit administrator bypass is provided.

---

## 4. Spatial Intelligence & Dynamic Flowchart Generation Engine

When teaching procedural or causal concepts, the CIE activates the Flowchart Engine:
- **Collision-Free Slotting**: Calculates horizontal and vertical bounds, applying sequential vertical step-downs ($\Delta y = 75\text{px}$) to prevent overlap with diagrams.
- **Dynamic Text Scaling**: Dynamically expands box geometry if node titles exceed default dimensions.
- **Directional Connectors**: Renders SVG paths with markers (`marker-end="url(#arrow)"`), supporting cyclical pathways (e.g., pulmonary circulation).

---

## 5. WebRTC Full-Duplex Media & Student Interruption Architecture

Live interaction incorporates WebRTC `RTCPeerConnection`, dual `RTCDataChannel` pipelines, and student voice-only mode:
- **WebRTC Full-Duplex Audio & Screen Share**:
  - Bi-directional audio tracks (`addAudioTrack()`, `onRemoteAudioTrack`) for natural voice conversation.
  - Video screen-share track attachments directly controlled via the Google Meet Bar.
- **Dedicated Data Channels**:
  - `whiteboard-strokes`: 120 FPS high-frequency stroke and cursor coordinates.
  - `tutor-intelligence`: Conversational interrupts, doubt pinpoint signals, and AI tutor marks.
- **RFC-Compliant Signaling (`/api/live`)**:
  - WebRTC SDP offer/answer negotiation with BUNDLE and `a=rtcp-mux`, DTLS fingerprinting, and ICE candidate exchange.
- **Student Voice-Only Mode**:
  - Drawing toolbar is hidden for students to prevent distraction.
  - Interaction occurs via natural microphone speech and ephemeral doubt pinpoint clicks on diagrams.
- **Sentence-Boundary Synchronization**: If interruption occurs during an explanation, pauses at the nearest semantic sentence punctuation boundary.

---

## 6. Pedagogical State Machine & Teaching Personas

The classroom engine executes a deterministic 5-stage pedagogical state machine:
1. **`INTRODUCE`**: Frame learning objectives and real-world relevance.
2. **`VISUAL_DEMO`**: CIE triggers visual highlights, chamber fills, and flow vectors.
3. **`CHECKPOINT`**: Socratic conceptual check verifying core principles.
4. **`EVALUATE_AND_REMEDIATE`**: Detects student misconceptions and targets visual remediation.
5. **`SYNTHESIS`**: Summarizes key takeaways and connects to advanced topics.

### 4 Dynamic Teaching Personas
- **Socratic**: Questions first, guides student intuition with targeted hints.
- **Mentor**: Encouraging, step-by-step scaffolding with visual analogies.
- **Professor**: Formal terminology, quantitative derivations, and rigorous proofs.
- **Peer**: Conversational, relatable intuition and collaborative problem-solving.

---

## 7. Learner Adaptive Model (LAM) & Bayesian Knowledge Tracing

Student understanding is tracked longitudinally via Bayesian Knowledge Tracing (BKT) stored in PostgreSQL (`chalkly_learner_mastery`):

$$\text{Posterior: } P(L_t \mid \text{Correct}) = \frac{P(L_{t-1}) \cdot (1 - P(S))}{P(L_{t-1}) \cdot (1 - P(S)) + (1 - P(L_{t-1})) \cdot P(G)}$$

$$\text{Next Prior: } P(L_{t+1}) = P(L_t \mid \text{Obs}) + (1 - P(L_t \mid \text{Obs})) \cdot P(T)$$

Where:
- Prior $P(L_0) = 0.35$
- Learning transit $P(T) = 0.12$
- Guess probability $P(G) = 0.15$
- Slip probability $P(S) = 0.08$

The LAM compiles student profiles into **Active Cognitive Directives**, automatically adjusting LLM prompts and deterministic fallbacks to remediate active misconceptions before introducing advanced topics.
