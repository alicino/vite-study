# Vite Deep Dive - Lesson 03
## Assets, Styling, Plugins, and Production Optimization

---

## 🎯 Learning Objectives

By the end of this lesson, you will:
- Understand how Vite handles every file type (CSS, images, fonts, JSON, WASM)
- Master CSS Modules, PostCSS, and Tailwind integration
- Configure advanced plugins (PWA, legacy support, SSR)
- Debug and analyze production builds
- Know the full asset pipeline from source to browser

---

## 🍔 Analogy: The Vite File Restaurant

Imagine Vite as a gourmet restaurant. Every file type is a different ingredient, and Vite has a specialized chef for each one:

```
CUSTOMER (Browser) orders: "Give me the full meal"

VITE KITCHEN:
├── .tsx files    → React Chef (plugin-react)
│                   Transforms JSX, adds Fast Refresh
│
├── .css files    → Style Chef (built-in)
│                   Inlines small files, links large ones
│
├── .scss files   → SASS Chef (sass preprocessor)
│                   Compiles to CSS, then processes
│
├── .svg files    → Asset Chef (built-in)
│                   Imports as URL, React component, or inline string
│
├── .png/.jpg     → Image Chef (built-in)
│                   Optimizes, generates WebP, creates srcset
│
├── .json files   → JSON Chef (built-in)
│                   Imports as JavaScript object
│
├── .wasm files   → WebAssembly Chef (built-in)
│                   Loads asynchronously, exposes JS API
│
└── .env files    → Config Chef (built-in)
                    Injects variables at build time
```

**Key insight:** You just `import` anything. Vite figures out the rest.

---

## 🎨 The Styling Pipeline: From SASS to Browser

### CSS in Vite: Zero Config

```css
/* src/styles/global.css */
@import './variables.css';  /* Vite handles @import */

body {
  margin: 0;
  background: var(--primary-color);
}
```

```tsx
// src/main.tsx
import './styles/global.css'  // Just import it. Vite injects it.
```

**What Vite does automatically:**
1. Finds the CSS import
2. Resolves `@import` statements
3. Processes with PostCSS (autoprefixer, etc.)
4. Injects into `<style>` tag in dev
5. Extracts to `.css` file in production

### CSS Modules: Scoped Styles

```css
/* Button.module.css */
.button {
  padding: 1rem;
  background: blue;
}

.primary {
  composes: button;        /* Compose classes */
  background: green;
}
```

```tsx
// Button.tsx
import styles from './Button.module.css'

export function Button() {
  return (
    <button className={styles.primary}>
      Click me
    </button>
  )
}

// Result in HTML:
// <button class="Button_primary_a3f7">
//   (hashed class name = no conflicts!)
// </button>
```

**CSS Modules naming convention:**
```
styles.module.css    → CSS Modules (scoped)
styles.css           → Global CSS (affects everything)
```

### Configuring CSS Modules
```typescript
// vite.config.ts
export default defineConfig({
  css: {
    modules: {
      // Naming pattern: component_class_hash
      localsConvention: 'camelCase',  // my-class → myClass
      
      // Generate shorter names in production
      generateScopedName: (name, filename, css) => {
        if (process.env.NODE_ENV === 'production') {
          return `_${name.slice(0, 2)}_${Math.random().toString(36).slice(2, 5)}`
        }
        return `${filename}__${name}`  // Dev: readable
      }
    },
    
    // Source maps: see original SCSS in DevTools
    devSourcemap: true,
    
    // Preprocessor options
    preprocessorOptions: {
      scss: {
        additionalData: `
          @use "./src/styles/vars.scss" as *;
          $env: "${process.env.NODE_ENV}";
        `,
      },
      less: {
        math: 'always',
      },
    },
  }
})
```

### PostCSS: The Secret Weapon

PostCSS transforms CSS with JavaScript plugins. Vite applies it automatically:

```javascript
// postcss.config.js
export default {
  plugins: {
    'postcss-import': {},        // Inline @imports
    'tailwindcss': {},           // Tailwind (see below)
    'autoprefixer': {},          // Add vendor prefixes
    'postcss-preset-env': {      // Polyfill modern CSS
      stage: 1,                  // Experimental features
      features: {
        'nesting-rules': true,   // Native CSS nesting
      }
    },
    // Production only:
    ...(process.env.NODE_ENV === 'production' ? {
      'cssnano': {               // Minify CSS
        preset: ['default', { discardComments: { removeAll: true } }]
      }
    } : {})
  }
}
```

### Tailwind CSS Integration

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

```javascript
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: '#646cff',
      },
    },
  },
  plugins: [],
}
```

```css
/* src/index.css */
@tailwind base;      /* Reset + base styles */
@tailwind components; /* Component classes */
@tailwind utilities;  /* Utility classes (w-4, flex, etc.) */

/* Your custom styles */
@layer components {
  .btn-primary {
    @apply px-4 py-2 bg-brand text-white rounded;
  }
}
```

**The magic:** Tailwind scans your files, generates only used utilities. With Vite + PostCSS, this happens on every file save — **instantly**.

---

## 🖼️ The Asset Pipeline: Import Anything

### Images and Static Files

```tsx
// Method 1: Import (processed by Vite)
import logo from './assets/logo.png'
// Vite: Optimizes, hashes filename, returns URL

// Method 2: URL reference (public/ folder)
// Place file in public/images/logo.png
// Reference as: <img src="/images/logo.png" />
// Vite: Copies as-is, no processing

// Method 3: Dynamic import (lazy load)
const loadImage = async () => {
  const { default: imageUrl } = await import('./assets/huge-photo.jpg')
  return imageUrl
}
```

### The `public/` vs `src/assets/` Decision Tree

```
┌──────────────────────────────────────────────────────┐
│  "Should I put this file in public/ or src/assets/?"  │
└─────────────────────┬────────────────────────────────┘
                      │
          ┌───────────┴───────────┐
          │                       │
    ┌─────▼──────┐          ┌─────▼──────┐
│  Needs processing?  │      │  Just serve as-is?  │
│  (optimize, hash,   │      │  (favicon, robots,   │
│   import as module) │      │   static JSON)       │
└─────┬──────────────┘      └─────┬──────────────┘
      │                           │
      ▼                           ▼
 src/assets/logo.png        public/favicon.ico
      │                           │
      ▼                           ▼
 dist/assets/logo-a3f7.png   dist/favicon.ico
 (hashed, cacheable)         (exact name preserved)
```

### Importing SVGs: Three Strategies

```tsx
// Strategy 1: As URL (default)
import logoUrl from './logo.svg'
<img src={logoUrl} />
// Result: /assets/logo-[hash].svg

// Strategy 2: As React Component (with plugin)
// npm install -D vite-plugin-svgr
import { ReactComponent as Logo } from './logo.svg'
<Logo fill="red" width={100} />
// Result: Inline SVG, can style with props!

// Strategy 3: As raw string
import logoRaw from './logo.svg?raw'
console.log(logoRaw)  // The actual SVG XML string
```

### Vite Import Suffixes (Special Query Parameters)

```tsx
// These are Vite-specific! They change how files are loaded:

import script from './worker.js?worker'
// Loads as Web Worker (separate thread)

import json from './data.json?url'
// Returns URL string instead of parsed JSON

import inlineSvg from './icon.svg?inline'
// Forces inline (no separate file)

import wasm from './module.wasm?init'
// Returns initialization function

import css from './styles.css?inline'
// Returns CSS as string (for shadow DOM)
```

---

## 🔌 Advanced Plugins: Supercharge Vite

### Plugin Ecosystem Map

```
VITE PLUGIN CATEGORIES
│
├── Framework
│   ├── @vitejs/plugin-react    (Fast Refresh, JSX)
│   ├── @vitejs/plugin-vue      (SFC compiler)
│   ├── @vitejs/plugin-svelte   (Svelte compiler)
│   └── @vitejs/plugin-solid    (SolidJS)
│
├── Production Optimization
│   ├── @vitejs/plugin-legacy   (IE11 support!)
│   ├── vite-plugin-pwa         (Service Worker, offline)
│   └── vite-plugin-compression (gzip/brotli assets)
│
├── Developer Experience
│   ├── vite-plugin-checker     (TypeScript in parallel)
│   ├── vite-plugin-svgr        (SVG as components)
│   └── vite-plugin-inspect     (Debug plugin pipeline)
│
├── Styling
│   ├── vite-plugin-windicss    (Tailwind alternative)
│   ├── @unocss/vite            (Instant on-demand CSS)
│   └── vite-plugin-sass-dts    (SCSS type definitions)
│
├── Testing
│   ├── vitest                  (Vite-native test runner)
│   ├── @vitest/ui              (Browser UI for tests)
│   └── vite-plugin-cypress     (E2E testing)
│
└── Fullstack
    ├── vite-plugin-ssr         (Server-Side Rendering)
    ├── @vitejs/plugin-react-swc (SWC compiler, faster!)
    └── vite-plugin-cloudflare  (Cloudflare Pages/Workers adapter)
```

### Critical Plugin: `@vitejs/plugin-legacy`

**The problem:** Modern JavaScript (`??=`, `?.`, `#private`) breaks in old browsers.

```bash
npm install -D @vitejs/plugin-legacy
```

```typescript
// vite.config.ts
import legacy from '@vitejs/plugin-legacy'

export default defineConfig({
  plugins: [
    react(),
    legacy({
      targets: ['defaults', 'not IE 11'],  // Or include IE 11
      additionalLegacyPolyfills: ['regenerator-runtime/runtime'],
      modernPolyfills: true,
    })
  ]
})
```

**What it generates:**
```html
<!-- Modern browsers get this (smaller, faster) -->
<script type="module" src="/assets/app-[hash].js"></script>

<!-- Old browsers get this (polyfilled, larger) -->
<script nomodule src="/assets/app-legacy-[hash].js"></script>
```

**Analogy:** It's like serving two menus at a restaurant — one for foodies (modern browsers) with molecular gastronomy, and one for traditionalists (IE11) with classic dishes. Same meal, different preparation.

### Critical Plugin: `vite-plugin-pwa`

**Turn your app into an installable "Progressive Web App":**

```bash
npm install -D vite-plugin-pwa
```

```typescript
// vite.config.ts
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'My Vite App',
        short_name: 'ViteApp',
        theme_color: '#ffffff',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.example\.com\/.*/i,
            handler: 'CacheFirst',
            options: { cacheName: 'api-cache' }
          }
        ]
      }
    })
  ]
})
```

**What you get:**
- ⚡ Service Worker for offline support
- 📱 "Install App" prompt on mobile
- 🔄 Auto-update when new version deployed
- 📶 Caching strategies for API calls

---

## 🐛 Debugging Vite: Become a Detective

### Source Maps: See Your Real Code

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    sourcemap: true,        // Generate .map files
    // Options:
    // true      → Separate .map files
    // 'inline'  → Inline in bundle (larger, no separate request)
    // 'hidden'  → Map files but don't reference them
  }
})
```

**In DevTools:** With `devSourcemap: true`, you see your original TypeScript/SCSS, not compiled output.

### Error Overlay: The Red Screen

When your code has errors, Vite shows an overlay in the browser:

```
┌─────────────────────────────────────────────────────┐
│  ❌ ERROR                                           │
│                                                     │
│  src/App.tsx:15:23                                  │
│                                                     │
│  Cannot find name 'useCount'. Did you mean          │
│  'useState'?                                        │
│                                                     │
│  13 |   const [count, setCount] = useState(0)      │
│  14 |                                              │
│  15 >   const doubled = useCount(() => count * 2)  │
│      |                      ^^^^^^                 │
│                                                     │
│  [X] Close overlay  [📁] Open in editor             │
└─────────────────────────────────────────────────────┘
```

**Disable in config if annoying:**
```typescript
server: {
  hmr: { overlay: false }
}
```

### Build Analysis: See What's Inside

```bash
npm install -D rollup-plugin-visualizer
```

```typescript
// vite.config.ts
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  plugins: [
    react(),
    visualizer({
      open: true,           // Auto-open in browser
      gzipSize: true,       // Show gzipped sizes
      filename: 'stats.html'
    })
  ]
})
```

**Result:** Interactive treemap showing every module and its size. Perfect for finding bundle bloat!

```
┌──────────────────────────────────────────────────────┐
│  BUNDLE ANALYSIS (Interactive Treemap)               │
├──────────────────────────────────────────────────────┤
│                                                      │
│  ┌──────────────────────────────┐                    │
│  │      react-dom (120KB)       │                    │
│  │  ████████████████████████    │                    │
│  └──────────────────────────────┘                    │
│  ┌──────────────────┐ ┌──────────────┐              │
│  │  react (40KB)    │ │ lodash (30KB)│              │
│  │  ██████████      │ │ ████████     │              │
│  └──────────────────┘ └──────────────┘              │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────┐    │
│  │  Your Code   │ │   Other      │ │   ...    │    │
│  │  (15KB)      │ │   (25KB)     │ │          │    │
│  └──────────────┘ └──────────────┘ └──────────┘    │
│                                                      │
│  Total: 230KB  │  Gzipped: 78KB                      │
└──────────────────────────────────────────────────────┘
```

### vite-plugin-inspect: Debug the Pipeline

```bash
npm install -D vite-plugin-inspect
```

```typescript
plugins: [react(), inspect()]
```

Navigate to `/__inspect` in your dev server. See:
- How Vite transforms each file step-by-step
- Which plugins run in what order
- Raw vs transformed code side-by-side

---

## 🏭 Production Build Deep Dive

### What Happens When You Run `vite build`

```
Source Files
    │
    ├───► HTML Processing ──► Inline small assets
    │                          Inject preload links
    │
    ├───► TypeScript/JSX ──► esbuild (fast transpile)
    │                         Remove types
    │
    ├───► CSS Processing ──► PostCSS, CSS Modules
    │                         Extract to files
    │
    ├───► Asset Handling ──► Optimize images
    │                         Hash filenames
    │                         Generate WebP
    │
    └───► Rollup Bundling ─► Tree-shaking
                              Code splitting
                              Minification (esbuild)
                                  │
                                  ▼
                            dist/ folder
```

### Build Output Structure

```
dist/
├── index.html                    # Entry HTML (inlined assets)
├── assets/
│   ├── index-[hash].js          # Main JS chunk
│   ├── index-[hash].css         # Extracted CSS
│   ├── vendor-[hash].js         # React/ReactDOM (cached)
│   ├── Button-[hash].js         # Lazy-loaded component
│   ├── logo-[hash].png          # Hashed image (cache forever)
│   └── ...
└── (copied from public/)
    ├── favicon.ico              # Exact name preserved
    ├── robots.txt
    └── manifest.json
```

**Hashing strategy:** Files get content hashes (`-[hash]`). When content changes, hash changes, forcing browser re-download. When content is identical, hash is identical, browser uses cache.

### Code Splitting Strategies

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        // Strategy 1: Manual chunks (explicit)
        manualChunks: {
          // Vendor libraries (rarely change = cached)
          'vendor-react': ['react', 'react-dom'],
          'vendor-ui': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown'],
          // Feature chunks
          'feature-auth': ['./src/auth/login.tsx', './src/auth/register.tsx'],
        },
        
        // Strategy 2: Dynamic imports (automatic)
        // Vite splits at every import()
      }
    }
  }
})
```

```tsx
// Dynamic import = automatic code splitting
import { lazy, Suspense } from 'react'

// This creates a separate JS chunk!
const AdminPanel = lazy(() => import('./pages/AdminPanel'))

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <AdminPanel />
    </Suspense>
  )
}
```

---

## 🎓 Key Takeaways

1. **Vite handles ALL file types** — just `import` them. CSS, images, JSON, WASM, workers.

2. **`public/` vs `src/assets/`:**
   - `src/assets/`: Processed, hashed, optimized. Use for logos, icons, component images.
   - `public/`: Copied as-is. Use for `favicon.ico`, `robots.txt`, static JSON.

3. **CSS Modules** auto-scope styles. No more naming collisions.

4. **PostCSS runs automatically.** Add `tailwindcss`, `autoprefixer`, and custom plugins in `postcss.config.js`.

5. **Special import queries:** `?raw`, `?url`, `?inline`, `?worker` change how files load.

6. **Production build uses Rollup** for tree-shaking, code splitting, and minification. `esbuild` handles fast transpilation.

7. **Plugins extend everything:** Legacy browser support, PWA, testing, SSR. The ecosystem is vast.

---

## 📝 Quick Reference Card

```
┌─────────────────────────────────────────────────────────┐
│                    FILE HANDLING                         │
├─────────────────────────────────────────────────────────┤
│  import x from './x.png'        → URL (hashed in prod) │
│  import x from './x.svg?react'  → React component      │
│  import x from './x.svg?raw'    → String               │
│  import x from './x.json'       → Parsed object        │
│  import x from './x.css'        → Injected stylesheet  │
│  import x from './x.module.css' → CSS Modules object   │
│  import Worker from './x?worker'→ Web Worker           │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                    ASSET LOCATIONS                       │
├─────────────────────────────────────────────────────────┤
│  src/assets/logo.png    → Processed, hashed, optimized │
│  public/favicon.ico     → Copied as-is to dist/        │
│  public/robots.txt      → Exact name preserved         │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                    POSTCSS CONFIG                        │
├─────────────────────────────────────────────────────────┤
│  export default {                                        │
│    plugins: {                                            │
│      tailwindcss: {},                                    │
│      autoprefixer: {},                                   │
│      ...(prod && { cssnano: {} })                       │
│    }                                                     │
│  }                                                       │
└─────────────────────────────────────────────────────────┘
```

---

## 🚀 What's Next (Lesson 04 Preview)

In Lesson 04, we will:
- Build a complete real-world project with Vite
- Configure a fullstack setup (API proxy, SSR, or static generation)
- Optimize for Core Web Vitals (LCP, CLS, INP)
- Deploy to production (Cloudflare Pages, Netlify)
- Performance profiling and Lighthouse optimization

---

## 📚 Homework

1. Add Tailwind CSS to your Vite project and create a responsive layout
2. Import an SVG as a React component using `vite-plugin-svgr`
3. Create a CSS Module for a component and verify scoped classes in DevTools
4. Add `@vitejs/plugin-legacy` and test in an older browser (or use BrowserStack)
5. Run `vite build` with `rollup-plugin-visualizer` and analyze your bundle
6. Create a lazy-loaded route using dynamic `import()` and verify the separate chunk
7. (Bonus) Add `vite-plugin-pwa` and install your app on your phone!

---

*Lesson 03 - Vite Deep Dive*
*Created for accelerated learning path*
