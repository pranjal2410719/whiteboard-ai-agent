# Qrie — AI Whiteboard Tutor Platform (v2.2)

An enterprise-grade, interactive AI Whiteboard Tutor platform built on **Next.js 16**, **React 19**, and **Google Gemini AI**. Featuring real-time multimodal vector whiteboard instruction, dual-pen spatial drawing, Query Resolver Topic Relevance Verification Engine, polite teacher deferral with seamless auto-resume, diagram & whiteboard visual awareness, unified Aoede voice & pedagogical persona, continuous flowing TTS narrative, full multilingual voice support (English, Hinglish, Hindi), and Google Meet style classroom controls.

Ready for production deployment on **Cloudflare Workers & Pages**, **Docker**, and **Vercel**.

---

## Key Highlights

- **Query Resolver Topic Relevance Verification Engine (v2.2)**: Intelligently analyzes whether student interruption queries are relevant to the active topic, current screen diagram, whiteboard visual marks/regions/notes, or concepts taught/to be taught in class. Off-topic questions (sports, entertainment, cooking, gaming, politics) are gently filtered without derailing the lecture.
- **Polite Teacher Deferral & Auto-Resume**: When an irrelevant query is detected, the teacher responds in a polite, encouraging educator tone (deferring off-topic discussion until after class) and automatically resumes the lecture stream—strictly preserving all whiteboard diagrams, progress, and strokes without erasing anything. Supports English, Hindi, and Hinglish deferral phrasing.
- **Diagram & Whiteboard Visual Awareness**: Direct student references to on-screen visual artifacts—such as borders, colors, arrows, numbers, bullet points, labels, organelle structures, and flowchart elements—are dynamically recognized as in-scope and answered with visual grounding.
- **Voice & Persona Unification (Aoede)**: Both the Class AI Teacher and the Query Resolver use the identical neural voice (`Aoede`) and pedagogical persona ("Professor"), providing a seamless, warm, and inspiring acoustic and pedagogical identity across lectures, live doubt interruptions, and chat discussions.
- **Multimodal AI Teaching**: Powered by Google Gemini 2.5 Flash / Preview Live API with computer vision grounding across Cambridge International (CIE) educational diagrams.
- **Continuous Flowing Narrative TTS**: Synthesizes paragraph-level speech with 1.0x natural conversational cadence and 0.4s natural pauses—completely eliminating unnatural robotic silence or audio stretching.
- **Whiteboard Element Preservation During Doubt Resolution**: In `src/components/Studio.tsx`, prevented premature `closeClass()` execution when questions are asked during a paused or running lecture, ensuring whiteboard diagrams and progressive ink marks remain 100% stable without being wiped.
- **Real-Time Voice Doubt Feedback & Audio Fallback**: Increased server TTS timeout to 4500ms and added immediate, reliable fallback to browser speech synthesis (`window.speechSynthesis`) so the tutor never falls silent even under network latency or API rate limits.
- **Google Cloud Vertex AI & Enterprise Agent Platform Support**: Added first-class support for `USE_VERTEX_AI=true`, endpoint `aiplatform.googleapis.com`, bi-directional fallback between Vertex AI and Google AI Studio, automatic HTTP 402 prepayment credit recovery via built-in curriculum intelligence, and suppression of technical model error toasts during live classroom lectures.
- **Production Typography & Hand-Drawn Font Resilience**: Resolved CSS invalid-at-computed-value fallback for `--font-caveat` in `globals.css` ensuring production SVG text correctly renders in Caveat handwriting font across all browsers.
- **Instant Multilingual Switching**:
  - **English**: Full English spoken lecture, whiteboard labels, and curriculum notes.
  - **Hinglish**: Tutor speaks natural colloquial Hinglish while maintaining English whiteboard terminology.
  - **Hindi (हिन्दी)**: Real-time translation of spoken voice, whiteboard vector labels, and notes into fluent Hindi.
  - Phonetic Brand Grounding: "Qrie" is accurately pronounced as *"Curie"* (`/ˈkjʊə.ri/`) in English/Hinglish and *"क्यूरी"* in Hindi.
- **Dual-Pen Spatial Whiteboard**:
  - **Pen 1 (Primary)**: Precision chalk white pen for diagrams, structural paths, and formulas.
  - **Pen 2 (Annotation)**: High-contrast gold/teal highlighter for real-time focus, callouts, and underlines.
  - Automatic 120 FPS subpixel GPU interpolation for fluid drawing.
- **Google Meet In-Class Control Bar**:
  - Floating bottom bar with Microphone toggle (M), Live Captions (C), Chapter navigation, Play/Pause (Space), Playback Speed controller (0.75x–2.0x), and Leave Class.
- **Minimalist & Distraction-Free**: Clean visual stage focused purely on the lecture, whiteboard, and active lesson navigation.

---

## Architecture Overview

```
+-----------------------------------------------------------------------------------+
| Topbar: Sidebar Toggle | Breadcrumbs | Gemini Status Strip | Help & Shortcuts      |
+-----------------------------------------------------------------------------------+
|                                                                                   |
|  INTERACTIVE WHITEBOARD CANVAS (Full Height, 120 FPS Subpixel Acceleration)       |
|                                                                                   |
|  [Distraction-Free Visual Learning Stage]                                         |
|  - Precision SVG vector layers: Diagrams, Text labels, Callouts, Formulas        |
|  - Multi-Pen Vector Pipeline: Pen 1 (Chalk White) + Pen 2 (Gold Highlighter)      |
|  - Vision Perception & Grounding: Coordinate transformation & spatial boundaries  |
|                                                                                   |
|  [Live Audio & Voice Duplex]                                                      |
|  - 120-Second Continuous Master MP3s (English / Hinglish / Hindi)                 |
|  - Google Gemini TTS with natural 1.0x pacing and 0.4s conversational pauses      |
|  - Full WebRTC Duplex Voice & VAD Speech Detection                               |
|                                                                                   |
+-----------------------------------------------------------------------------------+
| Live Captions Overlay (Dynamic Centered Subtitles: Student & Professor)          |
+-----------------------------------------------------------------------------------+
| GOOGLE MEET IN-CLASS CONTROL BAR                                                  |
| [Chapter Title]  [Prev] [Play/Pause] [Next] [Exit]  [Mic (M)] [CC (C)] [1.0x]     |
+-----------------------------------------------------------------------------------+
```

---

## Query Resolver & Topic Relevance Matrix Architecture (v2.2)

The **Query Resolver Topic Relevance Verification Engine** (`src/lib/curriculum-answers.ts`) acts as an intelligent pedagogical firewall and context-aware doubt resolver during active classroom instruction:

```
                          [Student Interruption / Voice Mic Doubt]
                                             │
                                             ▼
                 +───────────────────────────────────────────────────────+
                 |    Topic Relevance Verification Matrix                |
                 |    • Active Topic & Lesson Key Alignment              |
                 |    • On-Screen Diagram & Visual Elements (Borders/Clr)|
                 |    • Dynamic Marks Extraction (SVG Text / Alt Tags)   |
                 |    • Semantic Region Extraction (Labels & Aliases)    |
                 |    • Curriculum Progression (Recap / Next Slide)      |
                 |    • Explicit Off-Topic Filter (Sports/Recipes/Trivia)|
                 +───────────────────────────┬───────────────────────────+
                                             │
                       ┌─────────────────────┴─────────────────────┐
                       ▼                                           ▼
             [Question IS Relevant]                     [Question IS NOT Relevant]
                       │                                           │
                       ▼                                           ▼
        +─────────────────────────────+             +─────────────────────────────+
        | In-Scope Academic Response  |             | Polite Teacher Deferral     |
        | • Pedagogical explanation   |             | • Warm educator tone        |
        | • Dynamic whiteboard marks  |             | • Defer to after class      |
        | • Visual grounding anchors  |             | • Preserve all board marks  |
        | • Follow-up suggestions     |             | • Instant auto-resume stream|
        +─────────────────────────────+             +─────────────────────────────+
                       │                                           │
                       └─────────────────────┬─────────────────────┘
                                             ▼
                     [Unified Spoken Voice Delivery (Aoede Neural)]
                                             │
                                             ▼
                     [Live Captions & Chronological Transcript Sync]
```

### 1. Multi-Dimensional Relevance Matrix
- **Visual Awareness**: Questions regarding visual board cues (e.g., *"What is that green border?"*, *"Why is there a red circle in the center?"*, *"Explain bullet point 4: Protein Factory"*, *"What does the arrow point to?"*) are dynamically recognized as in-scope.
- **Dynamic Whiteboard & Region Inspection**: Dynamically extracts textual terms, image alt text, and semantic region labels directly from active SVG marks on the current board page (`context.currentMarks` and `context.currentRegions`).
- **Curriculum Progression**: Inquiries concerning previous slides, future curriculum topics, agenda, or related concepts (e.g., comparing plant cells to animal cells during a Human Cell class) are verified as relevant.
- **Explicit Off-Topic Filtering**: Off-topic inquiries (cricket/football scores, celebrity news, movies, recipes, gaming, weather, politics) are immediately intercepted.

### 2. Polite Teacher Deferral & Seamless Auto-Resume
- **Natural Pedagogical Tone**: Rather than a blunt refusal, Professor warmly acknowledges the curiosity and explains why staying focused on the current topic matters:
  - *English*: *"That's an interesting question! However, right now we're focusing on our lesson on [Topic]. Let's discuss that query after our class so we stay on track. Let's resume and continue our lesson on the whiteboard!"*
  - *Hindi*: *"यह एक दिलचस्प प्रश्न है! लेकिन अभी हम [Topic] के अपने पाठ पर ध्यान केंद्रित कर रहे हैं। कक्षा समाप्त होने के बाद इस विषय पर ज़रूर चर्चा कर सकते हैं ताकि हमारी पढ़ाई में रुकावट न आए। चलिए, व्हाइटबोर्ड पर अपने पाठ को आगे बढ़ाते हैं!"*
  - *Hinglish*: *"Yeh kaafi interesting sawaal hai! Lekin abhi hum apne lesson [Topic] par focus kar rahe hain. Is doubt ko hum class khatam hone ke baad zaroor discuss kar sakte hain taaki class track par rahe. Chaliye, whiteboard par apne lecture ko continue karte hain!"*
- **Whiteboard Visual Preservation**: Deferral returns an empty elements array (`elements: []`), guaranteeing that no diagram elements, progressive ink marks, or student annotations are ever erased.
- **Lecture Stream Restoration**: Upon speaking the polite deferral, the system automatically triggers `resumeLectureFromDoubt()`, seamlessly continuing lecture playback without student intervention.

### 3. Voice & Persona Unification (Aoede)
- Both the **Class AI Teacher** (delivering structured lectures) and the **Query Resolver** (handling student live doubts and interactive turns) use the identical neural voice **Aoede** and identical pedagogical persona (**Professor**).
- Eliminates voice dissonance or persona disconnect when switching between pre-recorded lectures, live speech interruptions, and chat-based Q&A.

---

## Project Structure

```
├── CLOUDFLARE_DEPLOYMENT.md     # Cloudflare Workers & Pages deployment guide
├── open-next.config.ts          # OpenNext Cloudflare configuration
├── wrangler.jsonc               # Cloudflare Workers & Pages configuration
├── next.config.ts               # Next.js 16 configuration
├── package.json                 # Project dependencies & scripts
├── docs/                        # Comprehensive documentation & architecture specifications
│   ├── README.md                # Docs index
│   ├── MASTER_ARCHITECTURE.md   # System architecture
│   ├── DEPLOYMENT_GUIDE.md      # Docker & PostgreSQL deployment
│   ├── gemini-3-8-live.md       # Live audio & WebRTC protocol
│   └── ...
├── src/
│   ├── app/                     # Next.js App Router (pages & API endpoints)
│   │   ├── api/tts/             # Gemini TTS endpoint with phonetic brand normalization
│   │   ├── api/tutor/           # Dynamic tutor orchestrator & CIE marking
│   │   ├── api/vision/          # Vision perception & diagram grounding
│   │   ├── api/live/            # WebRTC signaling gateway
│   │   └── api/curriculum/      # Curriculum taxonomy & search
│   ├── classes/                 # Modular subject classrooms
│   │   ├── human-cell/          # Human Cell (EN, Hinglish, Hindi audio & scripts)
│   │   └── trigonometry/        # Trigonometry (EN, Hinglish, Hindi audio & scripts)
│   ├── components/              # React components
│   │   ├── Studio.tsx           # Main classroom studio & layout
│   │   ├── Whiteboard.tsx       # SVG vector whiteboard & multi-pen drawing engine
│   │   ├── GoogleMeetBar.tsx    # Bottom Google Meet control bar
│   │   └── LiveCaptionsOverlay  # Centered subtitles overlay
│   └── lib/                     # Utilities & engines
│       ├── duplex-voice.ts      # WebRTC voice client & audio worklets
│       ├── spatial.ts           # Coordinate math & spatial vision collision checks
│       └── types.ts             # TypeScript domain definitions
├── public/
│   └── class-audio/             # Master 120s continuous audio tracks
└── tests/                       # Playwright test suites (41 tests)
```

---

## Deployment to Cloudflare Workers & Pages

This repository is pre-configured for deployment to **Cloudflare Workers & Pages** via `@opennextjs/cloudflare`.

### Quick Setup in Cloudflare Dashboard:
1. In Cloudflare, navigate to **Compute** &rarr; **Workers & Pages** &rarr; **Create an application** &rarr; **Pages** &rarr; **Connect to Git**.
2. Select your repository: `whiteboard-ai-agent`.
3. Set the build parameters:
   - **Build command**: `npm run build:cloudflare`
   - **Output directory**: `.open-next/assets`
   - **Root directory**: `/`
4. Set Environment Variables:
   - `NODE_VERSION`: `22`
   - `GEMINI_API_KEY`: `<Your Gemini / Vertex AI Tutor Key (for teaching classes & whiteboard)>`
   - `VOICE_API_KEY`: `<Optional: Your Voice / TTS API Key (for speech generation; falls back to GEMINI_API_KEY)>`
   - `USE_VERTEX_AI`: `true` (or `false` for direct Google AI Studio)
   - `GOOGLE_CLOUD_PROJECT`: `<Your Google Cloud Project ID>`
   - `GOOGLE_CLOUD_REGION`: `us-central1`
5. Click **Save and Deploy**.

For detailed step-by-step instructions and CLI deployment via Wrangler, see [CLOUDFLARE_DEPLOYMENT.md](CLOUDFLARE_DEPLOYMENT.md).

---

## Local Development

### 1. Prerequisites
- Node.js 20+ or 22+ LTS
- npm 10+

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Fill in your credentials:
```env
# 1. AI Tutor Key (teaches classes, whiteboard vector drawing, multimodal perception, doubt resolution)
GEMINI_API_KEY=your_gemini_api_key_here
TUTOR_API_KEY=
GEMINI_MODEL=gemini-2.5-flash
USE_VERTEX_AI=true
GOOGLE_CLOUD_PROJECT=your_google_cloud_project_id
GOOGLE_CLOUD_REGION=us-central1

# 2. Voice & Speech Key (generates Professor's spoken audio; optional, falls back to GEMINI_API_KEY)
VOICE_API_KEY=your_voice_api_key_here
TTS_API_KEY=

# 3. Optional Fallback LLM Key
OPENAI_API_KEY=
```

### 4. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Testing & Quality Assurance

Run the comprehensive Playwright test suite (validating multilingual modes, spatial grounding, monotonic drawing, and curriculum engines):

```bash
# Typecheck
npm run typecheck

# Run Playwright tests
npm run test
```

All 120+ tests across 19+ test suites (including topic relevance matrix, WebRTC Boost Mode, and visual grounding) are green and run in continuous integration.

---

## License

MIT License. Designed with precision by the Qrie AI Engineering Team.
