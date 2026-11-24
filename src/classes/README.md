# Qrie Demo Classes Architecture

The Qrie AI Whiteboard Tutor Platform features modular subject classrooms (**Human Cell** and **Trigonometry**), stored in dedicated, self-contained directories containing **everything** for the lecture class: codebase, assets, audio, and data.

```
src/classes/
├── index.ts                     # Central registry exporting modular classes & helpers
├── types.ts                     # TypeScript definitions for classes, scenes, and metadata
├── helpers.ts                   # Reusable SVG mark generation utilities
│
├── human-cell/                  # Class: Human Cell
│   ├── index.ts                 # Class entry point & complete definition
│   ├── board.ts                 # Whiteboard initial cover & 4 chapter scenes
│   ├── intelligence.ts          # 6 organelle semantic regions & targets
│   ├── script.json              # Chapter narration, timestamps, cues, study notes
│   ├── README.md                # Class documentation
│   ├── assets/                  # High-res cell anatomy & mitochondria diagrams
│   └── audio/                   # 2-minute lecture audio (human-cell-v2.mp3)
│
└── trigonometry/                # Class: Trigonometry & Right Triangles
    ├── index.ts                 # Class entry point & complete definition
    ├── board.ts                 # Whiteboard initial cover & 4 chapter scenes
    ├── intelligence.ts          # Semantic regions (Hypotenuse, Opp, Adj, θ, SOH-CAH-TOA)
    ├── script.json              # 4 chapter narrations, timestamps, cues, study notes
    ├── README.md                # Class documentation
    ├── assets/                  # High-res right triangle vector diagram
    └── audio/                   # 2-minute lecture audio (trigonometry-v2.mp3)
```

## Interactive Doubt Resolution & Board Preservation
During live or paused playback of any class:
- **Whiteboard Element & Stroke Preservation**: In `src/components/Studio.tsx`, the lecture lifecycle tracks lesson keys with `prevLessonKeyRef`, strictly preventing premature `closeClass()` execution when students ask doubts during paused or playing lectures. All whiteboard diagrams, progressive ink strokes, and lesson progress remain 100% stable without being wiped.
- **Voice-First Minimalist Response**: Professor responds verbally in 2–3 concise sentences directly addressing the student's question, keeping the whiteboard elements array empty (`elements: []`) so existing diagrams remain uncluttered.
- **Real-Time Voice Doubt Feedback & Audio Fallback**: Spoken responses are generated via `/api/tts` with a 4500ms timeout and instant fallback to browser `window.speechSynthesis`.
- **Prepayment Credit Depletion Resilience**: If external LLM credits are exhausted, the class engine seamlessly answers doubts using built-in curriculum intelligence (`curriculum-answers.ts`).

## Quick Access
- Root symlink: `classes/` at the repository root links directly to `src/classes/`.
- Programmatic access: `import { getClass, getAllClasses } from "@/classes";`
