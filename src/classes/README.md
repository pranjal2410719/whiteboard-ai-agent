# Qrie Demo Classes Architecture

Each lecture class in the Qrie AI Whiteboard Tutor Platform is stored in its own dedicated, self-contained directory containing **everything** for that specific lecture class: codebase, assets, audio, and data.

```
src/classes/
├── index.ts                     # Central registry exporting all 4 classes & helpers
├── types.ts                     # TypeScript definitions for classes, scenes, and metadata
├── helpers.ts                   # Reusable SVG mark generation utilities
│
├── heart-diagram/               # Class 03: Human Heart & Double Circulation
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
├── pythagoras/                  # Class 01: Pythagorus
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

## Quick Access
- Root symlink: `classes/` at the repository root links directly to `src/classes/`.
- Programmatic access: `import { getClass, getAllClasses } from "@/classes";`
