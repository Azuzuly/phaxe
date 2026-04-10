# Deployment Guide

## Option 1: Cloudflare Workers (Recommended - Free & Fastest)

**Why**: Runs at the edge (~50ms globally), 100k requests/day free, `*.workers.dev` domain rarely blocked.

### Setup
```bash
cd worker
npm install
npx wrangler login
npx wrangler deploy
```

Your proxy will be at: `https://phaxe-proxy.<your-subdomain>.workers.dev`

### Custom Domain (Optional)
```bash
npx wrangler routes
# Add your custom domain in Cloudflare dashboard
```

### Usage
```
https://your-worker.workers.dev/p/{base64_encoded_url}
```

---

## Option 2: Render (Free)

**Why**: Easy deploy, 750 hrs/mo free.

1. Push this repo to GitHub
2. Go to [render.com](https://render.com)
3. Create new Web Service
4. Connect your repo
5. Build: `cd client && npm install && npx vite build`
6. Start: `node server/index.js`
7. Set `NODE_ENV=production`

---

## Option 3: Railway (Free Trial - $5 credit)

1. Go to [railway.app](https://railway.app)
2. Deploy from GitHub
3. It auto-detects the Dockerfile

---

## Option 4: Docker (Self-hosted)

```bash
docker build -t phaxe .
docker run -p 3001:3001 -p 3002:3002 phaxe
```

---

## Evasion Techniques Built In

| Technique | Status |
|-----------|--------|
| URL obfuscation (Base64) | ✅ Built |
| Cloaking (fake Google Docs) | ✅ Built |
| User-Agent rotation | ✅ Built |
| Header stripping | ✅ Built |
| CSP override | ✅ Built |
| X-Frame-Options removal | ✅ Built |
| Cookie forwarding | ✅ Built |
| Redirect handling | ✅ Built |

---

## Frontend Usage

After deploying the worker, update the frontend proxy URL in `client/vite.config.ts`:

```ts
proxy: {
  '/proxy': {
    target: 'https://your-worker.workers.dev', // Your deployed URL
    changeOrigin: true,
  },
}
```

Or build the frontend with the worker URL:
```bash
cd client
VITE_PROXY_URL=https://your-worker.workers.dev npx vite build
```
