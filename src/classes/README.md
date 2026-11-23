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

## Quick Access
- Root symlink: `classes/` at the repository root links directly to `src/classes/`.
- Programmatic access: `import { getClass, getAllClasses } from "@/classes";`
