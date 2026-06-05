# Vite Study Project - Step-by-Step Setup Guide
## Build Your Complete Vite Learning Environment

---

## 🎯 What You'll Build

A **Vite Study Dashboard** — a real application where you can:
- See Vite's HMR in action with live counters
- Import and display different asset types (images, SVGs, JSON)
- Toggle themes with CSS Variables and CSS Modules
- Use path aliases (`@components`, `@hooks`, `@assets`)
- Configure environment variables
- Lazy-load routes with code splitting
- Build and preview for production

---

## 📋 Prerequisites

```bash
# Check Node.js version (need 18+)
node --version

# If too old, install via:
# macOS: brew install node
# Or: https://nodejs.org
```

---

## Step 1: Create the Project (2 minutes)

```bash
# Create project with React + TypeScript
npm create vite@latest project -- --template react-ts

# Enter the project
cd project

# Install dependencies
npm install

# Start the dev server (verify it works!)
npm run dev
```

**Expected result:** Browser opens at `http://localhost:5173` showing the Vite + React starter page.

---

## Step 2: Install Additional Dependencies (2 minutes)

```bash
# Tailwind CSS
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Utility for className merging (optional but useful)
npm install clsx tailwind-merge

# For SVG as React components
npm install -D vite-plugin-svgr

# For build analysis
npm install -D rollup-plugin-visualizer

# For icons
npm install lucide-react
```

---

## Step 3: Configure Tailwind CSS (3 minutes)

### Update `tailwind.config.js`
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#646cff',
        secondary: '#535bf2',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
```

### Update `src/index.css`
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply bg-gray-50 text-gray-900 antialiased;
  }
}

@layer components {
  .btn-primary {
    @apply px-4 py-2 bg-primary text-white rounded-lg font-medium
           hover:bg-secondary transition-colors duration-200
           focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2;
  }
  
  .card {
    @apply bg-white rounded-xl shadow-sm border border-gray-200 p-6;
  }
}
```

---

## Step 4: Configure Vite (5 minutes)

### Create `vite.config.ts`
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import svgr from 'vite-plugin-svgr'
import { visualizer } from 'rollup-plugin-visualizer'
import path from 'path'

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    svgr(),
    mode === 'analyze' && visualizer({
      open: true,
      gzipSize: true,
      filename: 'dist/stats.html',
    }),
  ].filter(Boolean),
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@assets': path.resolve(__dirname, './src/assets'),
      '@lib': path.resolve(__dirname, './src/lib'),
    },
  },
  
  server: {
    port: 3000,
    open: true,
  },
  
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-ui': ['lucide-react'],
        },
      },
    },
  },
}))
```

### Update `tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@components/*": ["src/components/*"],
      "@hooks/*": ["src/hooks/*"],
      "@assets/*": ["src/assets/*"],
      "@lib/*": ["src/lib/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

---

## Step 5: Create Project Structure (2 minutes)

```bash
# Create directories
mkdir -p src/{components,hooks,lib,pages,types}
mkdir -p src/components/ui
mkdir -p public/data

# Verify structure
tree src
```

**Expected structure:**
```
src/
├── assets/           # Processed assets (images, SVGs)
├── components/
│   ├── ui/          # Reusable UI components (Button, Card, etc.)
│   └── ...          # Feature components
├── hooks/           # Custom React hooks
├── lib/             # Utility functions
├── pages/           # Page components (for routing)
├── types/           # TypeScript types
├── App.tsx          # Root component
├── main.tsx         # Entry point
└── index.css        # Global styles + Tailwind
```

---

## Step 6: Create Reusable Components (10 minutes)

### `src/components/ui/Button.tsx`
```tsx
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Utility for cleaner Tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline'
  size?: 'sm' | 'md' | 'lg'
}

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
        'disabled:pointer-events-none disabled:opacity-50',
        {
          'bg-primary text-white hover:bg-secondary': variant === 'primary',
          'bg-gray-100 text-gray-900 hover:bg-gray-200': variant === 'secondary',
          'border-2 border-primary text-primary hover:bg-primary/5': variant === 'outline',
          'h-8 px-3 text-sm': size === 'sm',
          'h-10 px-4': size === 'md',
          'h-12 px-6 text-lg': size === 'lg',
        },
        className
      )}
      {...props}
    />
  )
}
```

### `src/components/ui/Card.tsx`
```tsx
import { cn } from '@lib/utils'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  description?: string
}

export function Card({ className, title, description, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-gray-200 bg-white shadow-sm',
        'hover:shadow-md transition-shadow duration-200',
        className
      )}
      {...props}
    >
      {(title || description) && (
        <div className="p-6 border-b border-gray-100">
          {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
          {description && (
            <p className="mt-1 text-sm text-gray-500">{description}</p>
          )}
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  )
}
```

### `src/lib/utils.ts`
```ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

---

## Step 7: Create Custom Hooks (5 minutes)

### `src/hooks/useCounter.ts`
```ts
import { useState, useCallback } from 'react'

export function useCounter(initial = 0) {
  const [count, setCount] = useState(initial)
  
  const increment = useCallback(() => setCount(c => c + 1), [])
  const decrement = useCallback(() => setCount(c => c - 1), [])
  const reset = useCallback(() => setCount(initial), [initial])
  
  return { count, increment, decrement, reset, setCount }
}
```

### `src/hooks/useLocalStorage.ts`
```ts
import { useState, useEffect, useCallback } from 'react'

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error)
      return initialValue
    }
  })
  
  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      window.localStorage.setItem(key, JSON.stringify(valueToStore))
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error)
    }
  }, [key, storedValue])
  
  return [storedValue, setValue] as const
}
```

---

## Step 8: Create Feature Components (10 minutes)

### `src/components/HMRDemo.tsx`
```tsx
import { useCounter } from '@hooks/useCounter'
import { Button } from '@components/ui/Button'
import { Card } from '@components/ui/Card'
import { RefreshCw } from 'lucide-react'

export function HMRDemo() {
  const { count, increment, decrement, reset } = useCounter(0)
  
  return (
    <Card
      title="🔥 HMR Demo"
      description="Edit this component and watch the count persist!"
    >
      <div className="flex flex-col items-center gap-4">
        <div className="text-4xl font-bold text-primary">{count}</div>
        
        <div className="flex gap-2">
          <Button onClick={decrement} variant="outline">-</Button>
          <Button onClick={increment}>+</Button>
        </div>
        
        <Button
          onClick={reset}
          variant="secondary"
          size="sm"
          className="flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Reset
        </Button>
        
        <p className="text-sm text-gray-500 text-center max-w-sm">
          Click the button a few times, then edit this text in{' '}
          <code className="bg-gray-100 px-1 rounded">HMRDemo.tsx</code>.
          The count will NOT reset!
        </p>
      </div>
    </Card>
  )
}
```

### `src/components/AssetShowcase.tsx`
```tsx
import { Card } from '@components/ui/Button'
import { Image, FileJson, Palette } from 'lucide-react'

// Import different asset types
import viteLogo from '/vite.svg'
import reactLogo from '@assets/react.svg'
import sampleData from '@assets/sample-data.json'

export function AssetShowcase() {
  return (
    <Card title="🖼️ Asset Showcase" description="Vite handles all file types">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* SVG from public/ */}
        <div className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-lg">
          <Image className="w-8 h-8 text-primary" />
          <p className="text-sm font-medium">Public SVG</p>
          <img src={viteLogo} alt="Vite" className="w-16 h-16" />
          <code className="text-xs bg-white px-2 py-1 rounded">
            /vite.svg
          </code>
        </div>
        
        {/* SVG from src/assets/ */}
        <div className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-lg">
          <Palette className="w-8 h-8 text-primary" />
          <p className="text-sm font-medium">Processed SVG</p>
          <img src={reactLogo} alt="React" className="w-16 h-16" />
          <code className="text-xs bg-white px-2 py-1 rounded">
            @assets/react.svg
          </code>
        </div>
        
        {/* JSON import */}
        <div className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-lg">
          <FileJson className="w-8 h-8 text-primary" />
          <p className="text-sm font-medium">JSON Data</p>
          <div className="text-xs text-gray-600">
            <p>Users: {sampleData.users.length}</p>
            <p>Version: {sampleData.version}</p>
          </div>
          <code className="text-xs bg-white px-2 py-1 rounded">
            @assets/sample-data.json
          </code>
        </div>
      </div>
    </Card>
  )
}
```

### Create `src/assets/sample-data.json`
```json
{
  "version": "1.0.0",
  "users": [
    { "id": 1, "name": "Alice", "role": "admin" },
    { "id": 2, "name": "Bob", "role": "user" },
    { "id": 3, "name": "Charlie", "role": "user" }
  ]
}
```

---

## Step 9: Create Environment Variable Demo (3 minutes)

### Create `.env.development`
```bash
VITE_APP_NAME=Vite Study Dashboard
VITE_APP_VERSION=1.0.0
VITE_API_URL=http://localhost:8080
VITE_BUILD_DATE=2024-01-15
```

### Create `.env.production`
```bash
VITE_APP_NAME=Vite Study Dashboard
VITE_APP_VERSION=1.0.0
VITE_API_URL=https://api.example.com
VITE_BUILD_DATE=2024-01-15
```

### `src/components/EnvInfo.tsx`
```tsx
import { Card } from '@components/ui/Card'
import { Settings, Globe, Calendar, Hash } from 'lucide-react'

export function EnvInfo() {
  const envVars = [
    { label: 'App Name', value: import.meta.env.VITE_APP_NAME, icon: Settings },
    { label: 'API URL', value: import.meta.env.VITE_API_URL, icon: Globe },
    { label: 'Build Date', value: import.meta.env.VITE_BUILD_DATE, icon: Calendar },
    { label: 'Mode', value: import.meta.env.MODE, icon: Hash },
  ]
  
  return (
    <Card title="⚙️ Environment" description="Variables from .env files">
      <div className="space-y-3">
        {envVars.map(({ label, value, icon: Icon }) => (
          <div key={label} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Icon className="w-5 h-5 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">{label}</span>
            </div>
            <code className="text-sm bg-white px-2 py-1 rounded border text-primary">
              {value}
            </code>
          </div>
        ))}
      </div>
    </Card>
  )
}
```

---

## Step 10: Create the Main App (5 minutes)

### Update `src/App.tsx`
```tsx
import { HMRDemo } from '@components/HMRDemo'
import { AssetShowcase } from '@components/AssetShowcase'
import { EnvInfo } from '@components/EnvInfo'
import { Card } from '@components/ui/Card'
import { Zap, Github } from 'lucide-react'

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {import.meta.env.VITE_APP_NAME}
                </h1>
                <p className="text-sm text-gray-500">
                  A hands-on Vite learning environment
                </p>
              </div>
            </div>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <Github className="w-5 h-5" />
              <span className="text-sm font-medium">Source</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <HMRDemo />
          <AssetShowcase />
          <EnvInfo />
          <Card title="📚 Next Steps" description="Continue your Vite journey">
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">→</span>
                Try editing any component and watch HMR update instantly
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">→</span>
                Run{' '}
                <code className="bg-gray-100 px-1 rounded">npm run build</code>
                {' '}and examine the{' '}
                <code className="bg-gray-100 px-1 rounded">dist/</code> folder
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">→</span>
                Add a new route with dynamic{' '}
                <code className="bg-gray-100 px-1 rounded">import()</code>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">→</span>
                Configure{' '}
                <code className="bg-gray-100 px-1 rounded">@vitejs/plugin-legacy</code>
                {' '}for old browser support
              </li>
            </ul>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white mt-12">
        <div className="max-w-6xl mx-auto px-4 py-6 text-center text-sm text-gray-500">
          Built with ⚡ Vite + React + TypeScript + Tailwind CSS
        </div>
      </footer>
    </div>
  )
}

export default App
```

### Update `src/main.tsx`
```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

---

## Step 11: Test Everything (5 minutes)

### Start Dev Server
```bash
npm run dev
```

**Verify these features:**
1. ✅ Page loads at `localhost:3000`
2. ✅ Counter increments/decrements
3. ✅ Increment counter, edit `HMRDemo.tsx` text → count persists
4. ✅ Environment variables display correctly
5. ✅ Assets (logos, JSON) load correctly
6. ✅ Tailwind styles applied

### Build for Production
```bash
npm run build
```

**Verify:**
1. ✅ `dist/` folder created
2. ✅ Files have content hashes (`index-a3f7b2c1.js`)
3. ✅ CSS extracted to separate file
4. ✅ Source maps generated (if configured)

### Preview Production Build
```bash
npm run preview
```

**Verify:**
1. ✅ Production build works at `localhost:4173`
2. ✅ Check DevTools Network tab — files are loaded with hashes

---

## Step 12: Add Build Analysis (Optional, 2 minutes)

### Run with analysis mode
```bash
# Add to package.json scripts:
"analyze": "vite build --mode analyze"

# Run it
npm run analyze
```

**Result:** `dist/stats.html` opens automatically showing interactive treemap.

---

## 📁 Final Project Structure

```
project/
├── public/
│   └── vite.svg
├── src/
│   ├── assets/
│   │   ├── react.svg
│   │   └── sample-data.json
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   └── Card.tsx
│   │   ├── AssetShowcase.tsx
│   │   ├── EnvInfo.tsx
│   │   └── HMRDemo.tsx
│   ├── hooks/
│   │   ├── useCounter.ts
│   │   └── useLocalStorage.ts
│   ├── lib/
│   │   └── utils.ts
│   ├── App.tsx
│   ├── main.tsx
│   ├── index.css
│   └── vite-env.d.ts
├── .env.development
├── .env.production
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

---

## 🚀 Next Steps for Your Learning

### Exercise 1: Add Code Splitting
Create a new page component and lazy-load it:
```tsx
const HeavyPage = lazy(() => import('./pages/HeavyPage'))
```

### Exercise 2: Add CSS Modules
Create `Button.module.css` and use it alongside Tailwind.

### Exercise 3: Configure PWA
Install `vite-plugin-pwa` and make the app installable.

### Exercise 4: Add Testing
Install `vitest` and write a test for `useCounter`.

### Exercise 5: Deploy
Deploy to Cloudflare Pages:
```bash
# Cloudflare Pages
npm install -g wrangler
wrangler pages deploy dist
```

---

## 🐛 Troubleshooting

### "Cannot find module '@components/...'"
- Restart TypeScript server in VS Code (`Cmd+Shift+P` → "Restart TS Server")
- Verify `tsconfig.json` paths match `vite.config.ts` aliases

### "Tailwind classes not working"
- Ensure `content` in `tailwind.config.js` includes your file paths
- Check that `postcss.config.js` exists and is correct
- Restart dev server

### "Build fails with TypeScript error"
- Run `npx tsc --noEmit` to see all errors
- Check `tsconfig.json` strict mode settings

### "Assets not loading in production"
- Use `import` for `src/assets/` (processed)
- Use absolute paths `/file.png` for `public/` (copied as-is)

---

## 📚 Reference Commands

```bash
# Development
npm run dev              # Start dev server
npm run dev -- --host    # Expose to network

# Production
npm run build            # Build for production
npm run preview          # Preview production build
npm run analyze          # Build with bundle analyzer

# Dependencies
npm install [package]             # Install dependency
npm install -D [package]          # Install dev dependency
```

---

## 🎓 What You've Learned

By completing this setup, you now have a project that demonstrates:
- ✅ Vite dev server with instant HMR
- ✅ TypeScript with strict mode
- ✅ Tailwind CSS with custom components
- ✅ Path aliases (`@components`, `@hooks`)
- ✅ Environment variables
- ✅ Asset imports (SVG, JSON)
- ✅ Production build with code splitting
- ✅ Bundle analysis

**This is your sandbox.** Edit, break, fix, and experiment. The best way to learn Vite is to use it.

---

*Vite Study Project - Setup Guide*
*Happy coding! ⚡*
