# Deploying Qrie AI Whiteboard Platform to Cloudflare Workers & Pages

This guide walks you through deploying your **Next.js 16** AI Whiteboard Tutor application (`whiteboard-ai-agent`) to **Cloudflare Workers & Pages** using the official `@opennextjs/cloudflare` and `wrangler` tooling.

---

## Method 1: Git Integration (Cloudflare Dashboard) — Recommended

This matches the Cloudflare dashboard view where you select your GitHub repository from `github:222831382`.

### Step 1: Select Your Repository
1. In Cloudflare Dashboard, navigate to **Compute** &rarr; **Workers & Pages**.
2. Click **Create an application** &rarr; select the **Pages** tab.
3. Click **Connect to Git**.
4. Select your GitHub account (`github:222831382`).
5. In the repository search bar, select:
   ```
   whiteboard-ai-agent
   ```
6. Click **Begin setup**.

---

### Step 2: Configure Build Settings
Fill in the deployment settings as follows:

| Setting | Value |
|---|---|
| **Project name** | `whiteboard-ai-agent` |
| **Production branch** | `main` |
| **Framework preset** | `None` (or `Next.js`) |
| **Build command** | `npm run build:cloudflare` |
| **Build output directory** | `.open-next/assets` |
| **Root directory** | `/` (leave blank or `/`) |

---

### Step 3: Configure Environment Variables
Under **Environment variables (advanced)**, add:

| Variable Name | Value / Description | Required |
|---|---|---|
| `NODE_VERSION` | `20` or `22` | **Yes** |
| `GEMINI_MODEL` | `gemini-3.8-live` (Real-time live multi-modal voice & query engine) | **Yes** |
| `USE_VERTEX_AI` | `true` (Enable Vertex AI & Agent Platform endpoints) | **Yes** |
| `GOOGLE_CLOUD_PROJECT` | `project-b4799c16-a198-49c1-8db` | **Yes** |
| `GOOGLE_CLOUD_REGION` | `us-central1` | **Yes** |
| `VOICE_NAME` | `Aoede` (Unified voice identity for teacher and query resolver) | **Yes** |
| `APP_VERSION` | `2.3` (System and frontend version tag) | **Yes** |
| `NEXT_TELEMETRY_DISABLED` | `1` | Optional |

> **Security Note:** Environment variables defined in the Cloudflare dashboard are encrypted and isolated on Cloudflare's secure edge network.

---

### Step 4: Configure Compatibility Flags
Under **Settings** &rarr; **Functions** (or **Runtime**):
- **Compatibility date**: `2024-09-23` (or newer)
- **Compatibility flags**: Add `nodejs_compat`

*(These are also pre-configured automatically by the included `wrangler.jsonc` file).*

---

### Step 5: Deploy
Click **Save and Deploy**. Cloudflare will:
1. Clone the repository (`whiteboard-ai-agent`).
2. Run `npm install` and `npm run build:cloudflare`.
3. Package the edge worker into `.open-next/worker.js` and upload static assets.
4. Provide an instant live SSL domain: `https://whiteboard-ai-agent.pages.dev`.

---

## Method 2: Instant Command-Line Deployment (CLI)

If you prefer deploying directly from your terminal using Wrangler:

### 1. Authenticate with Cloudflare
```bash
npx wrangler login
```

### 2. Build the Cloudflare Worker Bundle
```bash
npm run build:cloudflare
```

### 3. Deploy to Cloudflare
```bash
npm run deploy:cloudflare
```
Or directly with wrangler:
```bash
npx wrangler deploy
```

---

## Method 3: Local Edge Preview & Development

To test the application running inside Cloudflare's exact `workerd` runtime locally before pushing:

```bash
# Build and run with local workerd runtime emulation
npm run preview:cloudflare
```
Open your browser at `http://localhost:8787`.

---

## Configuration Files Reference

### `wrangler.jsonc`
Located in the project root:
```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "whiteboard-ai-agent",
  "main": ".open-next/worker.js",
  "compatibility_date": "2024-09-23",
  "compatibility_flags": ["nodejs_compat"],
  "assets": {
    "directory": ".open-next/assets",
    "binding": "ASSETS"
  }
}
```

### `open-next.config.ts`
Located in the project root:
```typescript
import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig();
```

---

## Troubleshooting & FAQ

### 1. "Missing peer dependency" with Next.js 16
- **Solution:** We use `@opennextjs/cloudflare` (v1.20+), which officially supports Next.js `>=16.4.5`. The legacy `@cloudflare/next-on-pages` package is capped at Next.js 15.

### 2. WebRTC & Gemini Duplex Voice
- Cloudflare Workers supports standard WebSockets and WebRTC signaling. Streaming voice queries route through the edge runtime seamlessly.

### 3. Custom Domain
- Go to Cloudflare Dashboard &rarr; **Workers & Pages** &rarr; Select `whiteboard-ai-agent` &rarr; **Custom domains** &rarr; **Set up a custom domain** (e.g. `tutor.yourdomain.com`). DNS records are auto-configured by Cloudflare.
