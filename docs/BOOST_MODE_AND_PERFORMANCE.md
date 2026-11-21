# Boost Mode & 120 FPS Hardware Acceleration Engine

## 1. Overview & Objectives

**Boost Mode** is Chalkly's hardware-accelerated, high-performance rendering and playback engine designed for intensive educational whiteboards. It transforms vector drawing, SVG canvas compositing, and multimodal playback into a zero-latency, high-refresh experience (up to 120 FPS on supported ProMotion and high-refresh displays).

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
|  └── Layer 5: .canvas-layer-overlays          (Doubt sketches & screen share)     |
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

---

## 3. Controls & Activation

Boost Mode is enabled by default and offers multiple fast-access toggles:

| Method | Where / How | Action |
| :--- | :--- | :--- |
| **Google Meet Bar** | Bottom control bar `Zap` button | Click to toggle Boost Mode on/off. |
| **Topbar Action** | Workspace top bar `Boost` button | Click to toggle Boost Mode on/off. |
| **Keyboard Shortcut** | `Ctrl + B` (or `Cmd + B` / `Alt + B`) | Instant keyboard toggle with toast feedback. |
| **Slash Command** | Type `/boost` (or `/boost on` / `/boost off`) in chat | Toggles or sets Boost Mode state. |
| **GSD Mode** | Type `/gsd` or press `Ctrl + G` | Forces Boost Mode ON for high-efficiency drawing. |
| **Graphyphy Mode** | Type `/graphy` or `/graphyphy` | Enables Boost Mode with subpixel typography calibration. |

The student's preference is automatically stored in `localStorage` under `chalkly.boostMode` and persists across page reloads.

---

## 4. Benchmark Classes & Diagrams

Boost Mode powers both visual masterclasses and interactive Canvas Intelligence benchmark diagrams:

1. **Human Heart & Blood Flow** (`heart-diagram`):
   - 14 anatomical landmarks, 4 chambers, dynamic SVG path circulation loops.
2. **The Human Cell** (`human-cell`):
   - 10 cell organelles (Mitochondria, Nucleus, Ribosomes, Endoplasmic Reticulum, Golgi).
3. **The Pythagorean Theorem** (`pythagoras`):
   - Geometric right-triangle proofs, dynamic vector altitude drops, and square areas.
4. **Understanding Fractions** (`fractions`):
   - Interactive fraction bars and unit partition calculations.
5. **Interactive Benchmark Diagrams**:
   - *Hydrologic Water Cycle* (`water-diagram` / `water-cycle.svg`)
   - *DC Electric Circuit* (`circuit-diagram` / `circuit.svg`)
   - *Inclined Plane Mechanics* (`inclined-diagram` / `inclined-plane.svg`)

---

## 5. Automated Verification

Boost Mode is verified in the automated Playwright test suite:
- `tests/class-chapter-switch-glitch.spec.ts`:
  - Verifies Boost Mode is active by default with `.boost-mode-active` class.
  - Verifies toggling via Meet bar and `/boost` chat command.
  - Verifies zero-latency chapter seeking without marker cursor teleportation glitches.
  - Verifies clean whiteboard unmounting and remounting without ghost marks.
