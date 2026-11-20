# Qrie Codebase Audit: Executive Summary & Immediate Next Steps

> **Auditor:** Senior Software Architect & Technical Lead  
> **Repository:** `whiteboard-ai-agent` (Qrie · AI Classroom)  
> **Date:** November 20, 2026

---

## 1. Executive Summary & Current Project Position

The Qrie repository possesses an exceptionally strong foundation: a high-performance **SVG vector whiteboard with live stroke interpolation**, an authentic **Google Meet bottom control bar**, **pre-recorded lecture playback with cue synchronization**, an active **hand-raise doubt-solving interruption workflow**, and a **rich anatomical/physics asset catalog**.

### 1.1 Completion Status Breakdown
- **Fully Implemented & Verified (50.0%):**
  - Google Meet bottom control bar with call controls, status indicators, and leave call dialog.
  - SVG vector whiteboard with handwriting simulation loop and stroke sampling.
  - Student drawing layer with isolated undo/redo that preserves teacher marks.
  - Demo lecture playback with scrub bar, chapter skip, and cue-synchronized board reveals.
  - Multilingual support for Hindi (Devanagari) and Hinglish (Roman Hindi).
  - PostgreSQL 17 session persistence via Drizzle ORM.
  - Standalone Python spatial awareness & flowchart engine (60 unit tests passing).
- **Partially Implemented (16.7%):**
  - Hand-raise doubt-solving during demo lectures (pauses audio and injects lecture context, but pauses instantly rather than at sentence boundaries).
  - New Session creation (flat guided buttons and open text box exist, but lacks 3-level Subject -> Chapter -> Topic hierarchical taxonomy).
  - Speech-to-Text (client Web Speech API works, but lacks server-side fallback).
  - AI Teaching Orchestrator (request/response turn loop works, but lacks multi-stage pedagogical state machine).
- **Not Started (20.8%):**
  - Learner Adaptive Model (LAM) and student mastery tracking.
  - Multi-user authentication and persistent user profiles.
  - Asset pre-rendering pipeline for arbitrary custom topics.
  - Duplex WebSocket voice streaming (Gemini Multimodal Live API).
- **Broken / Missing Assets (4.2%):**
  - `heart-diagram-v2.mp3` audio file is missing from `public/class-audio/`, forcing browser speech synthesis fallback.
- **Standalone Unintegrated (12.5%):**
  - Python Excalidraw agent (`whiteboard_tutor_agent/`) is fully functional in isolation but not yet wired to the Next.js SVG whiteboard.

---

## 2. Most Critical Architectural Gaps

1. **The Subsystem Disconnect:** The Python spatial context and flowchart engine exists and is tested, but targets an external Excalidraw server instead of feeding the Next.js SVG whiteboard.
2. **Missing Hierarchical Curriculum Engine:** The Web Platform lacks the Subject -> Chapter -> Topic database that prepares mandatory concepts and visual diagrams before class entry.
3. **Monolithic JSONB Database:** All session data is serialized into a single JSONB blob in PostgreSQL, causing write amplification and preventing cross-session student analytics.
4. **Absence of LAM:** The tutor retains no memory of student strengths, weaknesses, or misconceptions across sessions.

---

## 3. What Should NOT Be Rebuilt

To prevent redundant engineering and wasted development cycles, **do NOT rebuild the following modules**:

1. **Do NOT rebuild the Whiteboard Rendering Engine ([`src/components/Whiteboard.tsx`](file:///home/vscode-gcp/projects/qrie_tutors/test06/ai-whiteboard-tutor-platform%20(1)/src/components/Whiteboard.tsx)):**
   - The SVG vector stage with stroke sampling, point interpolation, handwriting animation loop, and mobile layout stacking is production-grade, highly optimized, and verified with 8 passing E2E Playwright tests.
2. **Do NOT rebuild the Google Meet Control Bar ([`src/components/GoogleMeetBar.tsx`](file:///home/vscode-gcp/projects/qrie_tutors/test06/ai-whiteboard-tutor-platform%20(1)/src/components/GoogleMeetBar.tsx)):**
   - The layout, styling, tooltips, responsive collapsing, unread chat badges, and control states match Google Meet.
3. **Do NOT rebuild the Diagram Asset Mapping Engine ([`src/lib/assets.ts`](file:///home/vscode-gcp/projects/qrie_tutors/test06/ai-whiteboard-tutor-platform%20(1)/src/lib/assets.ts), [`src/lib/annotate.ts`](file:///home/vscode-gcp/projects/qrie_tutors/test06/ai-whiteboard-tutor-platform%20(1)/src/lib/annotate.ts)):**
   - The 5 bundled diagrams and 32 precision coordinate regions (membrane, nucleus, mitochondria, ventricles, valves, inclined plane, etc.) work accurately.
4. **Do NOT rebuild the Spatial Arithmetic Algorithms ([`whiteboard_tutor_agent/spatial_context.py`](file:///home/vscode-gcp/projects/qrie_tutors/test06/ai-whiteboard-tutor-platform%20(1)/whiteboard_tutor_agent/spatial_context.py)):**
   - The bounding-box math, collision avoidance, and flowchart routing algorithms are already designed and pass 60 unit tests. Simply port them to TypeScript.

---

## 4. Top Three Immediate Engineering Priorities

### Priority 1: Fix Broken Demo Audio & Polish Sentence-Boundary Interruption
- Synthesize and commit `heart-diagram-v2.mp3` into `public/class-audio/`.
- Enhance the hand-raise interrupt in `useClassPlayback.ts` to finish the current sentence before pausing, creating an authentic, professional classroom feel.

### Priority 2: Build the Hierarchical Curriculum Engine (Subject -> Chapter -> Topic)
- Implement `src/lib/curriculum/taxonomy.ts` covering Science, Math, Biology, and Physics.
- Replace the flat guided buttons in `NewSessionDialog` with a 3-step interactive selector that bundles mandatory learning objectives and diagram assets before class starts.

### Priority 3: Port Python Spatial Context into the Web Platform
- Port `SpatialContext` and `FlowchartManager` to TypeScript (`src/lib/spatial/`).
- Enable the AI tutor to draw structured flowcharts and relative diagrams without overlapping text on the SVG canvas.

---

## 5. Recommended Starting Task: Sprint 1, Day 1

### Task: Generate `heart-diagram-v2.mp3` & Sentence-Boundary Interruption Hook

#### Step 1: Synthesize Heart Diagram Audio
Run the audio generation script to create `public/class-audio/heart-diagram-v2.mp3` from the narration scripts in `src/lib/class-scripts.json`:
```bash
python3 scripts/build-class-audio.py --lesson heart-diagram
```
Verify that `public/class-audio/heart-diagram-v2.mp3` is generated and playable.

#### Step 2: Implement Sentence-Boundary Pausing in `useClassPlayback.ts`
Modify [`src/components/useClassPlayback.ts`](file:///home/vscode-gcp/projects/qrie_tutors/test06/ai-whiteboard-tutor-platform%20(1)/src/components/useClassPlayback.ts):
```ts
// Calculate the nearest future sentence boundary timestamp
function nextSentenceEnd(narration: string, currentSeconds: number, sceneStart: number, sceneSeconds: number): number {
  // Find sentence punctuation (. ! ?) and calculate offset
  // If boundary is within 1.5s, return boundary timestamp; else return currentSeconds + 0.5s
}
```
Update `onRaiseHand` in [`src/components/Studio.tsx`](file:///home/vscode-gcp/projects/qrie_tutors/test06/ai-whiteboard-tutor-platform%20(1)/src/components/Studio.tsx) to fade volume over 400ms and pause at `nextSentenceEnd`.

#### Step 3: Run Verification Test
```bash
PLAYWRIGHT_BASE_URL=http://127.0.0.1:3001 npx playwright test tests/studio.spec.ts
```
Confirm all 8 Playwright tests pass and Heart Anatomy plays studio audio seamlessly.
