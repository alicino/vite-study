# 🏢 Lesson 08: Monorepos, Advanced Patterns, and Migration

**The Final Chapter** — From single projects to massive codebases, Webpack migration, and Cloudflare deployment.

---

## Learning Objectives

By the end of this lesson, you will:

- Understand why monorepos beat multiple repos for related projects
- Create a Turborepo monorepo with shared Vite configurations
- Build multiple apps and packages with a single command
- Migrate a Webpack project to Vite without breaking production
- Use Vite Library Mode to publish reusable packages
- Deploy a monorepo to Cloudflare (Pages + Workers + D1)
- Recognize common migration traps and how to avoid them

---

## Monorepo Concepts

### The Shopping Mall Analogy

Imagine a shopping mall instead of standalone stores on different streets:

```
STANDALONE REPOS (multiple streets)
├── repo-street-1/store-a    (React app)
├── repo-street-2/store-b    (Vue app)
├── repo-street-3/warehouse  (shared components)
└── repo-street-4/office     (API types)
   Problems: Duplicate security guards, separate utilities, slow deliveries

MONOREPO (one shopping mall)
├── mall/apps/store-a        (React app)
├── mall/apps/store-b        (Vue app)
├── mall/packages/shared-ui  (shared components)
├── mall/packages/api-types  (shared types)
└── mall/shared/utilities    (one security, one power grid, fast internal deliveries)
   Benefits: Shared infrastructure, atomic changes, single CI/CD pipeline
```

A monorepo houses multiple related projects in one repository. Changes across apps and packages happen atomically. Internal packages link directly — no npm publish dance for every update.

### Tool Comparison

| Tool | Best For | Approach |
|------|----------|----------|
| **pnpm workspaces** | Small-medium monorepos | Native package linking, fast disk usage |
| **Turborepo** | Medium-large monorepos | Task orchestration + remote caching on top of workspaces |
| **Nx** | Enterprise-scale monorepos | Full framework with code generators, dependency graphs, affected builds |

**Rule of thumb:** Start with pnpm workspaces. Add Turborepo when builds slow down. Consider Nx when you need enterprise tooling and code generation.

---

## Turborepo Setup

### 1. Scaffold the Monorepo

```bash
# Using Turborepo's official starter
npx create-turbo@latest my-monorepo --package-manager pnpm

# Or manually with pnpm
mkdir my-monorepo && cd my-monorepo
pnpm init
```

### 2. Configure Workspaces

```yaml
# pnpm-workspace.yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

```json
// package.json (root)
{
  "name": "my-monorepo",
  "private": true,
  "packageManager": "pnpm@9.0.0",
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev",
    "lint": "turbo run lint",
    "typecheck": "turbo run typecheck"
  },
  "devDependencies": {
    "turbo": "^2.0.0",
    "typescript": "^5.4.0"
  }
}
```

### 3. Configure Turborepo Pipeline

```json
// turbo.json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**", "!.next/cache/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {},
    "typecheck": {
      "dependsOn": ["^build"]
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": ["coverage/**"]
    }
  }
}
```

**Pipeline logic:**
- `dependsOn: ["^build"]` — Build dependencies BEFORE building this package
- `"^"` prefix means "workspace dependencies only" (not devDependencies)
- `cache: false` on `dev` — Never cache the dev server
- `persistent: true` — Dev tasks run continuously; Turborepo won't wait for exit

### 4. Complete Monorepo Structure

```
my-monorepo/
├── apps/
│   ├── web/                    # Vite React app (customer-facing)
│   │   ├── vite.config.ts
│   │   ├── package.json
│   │   └── src/
│   └── admin/                  # Vite Vue app (internal tool)
│       ├── vite.config.ts
│       ├── package.json
│       └── src/
├── packages/
│   ├── ui/                     # Shared React components (Library Mode)
│   │   ├── vite.config.ts
│   │   ├── package.json
│   │   └── src/
│   ├── api-types/              # Shared TypeScript types
│   │   ├── package.json
│   │   └── src/
│   └── vite-config/            # Shared Vite configuration
│       ├── package.json
│       └── src/
├── turbo.json
├── pnpm-workspace.yaml
├── tsconfig.json               # Root tsconfig for editor support
└── package.json
```

---

## Shared Vite Config

### Creating a Shared Config Package

```typescript
// packages/vite-config/src/index.ts
import { defineConfig, UserConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

interface CreateConfigOptions {
  port?: number
  outDir?: string
  extraPlugins?: UserConfig['plugins']
}

export function createAppConfig(options: CreateConfigOptions = {}): UserConfig {
  return defineConfig({
    plugins: [react(), ...(options.extraPlugins ?? [])],
    server: {
      port: options.port ?? 3000,
      host: true
    },
    build: {
      outDir: options.outDir ?? 'dist',
      sourcemap: true,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom']
          }
        }
      }
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src')
      }
    }
  })
}

export function createLibraryConfig(pkgName: string): UserConfig {
  return defineConfig({
    build: {
      lib: {
        entry: path.resolve(__dirname, 'src/index.ts'),
        name: pkgName,
        fileName: (format) => `${pkgName}.${format}.js`
      },
      rollupOptions: {
        external: ['react', 'react-dom'],
        output: {
          globals: {
            react: 'React',
            'react-dom': 'ReactDOM'
          }
        }
      }
    }
  })
}
```

```json
// packages/vite-config/package.json
{
  "name": "@myrepo/vite-config",
  "version": "1.0.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "dependencies": {
    "vite": "^5.0.0",
    "@vitejs/plugin-react": "^4.0.0"
  },
  "devDependencies": {
    "typescript": "^5.4.0"
  }
}
```

### Extending Base Configs

```typescript
// apps/web/vite.config.ts
import { createAppConfig } from '@myrepo/vite-config'
import { defineConfig, mergeConfig } from 'vite'
import Pages from 'vite-plugin-pages'

const baseConfig = createAppConfig({ port: 3001 })

export default mergeConfig(baseConfig, defineConfig({
  plugins: [Pages()],
  server: {
    proxy: {
      '/api': 'http://localhost:8787'
    }
  }
}))
```

**Key point:** `mergeConfig` from Vite deep-merges configurations. Your apps extend the shared base without copy-pasting boilerplate.

---

## Workspace Patterns

### Internal Dependencies

```json
// apps/web/package.json
{
  "name": "@myrepo/web",
  "dependencies": {
    "@myrepo/ui": "workspace:*",
    "@myrepo/api-types": "workspace:*",
    "react": "^18.2.0"
  },
  "devDependencies": {
    "@myrepo/vite-config": "workspace:*"
  }
}
```

`workspace:*` tells pnpm: "Use the version in this monorepo, not npm." When you change `@myrepo/ui`, `apps/web` sees the update immediately — no publish step.

### Importing Internal Packages

```typescript
// apps/web/src/App.tsx
import { Button, Card } from '@myrepo/ui'
import type { User, Post } from '@myrepo/api-types'

function App() {
  const user: User = { id: 1, name: 'Alice' }
  return (
    <Card>
      <Button>Hello {user.name}</Button>
    </Card>
  )
}
```

### Versioning Strategy

Two approaches:

| Approach | When to Use | How |
|----------|------------|-----|
| **Single version** | Tight coupling between packages | All packages share one version in root package.json |
| **Independent** | Packages published separately | Each package has its own version, changeset tool manages bumps |

For internal monorepos (not publishing to npm), single version is simpler. For open-source packages, use [Changesets](https://github.com/changesets/changesets).

---

## Migrating from Webpack

### The Migration Mindset

Think of it like moving houses:

```
WEBPACK HOUSE (old)                    VITE HOUSE (new)
├── webpack.config.js  200 lines       ├── vite.config.ts   30 lines
├── 15 loaders to configure            ├── Plugins handle complexity
├── babel.config.js separate           ├── esbuild built-in
├── Slow cold start (30s+)             ├── Instant dev server (<1s)
├── Complex HMR setup                  ├── HMR works out of the box
└── Manual optimization needed         └── Smart defaults optimized
```

### Step-by-Step Migration Checklist

1. **Audit dependencies**
   ```bash
   # Check what Webpack-specific packages you use
   grep -r "webpack" package.json
   # Common removals: babel-loader, css-loader, style-loader, html-webpack-plugin
   ```

2. **Create Vite config alongside Webpack**
   Don't delete Webpack yet. Run both configs in parallel during the transition.

3. **Update entry HTML**
   ```html
   <!-- Before: Webpack injects bundles automatically -->
   <!-- After: Vite needs explicit entry point -->
   <!DOCTYPE html>
   <html>
     <head><title>My App</title></head>
     <body>
       <div id="root"></div>
       <script type="module" src="/src/main.tsx"></script>
     </body>
   </html>
   ```

4. **Migrate environment variables**
   ```typescript
   // Before (Webpack)
   const apiUrl = process.env.REACT_APP_API_URL

   // After (Vite)
   const apiUrl = import.meta.env.VITE_API_URL
   ```

5. **Update imports for assets**
   ```typescript
   // Before (Webpack file-loader)
   import logo from './logo.png'

   // After (Vite — same syntax, better defaults)
   import logo from './logo.png'
   ```

6. **Handle special cases**
   - `require()` → `import` or `import()`
   - `__dirname` in browser → not available, use `import.meta.url`
   - Node polyfills (crypto, path) → add `vite-plugin-node-polyfills`

7. **Verify production build**
   ```bash
   npm run build        # Should complete without errors
   npm run preview      # Test the production build locally
   ```

8. **Delete Webpack config**
   Only after production deployment succeeds for 48+ hours.

### Common Migration Issues

| Problem | Cause | Fix |
|---------|-------|-----|
| `process is not defined` | Code uses `process.env` | Replace with `import.meta.env` |
| `require is not defined` | CommonJS `require()` in browser code | Convert to ESM `import` |
| CSS modules not working | Missing `*.module.css` pattern | Rename files or configure `css.modules` |
| Proxy not working | Different proxy syntax | Use Vite's `server.proxy` format |
| Build slower than Webpack | Expecting instant production builds | Vite dev is faster; production uses Rollup (comparable speed) |

---

## Advanced Vite Patterns

### Library Mode

Use Library Mode when building packages (not apps). It outputs ES modules + UMD bundles for npm distribution.

```typescript
// packages/ui/vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import dts from 'vite-plugin-dts'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    dts({ insertTypesEntry: true })  // Auto-generate .d.ts files
  ],
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'MyRepoUI',
      formats: ['es', 'cjs'],
      fileName: (format) => `index.${format}.js`
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM'
        }
      }
    }
  }
})
```

```json
// packages/ui/package.json
{
  "name": "@myrepo/ui",
  "main": "./dist/index.cjs.js",
  "module": "./dist/index.es.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.es.js",
      "require": "./dist/index.cjs.js",
      "types": "./dist/index.d.ts"
    }
  },
  "files": ["dist"]
}
```

### SSR (Server-Side Rendering)

Vite supports SSR out of the box. Useful for meta-frameworks or custom SSR setups.

```typescript
// server.ts — custom SSR server
import { createServer } from 'vite'
import express from 'express'

async function startServer() {
  const app = express()
  const vite = await createServer({
    server: { middlewareMode: true },
    appType: 'custom'
  })

  app.use(vite.middlewares)

  app.get('*', async (req, res) => {
    const url = req.originalUrl
    const template = await vite.transformIndexHtml(url, 
      '<!DOCTYPE html><html><head></head><body><div id="root"></div></body></html>'
    )
    const { render } = await vite.ssrLoadModule('/src/entry-server.tsx')
    const appHtml = await render(url)
    const html = template.replace('<!--app-html-->', appHtml)
    res.status(200).set({ 'Content-Type': 'text/html' }).end(html)
  })

  app.listen(5173)
}

startServer()
```

### Middleware Mode

Run Vite as middleware inside another server (Express, Fastify, custom Workers):

```typescript
// Vite as middleware in an existing Express app
import express from 'express'
import { createServer } from 'vite'

async function createApp() {
  const app = express()
  const vite = await createServer({
    server: { middlewareMode: true }
  })

  // Vite handles dev assets
  app.use(vite.middlewares)

  // Your API routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' })
  })

  return app
}
```

---

## Cloudflare-Specific Patterns

### Workers + Pages in One Monorepo

```
my-monorepo/
├── apps/
│   ├── web/                    # Cloudflare Pages (Vite React)
│   │   ├── package.json
│   │   └── vite.config.ts
│   └── api/                    # Cloudflare Workers (Hono API)
│       ├── package.json
│       ├── wrangler.toml
│       └── src/
├── packages/
│   ├── shared-types/           # Shared between Pages + Workers
│   └── shared-utils/
└── turbo.json
```

### Shared Types for Workers and Pages

```typescript
// packages/shared-types/src/index.ts
export interface Env {
  DB: D1Database
  KV: KVNamespace
  API_KEY: string
}

export interface User {
  id: string
  email: string
  createdAt: string
}

export interface APIResponse<T> {
  success: boolean
  data: T
  error?: string
}
```

```typescript
// apps/api/src/index.ts (Worker)
import { Hono } from 'hono'
import type { Env, User, APIResponse } from '@myrepo/shared-types'

const app = new Hono<{ Bindings: Env }>()

app.get('/api/users/:id', async (c) => {
  const id = c.req.param('id')
  const user = await c.env.DB.prepare('SELECT * FROM users WHERE id = ?')
    .bind(id)
    .first()
  
  const response: APIResponse<User> = {
    success: true,
    data: user as User
  }
  return c.json(response)
})

export default app
```

```typescript
// apps/web/src/api/client.ts (Pages frontend)
import type { User, APIResponse } from '@myrepo/shared-types'

export async function getUser(id: string): Promise<User> {
  const res = await fetch(`/api/users/${id}`)
  const json: APIResponse<User> = await res.json()
  if (!json.success) throw new Error(json.error)
  return json.data
}
```

### Wrangler Workspace Configuration

```toml
# wrangler.toml (root)
name = "my-monorepo"

# apps/api/wrangler.toml
name = "my-monorepo-api"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[[d1_databases]]
binding = "DB"
database_name = "production-db"
database_id = "your-db-id"

# apps/web/wrangler.toml (Pages)
name = "my-monorepo-web"
pages_build_output_dir = "./dist"
```

### Turbo Pipeline for Cloudflare Deploy

```json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "deploy": {
      "dependsOn": ["build"],
      "outputs": []
    }
  }
}
```

```bash
# Deploy everything
pnpm turbo run deploy

# Deploy only changed apps
pnpm turbo run deploy --filter=[HEAD~1]
```

---

## Quick Reference Card

### Essential Commands

```bash
# Development
pnpm dev                      # Start all dev servers
pnpm dev --filter=web         # Start only web app
pnpm turbo run dev --parallel # Start all in parallel

# Building
pnpm build                    # Build all packages and apps
pnpm turbo run build --filter=web...  # Build web + dependencies

# Adding packages
pnpm add lodash --filter=web           # Add to specific app
pnpm add typescript -D --filter=@myrepo/ui   # Add to package

# Running scripts
pnpm turbo run lint           # Lint everything
pnpm turbo run test           # Test everything
pnpm turbo run typecheck      # Type-check everything
```

### Turbo Cache

```bash
# Clear local cache
rm -rf .turbo

# Remote caching (Turborepo remote cache — or self-hosted)
# Nx Cloud or custom cache server also works
```

### Vite Library Mode Quick Config

```typescript
build: {
  lib: {
    entry: './src/index.ts',
    name: 'MyLib',
    formats: ['es', 'cjs']
  },
  rollupOptions: {
    external: ['react', 'react-dom']  // Don't bundle these
  }
}
```

---

## Common Pitfalls

### 1. "Workspace package not found"

**Cause:** Package name in `package.json` doesn't match import.

**Fix:** Ensure names match exactly:
```json
// packages/ui/package.json
{ "name": "@myrepo/ui" }

// apps/web/src/App.tsx
import { Button } from '@myrepo/ui'  // Must match
```

### 2. "Types not found for workspace package"

**Cause:** Package missing `types` field or not built.

**Fix:** Add to package.json:
```json
{
  "main": "./src/index.ts",
  "types": "./src/index.ts"
}
```

Or build with `vite-plugin-dts` and point to `dist/index.d.ts`.

### 3. Turbo cache serves stale builds

**Cause:** Input files changed but Turbo didn't detect them.

**Fix:** Add all source files to `inputs` in turbo.json:
```json
{
  "build": {
    "inputs": ["src/**", "vite.config.ts", "tsconfig.json"]
  }
}
```

### 4. Webpack alias migration fails

**Cause:** Vite alias syntax differs from Webpack `resolve.alias`.

**Fix:** Vite uses object format, not array:
```typescript
// Webpack
resolve: { alias: [{ find: '@', replacement: '/src' }] }

// Vite
resolve: { alias: { '@': '/src' } }
```

### 5. Environment variables missing in build

**Cause:** Variables don't start with `VITE_`.

**Fix:** Only `VITE_*` variables reach the browser. Server-side variables can use any name.

---

## Homework

### Exercise 1: Create a Mini Monorepo (30 minutes)

1. Scaffold a monorepo with:
   - `apps/web` — Vite React app
   - `packages/ui` — Button and Card components
   - `packages/vite-config` — Shared config

2. Configure `turbo.json` with build, dev, and lint pipelines

3. Import `Button` from `@myrepo/ui` into `apps/web`

4. Run `pnpm turbo run build` — both packages should build in correct order

### Exercise 2: Library Mode (20 minutes)

1. Build `packages/ui` in Library Mode (ES + CJS outputs)
2. Verify `dist/` contains `.js` and `.d.ts` files
3. Import the built library into `apps/web` from `dist/` instead of `src/`

### Exercise 3: Webpack Migration (45 minutes)

1. Find an old Webpack project (or create one with `npx create-react-app`)
2. Follow the migration checklist in this lesson
3. Create `vite.config.ts` alongside existing Webpack config
4. Verify `npm run build` produces working output
5. Delete Webpack config only after successful deployment

### 🎓 Graduation Project: Full Migration + Cloudflare Deploy (2-3 hours)

**Goal:** Migrate a small Webpack/React app to Vite and deploy to Cloudflare.

**Requirements:**
1. Start with a Webpack app (or CRA boilerplate)
2. Migrate to Vite using the checklist
3. Set up a monorepo structure:
   - `apps/web` — Your migrated app
   - `packages/shared-types` — API types
4. Add a Cloudflare Worker in `apps/api` with Hono
5. Share types between Worker and frontend
6. Deploy:
   - Frontend to Cloudflare Pages
   - API to Cloudflare Workers
   - (Optional) Add D1 database

**Success criteria:**
- `pnpm turbo run build` completes successfully
- Frontend loads from `*.pages.dev`
- API responds at `*.workers.dev` or custom domain
- Shared types prevent runtime errors

---

## Key Takeaways

- **Monorepos** centralize related projects. The shopping mall analogy: shared infrastructure, faster internal deliveries.
- **Turborepo** adds task orchestration and caching on top of pnpm workspaces. Start simple, add complexity only when needed.
- **Shared configs** eliminate copy-paste. One `vite-config` package serves all apps.
- **Library Mode** turns packages into distributable ES/CJS modules with TypeScript declarations.
- **Migration from Webpack** is methodical: audit, parallel config, update syntax, verify, delete. Never rush the delete step.
- **Cloudflare monorepos** deploy Pages + Workers from one repo. Shared types bridge frontend and backend.
- `workspace:*` links packages instantly. No npm publish for internal changes.

---

## Course Completion 🎉

You have completed the accelerated Vite mastery course. Here's what you now know:

| Lesson | Skill |
|--------|-------|
| 01 | Why Vite exists, how it differs from Webpack, the ecosystem landscape |
| 02 | Scaffolding projects, configuration, HMR, aliases, env vars |
| 03 | Asset handling, CSS, plugins, production optimization |
| 04 | Fullstack patterns, deployment, performance tuning |
| 05 | Cloudflare deployment (Pages, Workers, KV, D1) |
| 06 | Testing with Vitest (unit, integration, browser) |
| 07 | Plugin development (transforms, virtual modules, HMR API) |
| 08 | Monorepos, advanced patterns, Webpack migration |

### What To Do Next

1. **Build something real.** The graduation project is a solid portfolio piece.
2. **Read the source.** Vite is open source. Reading `packages/vite/src/node` teaches you how it works under the hood.
3. **Contribute.** Good first issues: documentation, plugin ecosystem, reproductions for bug reports.
4. **Stay current.** Follow the [Vite blog](https://vitejs.dev/blog) and [Cloudflare changelog](https://developers.cloudflare.com/changelog/).

### Resources

- [Vite Docs](https://vitejs.dev) — Reference for config, plugins, API
- [Turborepo Docs](https://turbo.build) — Monorepo task orchestration
- [Rollup Docs](https://rollupjs.org) — Vite's production bundler
- [Cloudflare Pages](https://developers.cloudflare.com/pages/) — Deployment platform
- [Cloudflare Workers](https://developers.cloudflare.com/workers/) — Edge compute
- [Awesome Vite](https://github.com/vitejs/awesome-vite) — Curated plugin list

---

*Lesson 08 — Final Chapter*  
*Course Complete. Go build something fast.*
