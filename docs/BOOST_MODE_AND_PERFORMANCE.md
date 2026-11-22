# Boost Mode & 120 FPS Hardware Acceleration Engine

## 1. Overview & Objectives

**Boost Mode** is Qrie's hardware-accelerated, high-performance rendering and playback engine designed for intensive educational whiteboards. It transforms vector drawing, SVG canvas compositing, and multimodal playback into a zero-latency, high-refresh experience (up to 120 FPS on supported ProMotion and high-refresh displays).

Boost Mode solves four primary challenges in interactive whiteboard learning:
1. **GPU Compositor Layer Isolation**: Eliminates document reflow and repaint thrashing when drawing hundreds of vector marks or animated teacher strokes.
2. **Subpixel Antialiasing & Typographic Precision**: Guarantees crisp, legible handwriting and complex math equations on Retina / high-DPI displays without blurring.
3. **Zero-Latency Chapter & Class Switching**: Provides instant seeking across 4-chapter masterclasses with no cursor teleportation or ghost marks.
4. **Resilient Audio-Clock Synchronization**: Decouples visual marker animations from browser audio decoder ticks, interpolating smooth continuous motion.

---

## 2. Technical Architecture

```
+-----------------------------------------------------------------------------------+
| Boost Mode Compositor Layer Pipeline                                              |
+-----------------------------------------------------------------------------------+
|                                                                                   |
|  [ .board-card.boost-mode-active ]                                                |
|  ├── transform: translateZ(0);                                                    |
|  ├── will-change: transform;                                                      |
|  ├── contain: layout paint;                                                       |
|  └── backface-visibility: hidden;                                  |
|                                                                                   |
|  [ 5 Decoupled SVG Hardware Layers ]                                              |
|  ├── Layer 1: .canvas-layer-assets            (Pre-cached diagrams, crisp edges)  |
|  ├── Layer 2: .canvas-layer-teacher-permanent (Foundational landmarks & grid)    |
|  ├── Layer 3: .canvas-layer-teacher-annotations(Dynamic marks & chamber highlights)|
|  ├── Layer 4: .canvas-layer-student           (Isolated ink & undo/redo stacks)   |
|  └── Layer 5: .canvas-layer-overlays          (Doubt sketches & laser pinpoints)  |
|                                                                                   |
|  [ Marker Cursor Engine ]                                                         |
|  └── .marker-cursor (transform: translate3d(x, y, 0), will-change: transform)     |
|                                                                                   |
+-----------------------------------------------------------------------------------+
```

### A. CSS & GPU Acceleration Rules (`src/app/globals.css`)

```css
/* Boost Mode: 120fps GPU Hardware Acceleration, Zero-Latency Seek & Instant Transitions */
.boost-mode-active {
  transform: translateZ(0);
  will-change: transform;
  contain: layout paint;
  backface-visibility: hidden;
}

.boost-mode-active .drawing-svg {
  shape-rendering: geometricPrecision;
  text-rendering: optimizeLegibility;
  transform: translateZ(0);
  backface-visibility: hidden;
}

.boost-mode-active .tutor-marks,
.boost-mode-active .canvas-layer-teacher-permanent,
.boost-mode-active .canvas-layer-teacher-annotations,
.boost-mode-active .canvas-layer-assets,
.boost-mode-active .canvas-layer-student,
.boost-mode-active .canvas-layer-overlays,
.boost-mode-active .marker-cursor {
  will-change: transform;
  transform: translateZ(0);
  backface-visibility: hidden;
}

.boost-mode-active image,
.boost-mode-active .canvas-layer-assets image {
  image-rendering: -webkit-optimize-contrast;
  image-rendering: crisp-edges;
  transform: translateZ(0);
}
```

### B. High-Precision Clock Interpolation (`src/components/useClassPlayback.ts`)

Standard HTML5 `<audio>` elements trigger `timeupdate` events at low, irregular intervals (~4 Hz to ~15 Hz). Under Boost Mode, `useClassPlayback` pairs `performance.now()` with monotonic clock interpolation to produce a continuous 60–120 FPS timeline:

```ts
const read = useCallback(() => {
  const state = anchor.current;
  if (!state.running) return Math.max(0, Math.min(duration, state.seconds));
  const now = performance.now();
  if (state.media && audioRef.current) {
    if (pending.current || audioRef.current.seeking) {
      // Monotonic seek target anchoring
      return Math.max(0, Math.min(duration, state.seconds + (now - state.at) / 1000));
    }
    const mediaTime = audioRef.current.currentTime;
    const tracker = smoothMedia.current;
    if (Math.abs(mediaTime - tracker.mediaTime) > 0.001) {
      tracker.mediaTime = mediaTime;
      tracker.perfAt = now;
    }
    // Interpolate smoothly between ~30ms browser decoder ticks
    const interpolated = tracker.mediaTime + Math.min(0.08, Math.max(0, (now - tracker.perfAt) / 1000));
    return Math.max(0, Math.min(duration, interpolated));
  }
  return Math.max(0, Math.min(duration, state.seconds + (now - state.at) / 1000));
}, [duration]);
```

### C. WebRTC & RTCDataChannel Boost Acceleration (`src/lib/duplex-voice.ts`)

In addition to canvas compositor acceleration, Boost Mode optimizes the WebRTC transport layer:
1. **Unordered 0-Retransmit SCTP Datagrams**:
   - The `whiteboard-strokes` data channel is configured with `{ ordered: false, maxRetransmits: 0 }`.
   - Prevents head-of-line blocking so the canvas receives coordinate streams in real time without waiting for dropped packets.
2. **Instant Buffer Draining**:
   - `bufferedAmountLowThreshold` is tuned to `0` bytes (instant flush), ensuring incoming coordinate packets are processed without queuing delay.
3. **Hardware Pointer Frequency**:
   - Pointer move throttling is bypassed under Boost Mode, streaming points at full native hardware display refresh rates (up to 120–144 Hz).
4. **Dynamic Peer Connection Synchronization**:
   - Whenever Boost Mode toggles, an event packet `boost_mode_toggle` is emitted across both the data channel and the `/api/live` signaling registry, synchronizing server and peer states immediately.

### D. Runtime Frame-Time Profiler & Measured FPS Benchmarking (`src/components/Whiteboard.tsx`)

To verify rendering performance rather than relying on CSS hints alone, `Whiteboard.tsx` embeds an active `requestAnimationFrame` frame-time profiler:
- **Continuous Delta Measurement**: Samples consecutive animation frames via `performance.now()`.
- **Target vs Measured Metrics**:
  - **60 Hz Standard Displays**: Measures average frame intervals of $\approx 16.6\text{ ms}$ with standard deviation $< 3\text{ ms}$.
  - **120 Hz ProMotion Displays**: Measures average frame intervals of $\approx 8.3\text{ ms}$ with hardware compositor isolation.
- **Runtime Telemetry**: Exposes `window.__CHALKLY_PERF__` (`getMeasuredFps()`, `getFrameIntervals()`, `getAverageFrameTime()`) and writes `data-measured-fps` to `.board-card`.
- **Automated Verification**: Verified in `tests/webrtc-boost.spec.ts` which collects 60 consecutive frame intervals during active rendering and asserts low jitter and zero dropped frames.

---

## 3. Controls & Automatic Background Operation

Boost Mode operates automatically in the background on the whiteboard stage (`data-boost-mode="true"`) to guarantee zero-latency rendering and instant seek performance for all learners.

| Method | Where / How | Action |
| :--- | :--- | :--- |
| **Automatic Default** | Built-in whiteboard stage | Enabled by default (`data-boost-mode="true"`). |
| **Keyboard Shortcut** | `Ctrl + B` (or `Cmd + B` / `Alt + B`) | Instant keyboard toggle with toast feedback. |
| **Slash Command** | Type `/boost` (or `/boost on` / `/boost off`) in chat | Toggles or sets Boost Mode state. |
| **GSD Mode** | Type `/gsd` or press `Ctrl + G` | Forces Boost Mode ON for high-efficiency drawing. |
| **Graphyphy Mode** | Type `/graphy` or `/graphyphy` | Enables Boost Mode with subpixel typography calibration. |

The student's preference is automatically stored in `localStorage` under `qrie.boostMode` (with backwards compatibility for `chalkly.boostMode`) and persists across page reloads.

---

## 4. Benchmark Classes & Modular Architecture

Boost Mode powers the canonical, self-contained modular class housed in `src/classes/`:

1. **The Human Cell** (`src/classes/human-cell`):
   - 6 organelle landmarks (Mitochondria, Nucleus, Ribosomes, Endoplasmic Reticulum, Golgi, Membrane) with calibrated boundaries, authentic diagram asset, and non-overlapping text layout.

---

## 5. Automated Verification

Boost Mode is verified in the automated Playwright test suite:
- `tests/webrtc-boost.spec.ts`:
  - Verifies WebRTC SDP offer/answer negotiation with stable signaling state.
  - Verifies high-throughput unordered data channel transfer across `whiteboard-strokes`.
  - Verifies `/boost` chat command synchronization.
- `tests/class-chapter-switch-glitch.spec.ts`:
  - Verifies Boost Mode is active by default with `.boost-mode-active` class.
  - Verifies zero-latency chapter seeking without marker cursor teleportation glitches.
  - Verifies clean whiteboard unmounting and remounting without ghost marks.
