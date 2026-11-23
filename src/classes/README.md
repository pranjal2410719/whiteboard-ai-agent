# Qrie Demo Classes Architecture

The Qrie AI Whiteboard Tutor Platform features the **Human Cell** modular class, stored in its own dedicated, self-contained directory containing **everything** for the lecture class: codebase, assets, audio, and data.

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
    ├── assets/                  # High-res cell anatomy & mitochondria diagrams
    └── audio/                   # 2-minute lecture audio (human-cell-v2.mp3)
```

## Dynamic Whiteboard Layout Pattern Engine

The platform incorporates a rich dynamic layout pattern engine (`src/lib/layout/`), supporting 7 distinct whiteboard teaching layouts:

1. **Classic Split (`classic-split`)**: Left header & stacked bullet notes/formula, right diagram asset.
2. **Inverted Split (`inverted-split`)**: Left diagram asset, right header & structured concept notes.
3. **Centered Focal Hero with Callouts (`centered-focal-hero`)**: Centered visual asset hero flanked symmetrically by bilateral left and right callout cards with pointer arrows.
4. **Top Diagram with Bottom Timeline (`top-diagram-bottom-timeline`)**: Top horizontal diagram banner with sequential process workflow cards below (`Step 1 → Step 2 → Step 3`).
5. **Step-by-Step Derivation & Equation Flow (`step-by-step-derivation`)**: Cascading mathematical derivation cards with connector arrows and compact right-hand geometric/physical reference.
6. **Multi-Panel Comparison (`multi-panel-comparison`)**: Symmetrical comparative cards side-by-side with individual subtitles, badges, and contrasting color themes.
7. **Floating Radial Annotation (`floating-radial-annotation`)**: Central visual subject with 360° orbiting callout badges, dashed guide rings, and angular pointer vectors.

### Pedagogical Stage Mapping & Spatial Grounding
- `LayoutPatternEngine.selectPatternForPedagogy(stage, options)` automatically maps stages (`INTRODUCE`, `VISUAL_DEMO`, `CHECKPOINT`, `EVALUATE_AND_REMEDIATE`, `SYNTHESIS`) to appropriate layout patterns.
- `LayoutPatternEngine.transformRegions(regions, fromBounds, toBounds)` dynamically translates and scales spatial landmarks so tutor annotations, clicks, and vision grounding remain 100% accurate regardless of layout pattern or placement.
