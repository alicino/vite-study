# Vite in Production - Lesson 04
## Real-World Projects, Deployment, and Performance Optimization

---

## 🎯 Learning Objectives

By the end of this lesson, you will:
- Build a complete fullstack-ready Vite application
- Configure API proxying, SSR, and static generation strategies
- Optimize for Core Web Vitals (LCP, CLS, INP)
- Deploy to Cloudflare Pages and Workers
- Profile and optimize with Lighthouse and Chrome DevTools
- Understand the complete Vite production checklist

---

## 🏗️ Analogy: The Vite Space Mission

Your Vite app is a spacecraft. Development is the launchpad — fast, iterative, safe. Production is space — every byte matters, every millisecond counts, and you can't push fixes instantly.

```
DEVELOPMENT (Launchpad)
├── Hot reload (instant fixes)
├── Source maps (full visibility)
├── Unminified code (readable)
└── Fast iteration (try, fail, fix)
         │
         │ npm run build
         ▼
PRODUCTION (Space)
├── Minified & compressed (lightweight payload)
├── Tree-shaken (no dead weight)
├── Code-split (load only what's needed)
├── Cached aggressively (hash-based filenames)
└── Error boundaries (graceful failure)
```

**The mission:** Get your payload (app) to users with maximum speed and minimum overhead.

---

## 🚀 Building a Real-World Application

### Architecture: Fullstack Vite App

```
┌─────────────────────────────────────────────────────────────┐
│                        USER BROWSER                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  Vite App    │  │  Static      │  │  Dynamic Data    │  │
│  │  (React/Vue) │  │  Assets      │  │  (API calls)     │  │
│  └──────┬───────┘  └──────┬───────┘  └────────┬─────────┘  │
│         │                  │                    │            │
│         └──────────────────┴────────────────────┘            │
│                            │                                │
└────────────────────────────┼────────────────────────────────┘
                             │ HTTPS
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                     CDN / EDGE NETWORK                       │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Static files (cached globally)                     │    │
│  │  • index.html                                       │    │
│  │  • assets/*.js (immutable, 1-year cache)           │    │
│  │  • assets/*.css (immutable, 1-year cache)          │    │
│  └─────────────────────────────────────────────────────┘    │
└────────────────────────────┬────────────────────────────────┘
                             │
                    ┌────────┴────────┐
                    │                 │
            ┌───────▼──────┐  ┌──────▼──────┐
            │  API Server  │  │  Vite Dev   │
            │  (Node/Go/   │  │  Server     │
            │   Python)    │  │  (local)    │
            └──────────────┘  └─────────────┘
```

### The Complete Project Structure

```
my-fullstack-app/
├── src/
│   ├── api/                    # API client layer
│   │   ├── client.ts          # Axios/fetch configuration
│   │   ├── users.ts           # User endpoints
│   │   └── posts.ts           # Post endpoints
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Footer.tsx
│   │   ├── ui/                # Reusable UI primitives
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Card.tsx
│   │   │   └── Skeleton.tsx   # Loading states
│   │   └── features/
│   │       ├── UserProfile/
│   │       ├── PostList/
│   │       └── AuthForm/
│   │
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useFetch.ts        # Generic data fetching
│   │   ├── useLocalStorage.ts
│   │   └── useDebounce.ts
│   │
│   ├── lib/
│   │   ├── utils.ts           # cn(), formatters
│   │   ├── constants.ts       # App constants
│   │   └── validations.ts     # Form validations
│   │
│   ├── pages/
│   │   ├── Home.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Profile.tsx
│   │   └── Login.tsx
│   │
│   ├── stores/                # State management
│   │   └── authStore.ts       # Zustand/Redux
│   │
│   ├── types/
│   │   ├── user.ts
│   │   ├── post.ts
│   │   └── api.ts
│   │
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
│
├── public/
│   ├── favicon.ico
│   ├── robots.txt
│   ├── manifest.json          # PWA manifest
│   └── icons/                 # PWA icons
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── .env.development
├── .env.production
├── .env.staging
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
└── vitest.config.ts
```

---

## 🔌 API Integration Patterns

### Pattern 1: Proxy (Development Only)

```typescript
// vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        // rewrite: (path) => path.replace(/^\/api/, ''),
      },
      '/auth': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
```

```typescript
// src/api/client.ts
const API_BASE = import.meta.env.VITE_API_URL || '/api'

export const apiClient = {
  async get<T>(path: string): Promise<T> {
    const response = await fetch(`${API_BASE}${path}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Send cookies
    })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    return response.json()
  },
  
  async post<T>(path: string, body: unknown): Promise<T> {
    const response = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body),
    })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    return response.json()
  },
}
```

### Pattern 2: Environment-Based URLs

```bash
# .env.development
VITE_API_URL=http://localhost:8080/api

# .env.staging
VITE_API_URL=https://staging-api.example.com

# .env.production
VITE_API_URL=https://api.example.com
```

```typescript
// src/api/client.ts
const baseURL = import.meta.env.VITE_API_URL

// In development: http://localhost:8080/api/users
// In production: https://api.example.com/users
export const fetchUsers = () => 
  fetch(`${baseURL}/users`).then(r => r.json())
```

---

## ⚡ Performance Optimization

### 1. Code Splitting Strategies

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Vendor libraries (rarely change)
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor-react'
            }
            if (id.includes('lodash') || id.includes('date-fns')) {
              return 'vendor-utils'
            }
            return 'vendor' // Other node_modules
          }
          
          // Feature-based splitting
          if (id.includes('/features/admin/')) {
            return 'feature-admin'
          }
          if (id.includes('/features/dashboard/')) {
            return 'feature-dashboard'
          }
        },
      },
    },
  },
})
```

### 2. Dynamic Imports (Route-Based)

```tsx
// App.tsx with React Router
import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

// These create separate JS chunks!
const Dashboard = lazy(() => import('./pages/Dashboard'))
const AdminPanel = lazy(() => import('./pages/AdminPanel'))
const UserProfile = lazy(() => import('./pages/UserProfile'))
const Login = lazy(() => import('./pages/Login'))

// Loading component shown while chunk loads
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
  </div>
)

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/profile" element={<UserProfile />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
```

**Result in Network tab:**
```
GET /assets/index-[hash].js        (main app)
GET /assets/vendor-react-[hash].js (React, cached)
GET /assets/feature-admin-[hash].js (only when visiting /admin!)
```

### 3. Preloading Critical Resources

```html
<!-- index.html -->
<!DOCTYPE html>
<html>
  <head>
    <!-- Preload critical fonts -->
    <link rel="preload" href="/fonts/inter-bold.woff2" as="font" type="font/woff2" crossorigin>
    
    <!-- Preload critical CSS -->
    <link rel="preload" href="/src/index.css" as="style">
    
    <!-- Preconnect to API domain -->
    <link rel="preconnect" href="https://api.example.com">
    
    <!-- DNS prefetch for analytics -->
    <link rel="dns-prefetch" href="https://analytics.example.com">
  </head>
</html>
```

### 4. Image Optimization

```tsx
// vite-plugin-image-optimizer (npm install -D vite-plugin-image-optimizer)
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer'

export default defineConfig({
  plugins: [
    ViteImageOptimizer({
      png: { quality: 80 },
      jpeg: { quality: 80 },
      webp: { quality: 80 },
      avif: { quality: 70 },
    }),
  ],
})
```

```tsx
// Responsive images with srcset
<picture>
  <source srcSet="/image.avif" type="image/avif" />
  <source srcSet="/image.webp" type="image/webp" />
  <img 
    src="/image.jpg" 
    alt="Description"
    loading="lazy"
    width="800"
    height="600"
  />
</picture>
```

### 5. Bundle Size Monitoring

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    // Warn if chunks exceed 500KB
    chunkSizeWarningLimit: 500,
    
    rollupOptions: {
      output: {
        // Ensure small chunks
        experimentalMinChunkSize: 1000,
      },
    },
  },
})
```

---

## 📊 Core Web Vitals Optimization

### LCP (Largest Contentful Paint) — < 2.5s

```tsx
// Bad: Images without dimensions cause layout shift
<img src="/hero.jpg" alt="Hero" />

// Good: Explicit dimensions prevent CLS
<img src="/hero.jpg" alt="Hero" width="1200" height="600" />

// Better: Priority loading for above-fold images
<img 
  src="/hero.jpg" 
  alt="Hero" 
  width="1200" 
  height="600"
  fetchPriority="high"
  loading="eager"
/>
```

### CLS (Cumulative Layout Shift) — < 0.1

```css
/* Always reserve space for dynamic content */
.image-container {
  aspect-ratio: 16 / 9;
  background: #f0f0f0; /* Placeholder color */
}

.skeleton {
  min-height: 200px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

### INP (Interaction to Next Paint) — < 200ms

```tsx
// Bad: Blocking the main thread
const handleClick = () => {
  const result = heavyComputation(data) // 500ms freeze!
  setState(result)
}

// Good: Yield to main thread
const handleClick = async () => {
  setIsLoading(true)
  
  // Move to next tick, allow paint
  await new Promise(resolve => setTimeout(resolve, 0))
  
  const result = await runInWorker(data) // Web Worker
  setState(result)
  setIsLoading(false)
}
```

---

## 🚀 Deployment Strategies

### Strategy 1: Static Hosting (SPA)

**Best for:** Client-side rendered apps, dashboards, internal tools

```bash
# Build
npm run build

# Deploy to Cloudflare Pages
npm install -g wrangler
wrangler pages deploy dist

# Deploy to Netlify
npm i -g netlify-cli
netlify deploy --prod --dir=dist

# Deploy to Cloudflare Pages
# Connect Git repo in Cloudflare Dashboard
# Or use Wrangler:
npm install -g wrangler
wrangler pages deploy dist
```

**Cloudflare Pages config for SPAs (redirect all to index.html):**
```json
// _routes.json (Cloudflare Pages)
{
  "version": 1,
  "include": ["/*"],
  "exclude": ["/assets/*"]
}
```

```toml
# _redirects (Cloudflare Pages)
/*    /index.html   200

### Strategy 2: Server-Side Rendering (SSR)

**Best for:** SEO-critical apps, public content, e-commerce

```bash
# npm install -D vite-plugin-ssr
# Or use meta-frameworks:
# • Nuxt 3 (Vue)
# • SvelteKit (Svelte)
# • Astro (Multi-framework)
```

```typescript
// vite.config.ts with SSR
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    ssr: true, // Enable SSR
    rollupOptions: {
      input: './src/entry-server.tsx',
    },
  },
})
```

### Strategy 3: Static Site Generation (SSG)

**Best for:** Blogs, documentation, marketing sites

```bash
# Using Vite + vite-plugin-ssr
npm run build
# Generates static HTML for each route

# Using Astro (recommended)
npm create astro@latest
# Choose SSR or SSG mode
```

### Platform Comparison

| Platform | Type | SPA | SSR | Edge | Free Tier |
|----------|------|-----|-----|------|-----------|
| **Cloudflare Pages** | Static/Workers | ✅ | ✅ | ✅ | Generous |
| **Cloudflare Workers** | Serverless/Edge | ✅ | ✅ | ✅ | Generous |
| **Netlify** | Static/Serverless | ✅ | ✅ | ✅ | Generous |
| **Cloudflare Pages** | Static/Workers | ✅ | ✅ | ✅ | Generous |
| **GitHub Pages** | Static only | ✅ | ❌ | ❌ | 1GB |
| **AWS S3+CloudFront** | Static/Edge | ✅ | ❌ | ✅ | Pay per use |
| **Railway/Render** | Container | ✅ | ✅ | ❌ | Limited |

---

## 🧪 Testing in Production

### Preview Deployments

```bash
# Cloudflare Pages preview (per-branch)
git push origin feature/new-dashboard
# Automatically deploys via Git integration in Cloudflare Dashboard

# Netlify preview
# Same - every PR gets a unique URL
```

### Production Testing Checklist

```
□ Build succeeds without errors
□ No console errors in production
□ All API calls use correct production URL
□ Environment variables are set
□ Source maps disabled (or hidden)
□ robots.txt configured
□ sitemap.xml generated (for SEO)
□ favicon works
□ PWA manifest valid
□ Service Worker registers
□ Images optimized
□ Fonts preloaded
□ Analytics tracking works
□ Error monitoring (Sentry) active
```

---

## 🔍 Debugging Production Issues

### Source Maps in Production

```typescript
// vite.config.ts
export default defineConfig(({ mode }) => ({
  build: {
    // Only generate source maps in staging
    sourcemap: mode === 'staging',
    
    // Or use hidden source maps (not exposed to users)
    sourcemap: 'hidden',
  },
}))
```

### Environment Debugging

```tsx
// DebugPanel.tsx (only in non-production)
export function DebugPanel() {
  if (import.meta.env.PROD) return null
  
  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded">
      <p>Mode: {import.meta.env.MODE}</p>
      <p>Base URL: {import.meta.env.BASE_URL}</p>
      <p>Dev: {import.meta.env.DEV ? 'Yes' : 'No'}</p>
      <p>Prod: {import.meta.env.PROD ? 'Yes' : 'No'}</p>
    </div>
  )
}
```

---

## 📈 Monitoring & Analytics

### Real User Monitoring (RUM)

```typescript
// src/lib/analytics.ts
export function trackPageView(path: string) {
  if (import.meta.env.PROD) {
    // Google Analytics 4
    gtag('event', 'page_view', { page_path: path })
    
    // Or Cloudflare Web Analytics
    // Or Cloudflare Web Analytics
  }
}

export function trackEvent(name: string, params?: Record<string, unknown>) {
  if (import.meta.env.PROD) {
    gtag('event', name, params)
  }
}
```

### Performance Monitoring

```typescript
// src/lib/performance.ts
export function measureLCP() {
  new PerformanceObserver((list) => {
    const entries = list.getEntries()
    const lastEntry = entries[entries.length - 1]
    console.log('LCP:', lastEntry.startTime)
    
    // Send to analytics
    trackEvent('web_vitals', {
      metric: 'LCP',
      value: lastEntry.startTime,
    })
  }).observe({ entryTypes: ['largest-contentful-paint'] })
}

export function measureCLS() {
  let clsValue = 0
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (!(entry as any).hadRecentInput) {
        clsValue += (entry as any).value
      }
    }
    console.log('CLS:', clsValue)
  }).observe({ entryTypes: ['layout-shift'] })
}
```

---

## 🎓 The Complete Production Checklist

### Pre-Deploy

```bash
# 1. Type check
npx tsc --noEmit

# 2. Lint
npm run lint

# 3. Test
npm run test

# 4. Build
npm run build

# 5. Preview production build locally
npm run preview
```

### Build Configuration

```typescript
// vite.config.ts - Production-ready config
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import legacy from '@vitejs/plugin-legacy'
import { VitePWA } from 'vite-plugin-pwa'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    
    // Legacy browser support
    legacy({
      targets: ['defaults', 'not IE 11'],
    }),
    
    // PWA
    mode === 'production' && VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'My App',
        short_name: 'App',
        theme_color: '#ffffff',
      },
    }),
    
    // Bundle analysis (only when explicitly requested)
    mode === 'analyze' && visualizer({ open: true }),
  ].filter(Boolean),
  
  build: {
    sourcemap: mode === 'staging',
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
        },
      },
    },
  },
  
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
}))
```

---

## 🎓 Key Takeaways

1. **Development ≠ Production** — optimize for speed, caching, and user experience in production

2. **Code splitting is automatic** with dynamic imports. Use route-based splitting for SPAs

3. **Core Web Vitals matter** — LCP < 2.5s, CLS < 0.1, INP < 200ms. Measure with real users

4. **Static hosting is easiest** — Cloudflare Pages/Workers for SPAs and edge functions. Meta-frameworks for SSR

5. **Preview every change** — use preview deployments to test before merging to main

6. **Monitor in production** — track errors, performance, and user behavior with real data

7. **The build pipeline is:** Type check → Lint → Test → Build → Preview → Deploy

---

## 📝 Quick Reference Card

```
┌─────────────────────────────────────────────────────────┐
│               PRODUCTION BUILD CHECKLIST                 │
├─────────────────────────────────────────────────────────┤
│  □ TypeScript: npx tsc --noEmit                         │
│  □ Linting: npm run lint                                │
│  □ Tests: npm run test                                  │
│  □ Build: npm run build                                 │
│  □ Preview: npm run preview                             │
│  □ Check dist/ output                                   │
│  □ Verify API endpoints                                 │
│  □ Test on mobile device                                │
│  □ Run Lighthouse audit                                 │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│               DEPLOYMENT COMMANDS                        │
├─────────────────────────────────────────────────────────┤
│  Cloudflare Pages:  wrangler pages deploy dist          │
│  Cloudflare Workers: wrangler deploy                    │
│  Netlify:   netlify deploy --prod --dir=dist            │
│  Cloudflare: wrangler pages deploy dist                 │
│  GitHub:    git push (auto-deploy from main)            │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│               PERFORMANCE TARGETS                        │
├─────────────────────────────────────────────────────────┤
│  LCP (Largest Contentful Paint): < 2.5s                 │
│  CLS (Cumulative Layout Shift): < 0.1                   │
│  INP (Interaction to Next Paint): < 200ms               │
│  FCP (First Contentful Paint): < 1.8s                   │
│  TTFB (Time to First Byte): < 600ms                     │
└─────────────────────────────────────────────────────────┘
```

---

## 🚀 What's Next

You now have a complete understanding of Vite from fundamentals to production. Next steps:

1. **Build something real** — Apply these lessons to your own project
2. **Explore the ecosystem** — Try Nuxt, SvelteKit, or Astro
3. **Contribute** — Vite is open source. Fix a bug or improve docs
4. **Stay updated** — Follow Vite releases (v5, v6, and beyond)

---

## 📚 Homework

1. Build a complete app with routing, API calls, and authentication
2. Deploy it to Cloudflare Pages
3. Run Lighthouse audit and achieve 90+ score
4. Add error tracking (Sentry) and analytics
5. Configure PWA with offline support
6. Set up CI/CD pipeline (GitHub Actions) for automated deploys
7. (Bonus) Migrate an existing Webpack project to Vite

---

*Lesson 04 - Vite in Production*
*Created for accelerated learning path*
