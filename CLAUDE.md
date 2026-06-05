# Vite Training Context — CLAUDE.md

**Student:** Developer learning Vite and modern build tooling  
**Training started:** Lesson 01 → 08 completed  
**Workspace:** `/Users/alicino/Workspace/vite-study/`  
**Goal:** Master Vite fundamentals, ecosystem, testing, plugin development, and production deployment in accelerated timeframe

---

## 📚 Lessons Completed

| Lesson | File | Topic | Status |
|--------|------|-------|--------|
| 01 | `lessons/vite-01-lesson.md` | Fundamentals, architecture, ecosystem, competitors | ✅ Complete |
| 02 | `lessons/vite-02-lesson.md` | Setup, config, HMR, aliases, env vars, CRA comparison | ✅ Complete |
| 03 | `lessons/vite-03-lesson.md` | Assets, styling, plugins, production optimization | ✅ Complete |
| 04 | `lessons/vite-04-lesson.md` | Fullstack apps, deployment, performance, monitoring | ✅ Complete |
| 05 | `lessons/vite-05-lesson.md` | Cloudflare Pages, Workers, Wrangler, D1, KV, R2 | ✅ Complete |
| 06 | `lessons/vite-06-lesson.md` | Testing with Vitest, coverage, CI integration | ✅ Complete |
| 07 | `lessons/vite-07-lesson.md` | Custom plugin development, hooks, publishing | ✅ Complete |
| 08 | `lessons/vite-08-lesson.md` | Monorepos, Turborepo, Webpack migration, library mode | ✅ Complete |
| — | `guides/vite-study-project-setup.md` | Step-by-step project scaffolding guide | ✅ Complete |

---

## 🧠 Core Concepts Covered

### What is Vite?
- **Build tool** (not a framework) — the "engine," not the "car"
- Uses **native ESM** in development (no bundling)
- Uses **Rollup** for production builds
- Created by Evan You (Vue creator) in 2020

### The Two Modes
```
DEVELOPMENT          PRODUCTION
-----------          ----------
Native ESM           Rollup bundling
On-demand compile    Tree-shaking
Fast HMR (50ms)      Code splitting
No bundling          Minification
```

### Why Vite is Fast
- Dev: Only transforms **requested files**
- HMR: Updates **single modules** via WebSocket
- Dependencies: Pre-bundles with **esbuild** (Go = fast)
- No upfront bundling in development

### Key Terms
| Term | Meaning |
|------|---------|
| **ESM** | ECMAScript Modules — browser-native `import`/`export` |
| **HMR** | Hot Module Replacement — instant code updates without reload |
| **Rollup** | Production bundler used by Vite (tree-shaking, code-splitting) |
| **esbuild** | Go-based transpiler — extremely fast TypeScript/JS compilation |
| **Tree-shaking** | Removing unused code from bundles |
| **Code splitting** | Breaking bundle into smaller chunks loaded on-demand |
| **Meta-framework** | Full framework built on Vite (Nuxt, SvelteKit, Astro) |

---

## 🗺️ The Vite Ecosystem

```
VITE CORE
├── Framework Plugins
│   ├── @vitejs/plugin-react (Fast Refresh, JSX)
│   ├── @vitejs/plugin-vue (SFC compiler)
│   ├── @vitejs/plugin-svelte
│   └── @vitejs/plugin-solid
├── Meta-Frameworks ("Vite Plus")
│   ├── Nuxt 3 (Vue) — File routing, Nitro server
│   ├── SvelteKit — SSR/CSR, adapters
│   ├── Astro — Islands architecture, content collections
│   └── SolidStart — Full-stack SolidJS
├── Key Plugins
│   ├── @vitejs/plugin-legacy — IE11/old browser support
│   ├── vite-plugin-pwa — Service Worker, offline app
│   ├── vite-plugin-svgr — Import SVGs as React components
│   └── vite-plugin-checker — TypeScript checking in parallel
├── Testing
│   ├── Vitest — Vite-native test runner
│   └── @vitest/ui — Browser UI for tests
└── Tooling
    ├── rollup-plugin-visualizer — Bundle analysis
    └── vite-plugin-inspect — Debug transformations
```

---

## 🔑 Configuration Reference

### Essential `vite.config.ts`
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  
  server: {
    port: 3000,
    proxy: {
      '/api': 'http://localhost:8080',
    },
  },
  
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
        },
      },
    },
  },
})
```

### Environment Variables
```bash
# Must start with VITE_ to reach browser
VITE_API_URL=https://api.example.com
VITE_APP_NAME=My App

# In code:
const apiUrl = import.meta.env.VITE_API_URL
```

### Path Aliases (also update `tsconfig.json`!)
```typescript
// vite.config.ts
resolve: {
  alias: {
    '@': '/src',
    '@components': '/src/components',
  }
}

// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@components/*": ["src/components/*"]
    }
  }
}
```

---

## 📦 File Handling Cheat Sheet

| Import | Result |
|--------|--------|
| `import x from './file.png'` | URL string (hashed in production) |
| `import x from './file.svg?react'` | React component (needs svgr plugin) |
| `import x from './file.svg?raw'` | Raw string content |
| `import x from './file.json'` | Parsed JavaScript object |
| `import x from './file.css'` | Injected stylesheet |
| `import x from './file.module.css'` | CSS Modules object |
| `import Worker from './file?worker'` | Web Worker constructor |

### Asset Locations
- **`src/assets/`** — Processed, optimized, hashed. Use for component images
- **`public/`** — Copied as-is. Use for `favicon.ico`, `robots.txt`, static files

---

## 🚀 CLI Commands

```bash
# Project creation
npm create vite@latest my-app -- --template react-ts

# Development
npm run dev              # Start dev server
npm run dev -- --host    # Expose to network

# Production
npm run build            # Build for production
npm run preview          # Preview production build locally

# Analysis
npm run build -- --mode analyze   # With bundle analyzer
```

---

## ⚡ Performance Targets

| Metric | Target | Tool |
|--------|--------|------|
| **Cold Start (dev)** | < 2 seconds | Stopwatch |
| **HMR Update** | < 100ms | DevTools |
| **Production Build** | < 30s | Stopwatch |
| **LCP** | < 2.5s | Lighthouse |
| **CLS** | < 0.1 | Lighthouse |
| **INP** | < 200ms | Lighthouse |
| **Bundle Size** | < 200KB initial | Chrome DevTools |

---

## 🥊 Vite vs Alternatives

| Situation | Best Choice |
|-----------|------------|
| New project, any size | **Vite** |
| Replacing CRA | **Vite** |
| Vue project | **Vite** or **Nuxt** |
| Svelte project | **Vite** or **SvelteKit** |
| Next.js app | **Turbopack** (Next's default) or **Cloudflare Workers** |
| Massive enterprise app | **Rspack** (Webpack-compatible) |
| Library/package | **Rollup** or **Vite** |
| Fullstack framework | **Nuxt/SvelteKit/Astro** |

---

## 🎓 Teaching Style & Analogies Used

The student learns best through:
- **Real-world analogies** (restaurants, cars, space missions)
- **Visual diagrams** (ASCII architecture charts)
- **Before/after comparisons** (CRA vs Vite)
- **Hands-on exercises** with immediate feedback
- **Progressive complexity** (fundamentals → practice → production)

Key analogies that resonated:
- **Restaurant kitchen** — Webpack cooks entire menu, Vite cooks only ordered dish
- **House building** — CRA is a sealed mystery box, Vite is transparent LEGO
- **Car engine** — Vite is the engine, meta-frameworks are the full car
- **Space mission** — Dev is launchpad, production is space where every byte matters

---

## 📁 Workspace Files

```
vite-study/
├── README.md                           # Course navigation hub
├── CLAUDE.md                           # This file — training context
├── lessons/                            # All 8 lessons
│   ├── vite-01-lesson.md              # Lesson 01: Fundamentals
│   ├── vite-02-lesson.md              # Lesson 02: Setup & Config
│   ├── vite-03-lesson.md              # Lesson 03: Assets & Plugins
│   ├── vite-04-lesson.md              # Lesson 04: Production & Deploy
│   ├── vite-05-lesson.md              # Lesson 05: Cloudflare Integration
│   ├── vite-06-lesson.md              # Lesson 06: Testing with Vitest
│   ├── vite-07-lesson.md              # Lesson 07: Plugin Development
│   └── vite-08-lesson.md              # Lesson 08: Monorepos & Patterns
├── guides/                             # Guides and resources
│   ├── vite-study-project-setup.md    # Step-by-step project guide
│   └── troubleshooting.md             # Common errors and fixes
└── project/                            # Hands-on Vite application
    └── (built application files)
```

---

## 🚀 Continuing Training

### To Resume From Here:
1. Read the most recent lesson file to recall context
2. Review this CLAUDE.md for key concepts
3. Continue with the next topic based on your needs

### Course Complete — What's Next:

**Apply your knowledge:**
- Build the [Study Project](guides/vite-study-project-setup.md) if you haven't already
- Stuck? Check the [Troubleshooting Guide](guides/troubleshooting.md)
- Migrate an existing Webpack project to Vite
- Write a custom plugin and publish it to npm
- Set up a monorepo with Turborepo for your team

**Advanced exploration:**
- Contribute to the Vite ecosystem (plugins, docs, core)
- Explore meta-frameworks: Nuxt, SvelteKit, Astro, SolidStart
- Learn Vite's SSR and middleware mode for fullstack apps
- Investigate Rspack for massive enterprise codebases

### Student Progress Indicators:
- ✅ Understands why Vite exists and how it's different from Webpack
- ✅ Can scaffold and configure a Vite project from scratch
- ✅ Uses path aliases, environment variables, and asset imports
- ✅ Configures plugins for legacy support, PWA, and analysis
- ✅ Optimizes for Core Web Vitals and production deployment
- ✅ Deploys to Cloudflare edge with Pages, Workers, and storage
- ✅ Writes tests with Vitest and integrates into CI/CD
- ✅ Builds and publishes custom Vite plugins
- ✅ Manages monorepos and migrates from Webpack
- ⬜ Building real-world fullstack application
- ⬜ Contributing to Vite ecosystem (future)

---

## 🔗 Quick Links

- Vite Docs: https://vitejs.dev
- Vite Plugin List: https://github.com/vitejs/awesome-vite
- Vitest: https://vitest.dev
- Rollup: https://rollupjs.org
- esbuild: https://esbuild.github.io

---

## 📝 Notes for Future Sessions

- Student prefers **concise, direct** communication (no filler words)
- Uses **TypeScript** primarily, comfortable with **React**
- Likes **practical examples** over theory
- Appreciates **creative analogies** for complex concepts
- Wants **accelerated learning** — cover ground quickly
- Files should follow pattern: `vite-NN-lesson.md`
- Each lesson should include: objectives, analogies, code, takeaways, homework

---

*Training Context Document*  
*Last updated: All 8 lessons complete*
