# Vite in Practice - Lesson 02
## From Zero to Hero: Setting Up, Configuring, and Understanding the Dev Server

---

## 🎯 Learning Objectives

By the end of this lesson, you will:
- Create a Vite project from scratch and understand every file
- Master `vite.config.js` and its core options
- See Hot Module Replacement (HMR) in action
- Configure TypeScript, path aliases, and environment variables
- Compare a Vite React project vs Create React App (CRA)

---

## 🏗️ Analogy: Building a House

Imagine you're building a house. There are two approaches:

### The CRA Way (The Prefab Mystery Box)
```
You buy a "house kit" from the store.
┌─────────────────────────────────────┐
│  CRA gives you a sealed box labeled │
│  "React House - Do Not Open"        │
│                                     │
│  Inside: 500+ hidden files          │
│  Config: Black box                  │
│  Customization: "Eject" = Pandora's │
│                 box, irreversible   │
│                                     │
│  You: "Can I move the kitchen?"     │
│  CRA: "No."                         │
└─────────────────────────────────────┘
```

### The Vite Way (The Transparent LEGO Set)
```
You buy a LEGO set where every piece is visible.
┌─────────────────────────────────────┐
│  Vite gives you a small box with    │
│  exactly 12 pieces.                 │
│                                     │
│  Config: Open, explicit, editable   │
│  Structure: Crystal clear           │
│  Customization: Just edit the file  │
│                                     │
│  You: "Can I move the kitchen?"     │
│  Vite: "Sure, edit kitchen.config"  │
└─────────────────────────────────────┘
```

---

## 🚀 Project Setup: The Vite Scaffold

### Step 1: Create Project
```bash
# Interactive wizard - choose your framework
npm create vite@latest my-vite-app

# Or specify everything in one command
npm create vite@latest my-vite-app -- --template react-ts

# Available templates:
# vanilla, vanilla-ts
# vue, vue-ts
# react, react-ts
# preact, preact-ts
# lit, lit-ts
# svelte, svelte-ts
# solid, solid-ts
```

### Step 2: What Vite Creates (React-TS Example)
```
my-vite-app/
├── public/                    # Static assets (copied as-is)
│   └── vite.svg              # The Vite logo
│
├── src/
│   ├── assets/               # Processed assets (imported, hashed)
│   │   └── react.svg
│   ├── App.css               # Component styles
│   ├── App.tsx               # Root component
│   ├── index.css             # Global styles
│   └── main.tsx              # Entry point (mounts React)
│
├── index.html                # THE MOST IMPORTANT FILE
├── package.json              # Scripts: dev, build, preview
├── tsconfig.json             # TypeScript config
├── tsconfig.app.json         # App-specific TS config
├── tsconfig.node.json        # Vite's own TS config
├── vite.config.ts            # Vite configuration
└── README.md
```

### 🔑 The `index.html` Is The Entry Point

This is Vite's superpower and biggest difference from Webpack:

```html
<!-- index.html -->
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Vite + React + TS</title>
  </head>
  <body>
    <div id="root"></div>
    <!-- Vite handles this script tag magically -->
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

**Why this matters:**
```
Webpack: "I start from JavaScript, then inject HTML"
         Entry: src/index.js
         HTML: Generated automatically (hidden)

Vite:    "I start from HTML, then find JavaScript"
         Entry: index.html
         JS: Linked via <script> tag (explicit)
```

**Analogy:** Webpack is a chef who starts cooking and THEN builds a restaurant around the food. Vite is an architect who designs the restaurant (HTML) first, then installs the kitchen (JS).

---

## ⚙️ Deep Dive: `vite.config.ts`

The heart of Vite customization. Let's dissect it layer by layer.

### Basic Config Structure
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// defineConfig gives you TypeScript autocomplete!
export default defineConfig({
  // ==========================================
  // PLUGINS: The power-ups
  // ==========================================
  plugins: [
    react(),  // JSX transform, Fast Refresh (HMR)
    // Add more plugins here:
    // svgr(),      // Import SVGs as React components
    // eslint(),    // Run ESLint during build
    // checker({ typescript: true }), // Type-check in parallel
  ],

  // ==========================================
  // SERVER: Dev server behavior
  // ==========================================
  server: {
    port: 3000,           // Your localhost:3000
    open: true,           // Auto-open browser
    strictPort: true,     // Fail if 3000 is taken (don't try 3001)
    
    // Proxy API calls to backend (CRITICAL for fullstack!)
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        // /api/users  -->  http://localhost:8080/api/users
      },
    },
    
    // Hot Module Replacement options
    hmr: {
      overlay: true,      // Show errors in browser overlay
    },
  },

  // ==========================================
  // BUILD: Production output
  // ==========================================
  build: {
    outDir: 'dist',       // Output folder (default)
    sourcemap: true,      // Generate .map files for debugging
    
    // Code splitting strategy
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate vendor code into its own chunk
          vendor: ['react', 'react-dom'],
          // Result: vendor-[hash].js (cached forever!)
        },
      },
    },
    
    // Minification (default: esbuild, super fast)
    minify: 'esbuild',
    // Alternative: 'terser' (slower, smaller)
  },

  // ==========================================
  // RESOLVE: Module resolution
  // ==========================================
  resolve: {
    alias: {
      // @/components/Button --> src/components/Button
      '@': '/src',
      
      // You can also use path module for robustness:
      // '@': path.resolve(__dirname, './src'),
    },
  },

  // ==========================================
  // CSS: Stylesheet handling
  // ==========================================
  css: {
    devSourcemap: true,   // See original SCSS/LESS in DevTools
    modules: {
      localsConvention: 'camelCase', // style['my-class'] -> style.myClass
    },
    preprocessorOptions: {
      scss: {
        additionalData: `@use "~/styles/vars.scss" as *;`, // Auto-import variables
      },
    },
  },

  // ==========================================
  // PREVIEW: Test production build locally
  // ==========================================
  preview: {
    port: 4173,           // Default preview port
    open: true,
  },
})
```

### The Config Hierarchy (Mental Model)
```
                    VITE DEFAULTS
                         │
              ┌──────────┴──────────┐
              │                     │
         CONFIG FILE          ENV VARS
      (vite.config.ts)    (VITE_* in .env)
              │                     │
              └──────────┬──────────┘
                         │
                    CLI FLAGS
                 (--port, --host)
                         │
                         ▼
                   FINAL CONFIG
              (CLI > Env > File > Defaults)
```

**Rule:** Command line flags override everything. Environment variables override config file. Config file overrides defaults.

---

## 🔥 HMR: Hot Module Replacement in Action

### What Is HMR?

Imagine you're painting a mural:
- **Without HMR (Webpack):** You change one color. You must destroy the entire mural and repaint from scratch. (3-5 seconds)
- **With HMR (Vite):** You change one color. Only that section updates instantly. (50ms)

### How It Works Under the Hood

```
┌─────────────┐    Save File     ┌──────────────┐
│   Editor    │ ───────────────► │  Vite Server │
│  (VS Code)  │                  │  (Node.js)   │
└─────────────┘                  └──────┬───────┘
                                        │
                    1. Transform file   │
                    2. Compare with prev│
                    3. Send diff        │
                                        │ WebSocket
                                        ▼
                               ┌──────────────┐
                               │   Browser    │
                               │  (WebSocket  │
                               │   listener)  │
                               └──────┬───────┘
                                      │
                    4. Receive update │
                    5. Replace module │
                    6. Keep state!    │
                                      ▼
                               ┌──────────────┐
                               │  React/Vue   │
                               │  reconciles  │
                               │  DOM (fast)  │
                               └──────────────┘
```

### Live Example: HMR With State Preservation

```tsx
// Counter.tsx
import { useState } from 'react'

export function Counter() {
  const [count, setCount] = useState(0)

  return (
    <button onClick={() => setCount(c => c + 1)}>
      Count is: {count}
    </button>
  )
}
```

**Scenario:**
```
Step 1: User clicks button 5 times
        Count is: 5
        
Step 2: Developer changes button text to "Clicks:"
        WITHOUT HMR: Page reloads, count resets to 0
        WITH VITE HMR: Button text updates, count STAYS 5
```

**The Magic:** React Fast Refresh (via `@vitejs/plugin-react`) patches the component while preserving hooks state.

### HMR Limitations (Know the Boundaries)
```tsx
// This works (component change):
const Button = () => <button>Click me</button>
// Edit to: <button>Click me NOW</button> ✅ Updates instantly

// This needs full reload (hook signature change):
const Button = () => {
  const [x] = useState(0)
  // Add: const [y] = useState(0)  ❌ Full reload required
}

// This works (CSS change):
import './Button.css'
// Edit CSS file ✅ Updates without touching JS
```

---

## 🛤️ Path Aliases: The GPS for Your Imports

### The Problem
```tsx
// The " ../../../../ " nightmare
import { Button } from '../../../../components/Button'
import { utils } from '../../../../lib/utils'
import { hooks } from '../../../../hooks/useAuth'

// File moves? Every import breaks.
// Refactoring? Good luck finding all references.
```

### The Solution (Vite Aliases)
```tsx
// vite.config.ts
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@lib': path.resolve(__dirname, './src/lib'),
    },
  },
})

// Also update tsconfig.json for IDE support!
// {
//   "compilerOptions": {
//     "baseUrl": ".",
//     "paths": {
//       "@/*": ["src/*"],
//       "@components/*": ["src/components/*"]
//     }
//   }
// }
```

### Result: Clean, Move-Safe Imports
```tsx
// Before (fragile):
import { Button } from '../../../../components/Button'

// After (robust):
import { Button } from '@components/Button'

// File moves from src/components/Button.tsx 
// to src/ui/Button.tsx?
// Just update alias in ONE place (vite.config.ts)
```

**Analogy:** Aliases are like nicknames. Instead of saying "the person who lives at 123 Oak Street, Apartment 4B, who is my second cousin twice removed," you just say "@alice." If Alice moves, you update the address book (config), not every conversation (file).

---

## 🔐 Environment Variables: Secrets & Config

### How Vite Handles `.env` Files

Vite automatically loads `.env` files:
```
.env                # Loaded in all cases
.env.local          # Loaded in all cases, ignored by git
.env.[mode]         # Loaded only in specific mode
.env.[mode].local   # Loaded only in mode, ignored by git
```

**Modes:** `development` (npm run dev), `production` (npm run build), or custom (npm run build -- --mode staging)

### The VITE_ Prefix Rule
```bash
# .env.development
VITE_API_URL=http://localhost:8080        # ✅ Accessible in browser
VITE_APP_NAME=My Cool App                 # ✅ Accessible in browser

API_SECRET_KEY=super-secret-123           # ❌ NOT accessible in browser
DATABASE_URL=postgres://...               # ❌ NOT accessible in browser
```

```tsx
// App.tsx
// Vite injects these at build time via import.meta.env
function App() {
  // ✅ Works: VITE_ prefix
  const apiUrl = import.meta.env.VITE_API_URL
  
  // ❌ undefined: No VITE_ prefix (security!)
  const secret = import.meta.env.API_SECRET_KEY

  return (
    <div>
      <h1>{import.meta.env.VITE_APP_NAME}</h1>
      <p>API: {apiUrl}</p>
    </div>
  )
}
```

### TypeScript Support for env vars
```typescript
// src/env.d.ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_APP_NAME: string
  // Add your env vars here for autocomplete!
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
```

**Security Note:** `import.meta.env` is compiled away at build time. The values become hardcoded strings in your bundle. **Never put secrets in VITE_ variables** — they WILL be visible to anyone who opens DevTools.

---

## ⚖️ Vite vs Create React App: Head-to-Head

### File Structure Comparison

```
CRA PROJECT (react-scripts)          VITE PROJECT
│                                    │
├── node_modules/  (600MB+)          ├── node_modules/  (150MB)
├── public/                          ├── public/
│   ├── index.html  (CRA-controlled) │   └── vite.svg
│   └── ...                          │
├── src/                             ├── src/
│   ├── index.js  (entry)            │   ├── main.tsx  (entry)
│   └── ...                          │   └── ...
│                                    │
├── package.json                     ├── package.json
│   { "react-scripts": "5.x" }       │   { "vite": "5.x" }
│                                    │
└── NO vite.config.js                ├── vite.config.ts
    (config hidden inside            │   (explicit, editable)
     react-scripts)                  │
                                     ├── tsconfig.json
                                     └── index.html (you control it!)
```

### Speed Comparison

| Operation | CRA (Webpack) | Vite | Difference |
|-----------|---------------|------|------------|
| Install deps | 2-3 minutes | 30 seconds | **4-6x faster** |
| First dev start | 15-30s | 0.5-2s | **10-15x faster** |
| HMR (change CSS) | 2-3s | 20ms | **100x+ faster** |
| HMR (change JSX) | 3-5s | 50ms | **60-100x faster** |
| Production build | 40-60s | 15-30s | **2-3x faster** |

### Migration from CRA to Vite

```bash
# Step 1: Remove CRA
npm uninstall react-scripts

# Step 2: Install Vite
npm install -D vite @vitejs/plugin-react

# Step 3: Create vite.config.ts
# (See config example above)

# Step 4: Move public/index.html to root
# Change: <div id="root"></div>
# Add:    <script type="module" src="/src/main.tsx"></script>

# Step 5: Update package.json scripts
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  }
}

# Step 6: Update env vars (REACT_APP_ → VITE_)
# Step 7: npm run dev → Enjoy warp speed
```

---

## 🧪 Hands-On Exercise: Build a Feature with Vite

### Exercise: Create a "Dev Dashboard" that showcases Vite features

```tsx
// src/App.tsx
import { useState } from 'react'
import './App.css'

// Import an image (Vite handles this automatically!)
import viteLogo from '/vite.svg'

// Path alias in action
import { useLocalStorage } from '@hooks/useLocalStorage'

function App() {
  const [count, setCount] = useState(0)
  const [theme, setTheme] = useLocalStorage('theme', 'light')

  return (
    <div className={`app ${theme}`}>
      <header>
        <img src={viteLogo} className="logo" alt="Vite logo" />
        <h1>Vite Dev Dashboard</h1>
      </header>

      <section className="card">
        <h2>HMR Test Zone</h2>
        <button onClick={() => setCount(c => c + 1)}>
          Count: {count}
        </button>
        <p>
          Try changing the button text above.
          Notice the count doesn't reset!
        </p>
      </section>

      <section className="card">
        <h2>Environment</h2>
        <p>App Name: {import.meta.env.VITE_APP_NAME}</p>
        <p>API URL: {import.meta.env.VITE_API_URL}</p>
        <p>Mode: {import.meta.env.MODE}</p>
      </section>

      <section className="card">
        <h2>Theme (State Persistence)</h2>
        <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
          Toggle Theme: {theme}
        </button>
      </section>
    </div>
  )
}

export default App
```

```css
/* App.css */
.app {
  padding: 2rem;
  transition: background-color 0.3s;
}

.app.light {
  background: #ffffff;
  color: #333;
}

.app.dark {
  background: #1a1a2e;
  color: #eee;
}

.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}

.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}

.card {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1.5rem;
  margin: 1rem 0;
}

button {
  padding: 0.6em 1.2em;
  font-size: 1em;
  font-weight: 500;
  background: #1a1a1a;
  color: white;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  transition: background 0.25s;
}

button:hover {
  background: #535bf2;
}
```

---

## 🎓 Key Takeaways

1. **`index.html` is the entry point** — not JS. This is fundamentally different from Webpack/CRA.

2. **`vite.config.ts` is small but powerful** — plugins, server, build, resolve, and CSS options cover 90% of use cases.

3. **HMR preserves state** — edit components without losing user input or scroll position.

4. **Path aliases (`@/`)** eliminate `../../` hell and make refactoring painless.

5. **Environment variables need `VITE_` prefix** to reach the browser. Everything else stays server-side.

6. **Migrating from CRA is straightforward** — swap `react-scripts` for Vite, update scripts, move `index.html`.

---

## 📝 Quick Reference Card

```
┌─────────────────────────────────────────────────────────┐
│                    VITE FILE STRUCTURE                   │
├─────────────────────────────────────────────────────────┤
│  index.html          ← Entry point (not src/main.tsx!) │
│  vite.config.ts      ← All configuration (tiny file)   │
│  src/                ← Source code                      │
│  public/             ← Static assets (copied as-is)     │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                    ESSENTIAL CONFIG                      │
├─────────────────────────────────────────────────────────┤
│  plugins: [react()]         ← Framework support         │
│  server: { port: 3000 }     ← Dev server options        │
│  build: { outDir: 'dist' }  ← Production output         │
│  resolve: { alias: { '@': '/src' } }  ← Path aliases    │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                    ENV VARIABLES                         │
├─────────────────────────────────────────────────────────┤
│  .env.development        ← Dev-only vars                │
│  .env.production         ← Production-only vars         │
│  VITE_API_URL=...        ← Must start with VITE_        │
│  import.meta.env.VITE_*  ← Access in code               │
└─────────────────────────────────────────────────────────┘
```

---

## 🚀 What's Next (Lesson 03 Preview)

In Lesson 03, we will:
- Understand how Vite handles different file types (CSS, SCSS, images, JSON, WASM)
- Configure CSS Modules, PostCSS, and Tailwind CSS
- Import assets (images, fonts, SVGs) and understand how Vite processes them
- Explore advanced plugins: PWA, SSR, legacy browser support
- Debug Vite: sourcemaps, error overlay, build analysis

---

## 📚 Homework

1. Create a Vite + React + TypeScript project from scratch
2. Add path aliases (`@components`, `@hooks`, `@lib`) and use them
3. Create a `.env.development` with `VITE_API_URL` and display it in a component
4. Test HMR: Create a counter, increment it, then edit the component's text. Does state persist?
5. Compare the `node_modules` size and startup time with any CRA project you have
6. (Bonus) Try `npm run build` and then `npm run preview` — examine the `dist/` folder

---

*Lesson 02 - Vite in Practice*
*Created for accelerated learning path*
