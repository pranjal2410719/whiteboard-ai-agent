# Qrie AI Whiteboard Platform: Production Deployment & Operations Guide

This guide details the steps to deploy the Qrie AI Whiteboard platform to production using Docker, PostgreSQL 17, and Next.js 16.

---

## 1. Prerequisites & System Requirements

- **Node.js**: v20.x or v22.x LTS
- **PostgreSQL**: v16+ or v17+ with SSL enabled
- **Operating System**: Linux (Ubuntu 22.04 / 24.04 LTS, Debian 12, or Alpine)
- **Minimum Hardware**: 2 vCPUs, 4GB RAM, 20GB SSD storage
- **Network**: Port 443 (HTTPS) / Port 80 (HTTP redirect), WebRTC UDP range (10000-20000) for streaming voice

---

## 2. Environment Variables Configuration

Create a `.env` file in the project root:

```bash
# Database Connection
DATABASE_URL=postgresql://postgres:secure_password@db.example.com:5432/chalkly_db?sslmode=require

# AI Model Provider Credentials
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-3.8-live
GOOGLE_CLOUD_PROJECT=your_google_cloud_project_id
GOOGLE_CLOUD_REGION=us-central1

# Optional Fallback Provider (OpenAI)
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o-mini
OPENAI_BASE_URL=https://api.openai.com/v1

# Security & Cookies
COOKIE_SECURE=true
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
```

> **Security Note:** Server-side API keys (`GEMINI_API_KEY`) are protected by the `/api/sessions` key-isolation proxy and are never transmitted to browser clients.

---

## 3. Database Migration & Initialization

Run Drizzle schema migration against PostgreSQL:

```bash
# Verify connection and push latest table schemas
npx drizzle-kit push
```

The database initializes two core relational tables:
1. `chalkly_study_sessions`: Persists classroom session contexts, messages, and board marks.
2. `chalkly_learner_mastery`: Stores longitudinal Bayesian Knowledge Tracing scores, misconceptions, and confidence metrics.

---

## 4. Production Build & Execution

### Direct Node.js Execution

```bash
# Install production dependencies
npm ci

# Build optimized production bundle
npm run build

# Start production server
npm run start -- -p 3000
```

### Docker Deployment

Create a `Dockerfile`:

```dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3000
CMD ["npm", "run", "start", "--", "-p", "3000"]
```

Build and run:

```bash
docker build -t qrie-whiteboard:latest .
docker run -d --name qrie-app -p 3000:3000 --env-file .env qrie-whiteboard:latest
```

---

## 5. Security & Reverse Proxy (Nginx)

Recommended Nginx configuration with TLS and HTTP/2:

```nginx
server {
    listen 80;
    server_name classroom.qrie.ai;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name classroom.qrie.ai;

    ssl_certificate /etc/letsencrypt/live/classroom.qrie.ai/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/classroom.qrie.ai/privkey.pem;

    # Production Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "microphone=(self), camera=(), geolocation=()" always;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 6. Healthchecks & Diagnostics

The platform provides dedicated API health routes:
- `GET /api/live`: Verifies duplex protocol version, VAD readiness, and streaming audio support.
- `GET /api/curriculum`: Validates curriculum taxonomy availability and search indexing.
- `GET /api/sessions`: Validates PostgreSQL database connectivity and active workspace authorization.
