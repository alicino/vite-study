# Vite + Cloudflare - Lesson 05
## The Complete Cloudflare Integration Guide

---

## 🎯 Learning Objectives

By the end of this lesson, you will:
- Deploy Vite apps to Cloudflare Pages with zero-config
- Use Wrangler CLI for deployment and management
- Integrate Cloudflare Workers for serverless API functions
- Configure `_headers`, `_redirects`, and `_routes.json`
- Use Cloudflare D1 (SQLite), KV, and R2 storage with Vite
- Set up Cloudflare Access for protected preview deployments
- Understand the Cloudflare edge network architecture

---

## 🌐 Why Cloudflare?

### The Global Edge Network

```
Traditional Hosting:              Cloudflare Edge:
┌─────────────┐                   ┌─────────────┐
│   User      │───300ms latency──►│  US Server  │
│   (Brazil)  │                   │  (Virginia) │
└─────────────┘                   └─────────────┘

Cloudflare Pages:
┌─────────────┐                   ┌─────────────┐
│   User      │───20ms latency───►│ São Paulo   │
│   (Brazil)  │                   │ Edge Node   │
└─────────────┘                   └─────────────┘
         300+ cities worldwide
```

**Key advantages:**
- **Speed**: 300+ edge locations worldwide (closest to user)
- **Free tier**: Generous limits, no credit card required
- **Integration**: Pages + Workers + D1 + KV + R2 in one platform
- **Git-based**: Automatic deployments from GitHub/GitLab
- **Custom domains**: Free SSL, instant propagation

---

## 🚀 Deploying to Cloudflare Pages

### Method 1: Git Integration (Recommended)

```
Step 1: Push code to GitHub/GitLab
    │
    ▼
Step 2: Connect repo in Cloudflare Dashboard
    │    Dashboard → Pages → Create Project → Connect Git
    ▼
Step 3: Configure build settings
    │    Build command: npm run build
    │    Build output: dist
    ▼
Step 4: Add environment variables
    │    VITE_API_URL=https://api.example.com
    ▼
Step 5: Deploy! 🎉
    Automatic deploys on every push to main
```

### Method 2: Wrangler CLI (Direct Upload)

```bash
# Install Wrangler globally
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Deploy dist/ folder directly
wrangler pages deploy dist

# With project name (creates if doesn't exist)
wrangler pages deploy dist --project-name=my-vite-app

# Deploy specific branch
wrangler pages deploy dist --branch=staging
```

### Build Configuration (`wrangler.toml`)

```toml
# wrangler.toml
name = "my-vite-app"
compatibility_date = "2024-01-01"

[build]
command = "npm run build"
cwd = "."
watch_dir = "src"

[site]
bucket = "./dist"
```

---

## ⚙️ SPA Configuration on Cloudflare Pages

### The Routing Problem

SPAs handle routing client-side. Direct access to `/dashboard` returns 404 because the file doesn't exist on the server.

### Solution 1: `_redirects` File

```
# public/_redirects
# Redirect all paths to index.html (SPA catch-all)
/*    /index.html   200

# API calls go to Workers (see below)
/api/*  /api/:splat  200
```

**How it works:**
```
User requests: /dashboard
Cloudflare: "Does /dashboard.html exist?" → No
_redirects: "Serve /index.html instead" → 200 OK
React Router: "I see /dashboard, render Dashboard component"
```

### Solution 2: `_routes.json` (Advanced)

```json
{
  "version": 1,
  "include": ["/*"],
  "exclude": [
    "/assets/*",
    "/favicon.ico",
    "/robots.txt",
    "/sitemap.xml",
    "/api/*"
  ]
}
```

**Use case:** Exclude static assets and API routes from SPA routing.

### Solution 3: `_headers` (Cache Control)

```
# public/_headers
# Cache hashed assets forever (immutable)
/assets/*
  Cache-Control: public, max-age=31536000, immutable

# Never cache HTML (always fresh)
/index.html
  Cache-Control: public, max-age=0, must-revalidate

# API responses
/api/*
  Cache-Control: no-cache
  Access-Control-Allow-Origin: *
```

---

## 🔧 Cloudflare Workers: Serverless APIs

### What Are Workers?

Workers are serverless functions that run on Cloudflare's edge network (V8 isolates). They handle requests before they reach your static files.

```
User Request
    │
    ├──► Cloudflare Edge
    │       │
    │       ├──► Worker Function (optional)
    │       │       ├── API calls → Process → Return JSON
    │       │       └── Auth check → Block/Allow
    │       │
    │       └──► Static Files (Pages)
    │               ├── index.html
    │               └── assets/*.js
    │
    └──► Response (from edge, not origin server)
```

### Adding a Worker to Your Vite Project

```bash
# In your Vite project root
npm create cloudflare@latest api
# Choose: "Hello World" Worker
```

```typescript
// worker.ts (in your Vite project)
export interface Env {
  // Bindings (D1, KV, R2, etc.)
  DB: D1Database
  CACHE: KVNamespace
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url)
    
    // CORS headers
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Content-Type': 'application/json',
    }
    
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers, status: 204 })
    }
    
    // Route handling
    if (url.pathname === '/api/users') {
      const users = await env.DB.prepare('SELECT * FROM users').all()
      return Response.json({ users: users.results }, { headers })
    }
    
    if (url.pathname === '/api/health') {
      return Response.json({ status: 'ok', timestamp: Date.now() }, { headers })
    }
    
    return new Response('Not Found', { status: 404, headers })
  },
}
```

### Binding Workers to Pages (Functions Directory)

```
my-vite-app/
├── src/                    # Vite React app
├── functions/              # Cloudflare Functions (Workers)
│   ├── api/
│   │   ├── users.ts       # /api/users endpoint
│   │   └── posts.ts       # /api/posts endpoint
│   └── _middleware.ts     # Global middleware (auth, CORS)
├── dist/                   # Vite build output
├── public/                 # Static files
└── wrangler.toml
```

```typescript
// functions/api/users.ts
export async function onRequest(context) {
  const { request, env } = context
  
  // Get users from D1 database
  const users = await env.DB.prepare('SELECT id, name, email FROM users').all()
  
  return Response.json({ users: users.results })
}
```

```typescript
// functions/_middleware.ts
export async function onRequest(context) {
  // Apply CORS to all API routes
  const response = await context.next()
  
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE')
  
  return response
}
```

---

## 🗄️ Cloudflare Storage with Vite

### D1: SQLite at the Edge

```bash
# Create D1 database
wrangler d1 create my-database

# Add to wrangler.toml
[[d1_databases]]
binding = "DB"
database_name = "my-database"
database_id = "your-database-id"
```

```typescript
// In your Worker function
export default {
  async fetch(request, env) {
    // Query D1
    const { results } = await env.DB.prepare(
      'SELECT * FROM posts WHERE published = ?'
    )
    .bind(true)
    .all()
    
    return Response.json({ posts: results })
  }
}
```

### KV: Key-Value Store

```bash
# Create KV namespace
wrangler kv:namespace create "CACHE"

# wrangler.toml
[[kv_namespaces]]
binding = "CACHE"
id = "your-kv-id"
```

```typescript
// Cache API responses
const cacheKey = `users:${userId}`
let user = await env.CACHE.get(cacheKey, { type: 'json' })

if (!user) {
  user = await fetchUserFromDatabase(userId)
  await env.CACHE.put(cacheKey, JSON.stringify(user), { expirationTtl: 3600 })
}

return Response.json(user)
```

### R2: Object Storage (S3-compatible)

```bash
# Create R2 bucket
wrangler r2 bucket create my-uploads

# wrangler.toml
[[r2_buckets]]
binding = "UPLOADS"
bucket_name = "my-uploads"
```

```typescript
// Upload file to R2
const object = await env.UPLOADS.put(
  `uploads/${userId}/${filename}`,
  request.body,
  { httpMetadata: { contentType: fileType } }
)

return Response.json({ url: `https://cdn.example.com/${object.key}` })
```

---

## 🔐 Cloudflare Access (Authentication)

Protect preview deployments with corporate identity providers:

```bash
# In Cloudflare Dashboard:
# Zero Trust → Access → Applications → Add

# Create policy:
# - Include: Email ends with @yourcompany.com
# - OR: GitHub organization member
# - OR: Google Workspace group
```

**Use case:** Share staging URLs securely without public access.

---

## 📊 Complete Cloudflare + Vite Project Structure

```
my-cloudflare-vite-app/
├── src/                          # Vite React/Vue/Svelte app
│   ├── api/
│   │   └── client.ts            # API calls to /api/*
│   ├── components/
│   ├── pages/
│   └── main.tsx
│
├── functions/                    # Cloudflare Functions (Workers)
│   ├── api/
│   │   ├── users.ts             # GET /api/users
│   │   ├── posts.ts             # GET /api/posts
│   │   └── upload.ts            # POST /api/upload
│   └── _middleware.ts           # CORS, auth, logging
│
├── public/                       # Static assets
│   ├── _redirects               # SPA routing rules
│   ├── _routes.json             # Function routing
│   ├── _headers                 # Cache control
│   ├── favicon.ico
│   └── robots.txt
│
├── migrations/                   # D1 database migrations
│   └── 0001_init.sql
│
├── dist/                         # Vite build output (gitignored)
├── .env                          # Local env vars (gitignored)
├── wrangler.toml                 # Cloudflare configuration
├── vite.config.ts               # Vite configuration
└── package.json
```

---

## 🚀 Deployment Workflows

### Workflow 1: Development → Staging → Production

```bash
# 1. Local development
npm run dev                    # Vite dev server
wrangler pages dev dist        # Test Workers locally

# 2. Deploy to staging
git checkout -b staging
git push origin staging
# Cloudflare automatically deploys to: https://staging.myapp.pages.dev

# 3. Test staging
# Share https://staging.myapp.pages.dev with team
# Protected by Cloudflare Access if configured

# 4. Deploy to production
git checkout main
git merge staging
git push origin main
# Automatically deploys to: https://myapp.pages.dev

# 5. Custom domain
# Dashboard → Pages → Custom Domains → Add myapp.com
```

### Workflow 2: Direct Deployments

```bash
# Deploy preview (unique URL)
wrangler pages deploy dist --branch=feature-x
# URL: https://feature-x.myapp.pages.dev

# Deploy production
wrangler pages deploy dist --branch=main

# With environment variables
wrangler pages deploy dist --env production
```

---

## 🎓 Cloudflare + Vite Cheat Sheet

```bash
# Install Wrangler
npm install -g wrangler

# Login
wrangler login

# Local development
wrangler pages dev dist              # Serve static + Workers
wrangler dev                          # Workers only

# Deploy
wrangler pages deploy dist           # Deploy to Pages
wrangler deploy                       # Deploy Workers only

# Database
wrangler d1 create my-db
wrangler d1 execute my-db --file=./migrations/init.sql

# KV
wrangler kv:namespace create "CACHE"
wrangler kv:key put --binding=CACHE "key" "value"

# R2
wrangler r2 bucket create uploads
wrangler r2 object put uploads/file.txt --file=./file.txt

# Secrets
wrangler secret put API_KEY           # Secure env var
```

---

## 🎓 Key Takeaways

1. **Cloudflare Pages** deploys Vite apps to 300+ edge locations automatically

2. **Wrangler CLI** handles everything: deploy, dev server, secrets, databases

3. **SPA routing** requires `_redirects` or `_routes.json` for client-side routes

4. **Workers Functions** (`/functions` directory) add serverless APIs alongside your static app

5. **D1 + KV + R2** provide database, caching, and file storage at the edge

6. **Git integration** enables automatic deployments on every push

7. **Preview deployments** create unique URLs for every branch — perfect for testing

---

## 📚 Homework

1. Deploy your Vite app to Cloudflare Pages via Git integration
2. Create a `/functions/api/hello.ts` endpoint that returns JSON
3. Add `_redirects` file for SPA routing and test direct URL access
4. Configure `_headers` for asset caching
5. Create a D1 database and query it from a Worker function
6. Set up a custom domain with SSL
7. (Bonus) Implement Cloudflare Access for team-only preview URLs

---

## 🔗 Cloudflare Resources

- Cloudflare Pages Docs: https://developers.cloudflare.com/pages/
- Workers Docs: https://developers.cloudflare.com/workers/
- Wrangler CLI: https://developers.cloudflare.com/workers/wrangler/
- D1 Database: https://developers.cloudflare.com/d1/
- KV Storage: https://developers.cloudflare.com/kv/
- R2 Storage: https://developers.cloudflare.com/r2/

---

*Lesson 05 - Vite + Cloudflare Integration*
*Created for accelerated learning path*
