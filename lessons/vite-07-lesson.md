# 🔌 Lesson 07: Writing Custom Vite Plugins

> **"Vite plugins are the spices in your build pipeline — the right ones transform ordinary code into something remarkable."**

---

## 🎯 Learning Objectives

By the end of this lesson, you will:

- Understand the Vite plugin lifecycle and hook execution order
- Write typed custom plugins using the `Plugin` interface
- Use `transform`, `load`, and `resolveId` hooks for file processing
- Configure plugins with user-defined options
- Control plugin ordering with `enforce` and `apply`
- Test plugins with Vitest
- Debug plugins with `vite-plugin-inspect`

---

## 🤔 Why Write Custom Plugins?

Think of a Vite plugin as a **specialized kitchen station** in a restaurant. The line cook (Vite core) handles the basics — chopping, sautéing, plating. But sometimes you need a dedicated station for specific tasks: a sushi bar for raw fish, a pastry station for desserts, a grill for steaks.

Custom plugins let you add specialized stations to your build pipeline without rewriting the entire kitchen.

**Common use cases:**

| Need | Plugin Solution |
|------|----------------|
| Import `.md` files as components | Custom `load` hook |
| Optimize SVGs during build | `transform` hook + SVGO |
| Inject build metadata | `buildStart` / `buildEnd` hooks |
| Validate environment variables | `config` hook |
| Generate TypeScript from GraphQL | `transform` hook |

---

## 🏗️ Plugin Architecture: The Assembly Line

Vite plugins follow an **assembly line** pattern. Each hook is a workstation that processes files at a specific stage:

```
PLUGIN LIFECYCLE (Development)
═══════════════════════════════════════════════════════════

  config          ← Read/modify Vite config before server starts
    │
    ▼
  configResolved  ← Config is finalized, access resolved config
    │
    ▼
  configureServer ← Hook into dev server (add middleware, etc.)
    │
    ▼
  resolveId       ← "Where is this import?" (custom resolution)
    │
    ▼
  load            ← "Give me the file contents" (virtual files)
    │
    ▼
  transform       ← "Modify this code before it reaches the browser"
    │
    ▼
  buildStart      ← Before production build begins
    │
    ▼
  [Rollup build hooks run here]
    │
    ▼
  buildEnd        ← After production build completes
    │
    ▼
  closeBundle     ← Cleanup, close file watchers

═══════════════════════════════════════════════════════════
```

**Key insight:** Most custom plugins only need 2–3 hooks. Don't over-engineer.

---

## 🚀 Your First Plugin

Here's a minimal plugin that prepends a banner to every `.js` file:

```typescript
import type { Plugin } from 'vite'

export default function bannerPlugin(): Plugin {
  return {
    name: 'vite-plugin-banner',
    transform(code: string, id: string) {
      if (id.endsWith('.js')) {
        const banner = `// Built with Vite — ${new Date().toISOString()}\n`
        return banner + code
      }
    }
  }
}
```

**Usage:**

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import banner from './plugins/banner'

export default defineConfig({
  plugins: [banner()]
})
```

---

## 🪝 Hook Deep Dive

### `transform(code, id)` — The Workhorse

Runs on every file. Returns modified code or `null` to pass through.

```typescript
import type { Plugin } from 'vite'

interface TransformOptions {
  targetExtension?: string
  prepend?: string
}

export default function prependPlugin(options: TransformOptions = {}): Plugin {
  const { targetExtension = '.txt', prepend = '» ' } = options

  return {
    name: 'vite-plugin-prepend',
    transform(code: string, id: string) {
      if (id.endsWith(targetExtension)) {
        // Convert .txt file to JS module exporting the content
        const transformed = `${prepend}${code}`
        return `export default ${JSON.stringify(transformed)}`
      }
      return null // Pass through unmodified files
    }
  }
}
```

### `resolveId(source, importer)` — Custom Resolution

Tells Vite where to find an import. Powers virtual modules.

```typescript
import type { Plugin } from 'vite'

export default function virtualConfigPlugin(): Plugin {
  const virtualModuleId = 'virtual:config'
  const resolvedVirtualModuleId = '\0' + virtualModuleId

  return {
    name: 'vite-plugin-virtual-config',
    resolveId(id: string) {
      if (id === virtualModuleId) {
        return resolvedVirtualModuleId
      }
    },
    load(id: string) {
      if (id === resolvedVirtualModuleId) {
        return `
          export const appName = 'My App'
          export const version = '1.0.0'
          export const deployedAt = '${new Date().toISOString()}'
        `
      }
    }
  }
}
```

**Usage:** `import { appName } from 'virtual:config'`

**Why `\0` prefix?** It marks the module as virtual — Rollup won't try to resolve it as a real file.

### `load(id)` — Virtual Files

Generates file content on-the-fly. Combine with `resolveId` for powerful patterns.

### `config(config, env)` — Modify Configuration

Adjust Vite config before the server starts. Good for setting defaults.

```typescript
import type { Plugin, UserConfig } from 'vite'

export default function defaultConfigPlugin(): Plugin {
  return {
    name: 'vite-plugin-defaults',
    config(config: UserConfig, { mode }: { mode: string }) {
      return {
        build: {
          sourcemap: mode === 'development',
          target: 'es2022'
        }
      }
    }
  }
}
```

### `buildStart` / `buildEnd` — Build Lifecycle

Run code at the start or end of production builds.

```typescript
import type { Plugin } from 'vite'
import { writeFileSync } from 'fs'
import { resolve } from 'path'

export default function buildInfoPlugin(): Plugin {
  const startTime = Date.now()

  return {
    name: 'vite-plugin-build-info',
    buildStart() {
      console.log('🚀 Build started')
    },
    buildEnd() {
      const duration = Date.now() - startTime
      console.log(`✅ Build completed in ${duration}ms`)
    },
    closeBundle() {
      // Write build manifest
      writeFileSync(
        resolve(process.cwd(), 'dist/build-meta.json'),
        JSON.stringify({ builtAt: new Date().toISOString() }, null, 2)
      )
    }
  }
}
```

---

## 🛠️ Practical Examples

### Example 1: Markdown Importer

Import `.md` files as parsed HTML strings.

```typescript
import type { Plugin } from 'vite'

interface MarkdownPluginOptions {
  wrapperClass?: string
}

export default function markdownPlugin(options: MarkdownPluginOptions = {}): Plugin {
  const { wrapperClass = 'markdown-body' } = options

  return {
    name: 'vite-plugin-markdown',
    transform(code: string, id: string) {
      if (!id.endsWith('.md')) return null

      // Simple markdown to HTML (use a real parser like marked in production)
      const html = code
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
        .replace(/\n/gim, '<br>')

      const wrapped = `<div class="${wrapperClass}">${html}</div>`

      return `export default ${JSON.stringify(wrapped)}`
    }
  }
}
```

**Usage:**

```typescript
import readmeHtml from './README.md'
console.log(readmeHtml) // <div class="markdown-body"><h1>...</h1></div>
```

### Example 2: SVG Optimizer

Optimize SVGs at build time using a lightweight approach.

```typescript
import type { Plugin } from 'vite'

interface SvgOptimizerOptions {
  removeComments?: boolean
  removeWhitespace?: boolean
}

export default function svgOptimizerPlugin(options: SvgOptimizerOptions = {}): Plugin {
  const {
    removeComments = true,
    removeWhitespace = true
  } = options

  return {
    name: 'vite-plugin-svg-optimizer',
    enforce: 'pre',
    transform(code: string, id: string) {
      if (!id.endsWith('.svg')) return null

      let optimized = code

      if (removeComments) {
        optimized = optimized.replace(/<!--[\s\S]*?-->/g, '')
      }

      if (removeWhitespace) {
        optimized = optimized.replace(/>\s+</g, '><')
      }

      // Export as React component (simplified)
      const componentName = id.split('/').pop()?.replace('.svg', '') || 'Svg'
      const jsx = optimized
        .replace('<svg', '<svg {...props}')
        .replace('xmlns="http://www.w3.org/2000/svg"', '')

      return `
        import React from 'react'
        export default function ${componentName}(props) {
          return ${jsx}
        }
      `
    }
  }
}
```

### Example 3: Environment Checker

Validate required env vars at build time.

```typescript
import type { Plugin } from 'vite'

interface EnvCheckerOptions {
  required: string[]
  allowEmpty?: boolean
}

export default function envCheckerPlugin(options: EnvCheckerOptions): Plugin {
  const { required, allowEmpty = false } = options

  return {
    name: 'vite-plugin-env-checker',
    enforce: 'pre',
    configResolved() {
      const missing: string[] = []

      for (const key of required) {
        const value = process.env[key]
        if (value === undefined || (!allowEmpty && value === '')) {
          missing.push(key)
        }
      }

      if (missing.length > 0) {
        throw new Error(
          `Missing required environment variables: ${missing.join(', ')}`
        )
      }

      console.log(`✓ All ${required.length} required env vars present`)
    }
  }
}
```

**Usage:**

```typescript
// vite.config.ts
import envChecker from './plugins/env-checker'

export default defineConfig({
  plugins: [
    envChecker({
      required: ['VITE_API_URL', 'VITE_APP_NAME'],
      allowEmpty: false
    })
  ]
})
```

### Example 4: YAML Loader

Import `.yaml` files as JavaScript objects.

```typescript
import type { Plugin } from 'vite'

export default function yamlPlugin(): Plugin {
  return {
    name: 'vite-plugin-yaml',
    transform(code: string, id: string) {
      if (!id.endsWith('.yaml') && !id.endsWith('.yml')) return null

      // Simple YAML parser for flat key-value files
      const lines = code.split('\n')
      const result: Record<string, string | number | boolean> = {}

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith('#')) continue

        const [key, ...valueParts] = trimmed.split(':')
        if (!key) continue

        const value = valueParts.join(':').trim()
        const numValue = Number(value)

        result[key.trim()] = isNaN(numValue) ? value : numValue
      }

      return `export default ${JSON.stringify(result)}`
    }
  }
}
```

---

## ⚙️ Plugin Ordering & Composition

### `enforce`: Control Execution Order

```typescript
export default function myPlugin(): Plugin {
  return {
    name: 'my-plugin',
    enforce: 'pre', // Run before other plugins
    // enforce: 'post' // Run after other plugins
    transform(code, id) {
      // ...
    }
  }
}
```

| Value | When to Use |
|-------|-------------|
| `pre` | Your plugin must run **before** others (e.g., preprocessors, loaders) |
| `post` | Your plugin must run **after** others (e.g., post-processors, analyzers) |
| default | Normal execution order (no preference) |

**Assembly line analogy:**
- `pre` = Prep station (wash vegetables before cooking)
- default = Main cooking station
- `post` = Plating station (garnish after cooking)

### `apply`: Dev vs Build

```typescript
export default function devOnlyPlugin(): Plugin {
  return {
    name: 'dev-only',
    apply: 'serve', // Only in dev server
    // apply: 'build' // Only in production build
    // apply: (config, env) => env.command === 'build'
    configureServer(server) {
      server.middlewares.use('/api', proxyMiddleware)
    }
  }
}
```

### Sequential vs Parallel

Plugins with the same `enforce` value run **sequentially** by default. They process files one after another, each receiving the output of the previous plugin.

```
Input → Plugin A (pre) → Plugin B (pre) → Plugin C (default) → Plugin D (post) → Output
```

---

## 📦 Publishing Plugins

### Package Structure

```
vite-plugin-my-feature/
├── src/
│   └── index.ts          # Main plugin code
├── dist/                 # Compiled output
├── package.json
├── tsconfig.json
└── README.md
```

### `package.json`

```json
{
  "name": "vite-plugin-my-feature",
  "version": "1.0.0",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "files": ["dist"],
  "scripts": {
    "build": "tsup src/index.ts --format esm --dts",
    "test": "vitest"
  },
  "peerDependencies": {
    "vite": "^5.0.0"
  },
  "devDependencies": {
    "vite": "^5.0.0",
    "vitest": "^1.0.0",
    "tsup": "^8.0.0"
  }
}
```

### Naming Convention

Prefix with `vite-plugin-` for discoverability:

| Good | Bad |
|------|-----|
| `vite-plugin-graphql` | `graphql-vite` |
| `vite-plugin-svg-icons` | `svg-vite-plugin` |
| `vite-plugin-cloudflare` | `cf-vite` |

---

## 🧪 Testing Plugins with Vitest

```typescript
// __tests__/markdown-plugin.test.ts
import { describe, it, expect } from 'vitest'
import markdownPlugin from '../src/markdown-plugin'

describe('markdownPlugin', () => {
  const plugin = markdownPlugin({ wrapperClass: 'prose' })

  it('transforms .md files', () => {
    const code = '# Hello\n\nThis is **bold**.'
    const result = plugin.transform!(code, '/test/readme.md')

    expect(result).toContain('<h1>Hello</h1>')
    expect(result).toContain('<strong>bold</strong>')
    expect(result).toContain('class="prose"')
  })

  it('ignores non-markdown files', () => {
    const result = plugin.transform!('const x = 1', '/test/app.ts')
    expect(result).toBeNull()
  })

  it('has correct name', () => {
    expect(plugin.name).toBe('vite-plugin-markdown')
  })
})
```

---

## 🐞 Debugging with `vite-plugin-inspect`

```bash
npm install -D vite-plugin-inspect
```

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import Inspect from 'vite-plugin-inspect'

export default defineConfig({
  plugins: [
    Inspect(), // Add before your custom plugins
    yourCustomPlugin()
  ]
})
```

Open `http://localhost:5173/__inspect/` to see:
- Which plugins transformed each file
- Before/after code for each transformation
- Plugin execution order

**Tip:** Always use `inspect` when a plugin misbehaves. It reveals exactly where things break.

---

## 📋 Quick Reference Card

```
HOOK                  STAGE              PURPOSE
─────────────────────────────────────────────────────────────
config                Early              Modify vite config
configResolved        Config done        Access final config
configureServer       Dev server         Add middleware
configurePreview      Preview server     Customize preview
resolveId             Resolution         Custom import resolution
load                  File loading       Generate virtual files
transform             Processing         Modify file contents
buildStart            Build begins       Setup, validation
buildEnd              Build ends         Cleanup, reporting
generateBundle        Output             Modify final bundle
closeBundle           Complete           Final cleanup
─────────────────────────────────────────────────────────────
```

---

## ⚠️ Common Pitfalls

### 1. Forgetting `null` Return in `transform`

```typescript
// ❌ Wrong: Returns undefined for non-matching files
return {
  transform(code, id) {
    if (id.endsWith('.md')) {
      return transformed
    }
    // Implicitly returns undefined — Vite gets confused!
  }
}

// ✅ Correct: Explicitly return null to pass through
return {
  transform(code, id) {
    if (id.endsWith('.md')) {
      return transformed
    }
    return null
  }
}
```

### 2. Missing `enforce: 'pre'` for Loaders

If your plugin reads files before others process them, use `enforce: 'pre'`. Otherwise, you might receive already-transformed code.

### 3. Not Handling Virtual Module IDs

Always prefix virtual module IDs with `\0`. Without it, Vite/Rollup tries to resolve them as real files.

### 4. Synchronous Code in Async Hooks

```typescript
// ❌ Wrong: Blocking the build
buildStart() {
  const data = fs.readFileSync('./large-file.json') // Blocks!
}

// ✅ Correct: Use async when possible
async buildStart() {
  const data = await fs.promises.readFile('./large-file.json')
}
```

### 5. Mutating Input Code Directly

```typescript
// ❌ Wrong: Mutates original string
return {
  transform(code) {
    code.replace('foo', 'bar') // Strings are immutable — this does nothing!
    return code
  }
}

// ✅ Correct: Return new string
return {
  transform(code) {
    return code.replace('foo', 'bar')
  }
}
```

---

## 📝 Homework

### Exercise 1: JSON5 Loader
Write a plugin that imports `.json5` files (JSON with comments) and strips comments before parsing.

### Exercise 2: Build Timestamp Banner
Create a plugin that injects a banner comment at the top of every `.js` and `.ts` file with the build timestamp and git commit hash.

### Exercise 3: Plugin Composition
Write two plugins:
1. A `pre` plugin that transforms `.md` to HTML
2. A `post` plugin that minifies the HTML output

Verify with `vite-plugin-inspect` that they execute in the correct order.

### Exercise 4: Test Your Plugin
Write Vitest tests for Exercise 1. Test:
- Correct parsing of valid JSON5
- Comment removal
- Error handling for invalid syntax

---

## 🧠 Key Takeaways

- Vite plugins use **hooks** to tap into the build pipeline at specific stages
- The `Plugin` type from `vite` gives you full TypeScript safety
- `transform` is the most common hook — it processes file contents
- `resolveId` + `load` = virtual modules (no file system needed)
- `enforce: 'pre'` runs before other plugins; `enforce: 'post'` runs after
- Always return `null` from `transform` when you don't modify a file
- Prefix virtual module IDs with `\0`
- Test plugins with Vitest by calling hooks directly
- Use `vite-plugin-inspect` to debug transformation order and output

---

## 🔗 Next Steps

Ready for Lesson 08: **Vite in Monorepos** — managing multiple packages with shared Vite configuration, Turborepo integration, and workspace plugin patterns.

---

*Lesson 07 — Writing Custom Vite Plugins*  
*Accelerated Vite Mastery Course*
