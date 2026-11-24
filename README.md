# Qrie — AI Whiteboard Tutor Platform

An enterprise-grade, interactive AI Whiteboard Tutor platform built on **Next.js 16**, **React 19**, and **Google Gemini AI**. Featuring real-time multimodal vector whiteboard instruction, dual-pen spatial drawing, continuous flowing TTS narrative, full multilingual voice support (English, Hinglish, Hindi), and Google Meet style classroom controls.

Ready for production deployment on **Cloudflare Workers & Pages**, **Docker**, and **Vercel**.

---

## Key Highlights

- **Multimodal AI Teaching**: Powered by Google Gemini 2.5 Flash / Preview Live API with computer vision grounding across Cambridge International (CIE) educational diagrams.
- **Continuous Flowing Narrative TTS**: Synthesizes paragraph-level speech with 1.0x natural conversational cadence and 0.4s natural pauses—completely eliminating unnatural robotic silence or audio stretching.
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
   - `NODE_VERSION`: `20`
   - `GEMINI_API_KEY`: `<Your Gemini API Key>`
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
GEMINI_API_KEY=your_gemini_api_key_here
GOOGLE_CLOUD_PROJECT=your_google_cloud_project_id
GOOGLE_CLOUD_REGION=us-central1
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

All 41 tests are green and run in continuous integration.

---

## License

MIT License. Designed with precision by the Qrie AI Engineering Team.
