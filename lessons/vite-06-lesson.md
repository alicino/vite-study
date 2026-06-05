# 🧪 Lesson 06: Testing with Vitest

**Goal:** Master unit, component, and integration testing using Vitest — the test runner built for Vite.

---

## Learning Objectives

By the end of this lesson, you will:

- Understand why Vitest replaces Jest in Vite projects
- Configure `vitest.config.ts` with TypeScript and React
- Write unit tests, component tests, and async tests
- Mock API calls, browser APIs, and React hooks
- Generate coverage reports and use the browser UI
- Set up CI/CD testing with GitHub Actions
- Debug common test failures

---

## Why Testing Matters

Testing is **quality control for code**. Shipping untested code is like selling cars without inspection — they might look fine on the lot, but the brakes could fail at 60 mph.

### The Car Inspection Analogy

```
NO TESTING                    WITH TESTING
-----------                   ------------
Assemble car → Ship it        Assemble car → Inspect brakes
                              → Test engine → Check lights
                              → Crash test → Ship it

Result: Recalls, lawsuits     Result: Confidence, safety
```

Tests catch bugs **before** users do. They document how code works. They let you refactor without fear.

---

## What is Vitest?

Vitest is a **Vite-native test runner** created by the Vite team. It reuses Vite's config, plugins, and transforms — so your tests run through the same pipeline as your dev server.

### Vitest vs Jest: The Engine Swap

| Feature | Jest | Vitest |
|---------|------|--------|
| Transform | Babel (slow) | esbuild / Vite (fast) |
| Module system | CJS emulation | Native ESM |
| Config | Separate `jest.config.js` | Reuses `vite.config.ts` |
| HMR | None | Instant watch mode |
| TypeScript | Needs `ts-jest` | Built-in |
| Snapshot | Jest format | Compatible with Jest |
| UI | CLI only | Built-in browser UI |

**Why Vitest is faster:**

- **esbuild** compiles TypeScript 20x faster than Babel
- **Native ESM** — no CJS wrapper overhead
- **Shared pipeline** — Vitest uses your existing Vite plugins, no duplicate config
- **HMR for tests** — re-runs only changed tests, not the whole suite

```
Jest pipeline:        Vitest pipeline:
------------          ---------------
.ts → Babel → CJS    .ts → esbuild → ESM (same as dev!)
      ↓ slow                ↓ fast
   test run              test run
```

---

## Setup & Configuration

### Installation

```bash
npm install -D vitest @vitest/ui jsdom @testing-library/react @testing-library/jest-dom
```

| Package | Purpose |
|---------|---------|
| `vitest` | Test runner |
| `@vitest/ui` | Browser UI for tests |
| `jsdom` | DOM environment for component tests |
| `@testing-library/react` | React component testing utilities |
| `@testing-library/jest-dom` | Custom DOM matchers (`toBeInTheDocument`) |

### vitest.config.ts

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/test/'],
    },
    include: ['src/**/*.test.{ts,tsx}'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

**Key options:**

- `globals: true` — Use `describe`, `it`, `expect` without imports
- `environment: 'jsdom'` — Simulate browser DOM in Node.js
- `setupFiles` — Run setup before each test file (matchers, mocks)

### package.json Scripts

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:watch": "vitest --watch"
  }
}
```

| Command | Behavior |
|---------|----------|
| `npm test` | Watch mode — re-runs on file change |
| `npm run test:run` | Run once, exit (for CI) |
| `npm run test:ui` | Open browser UI |
| `npm run test:coverage` | Generate coverage report |

### Test Setup File

```typescript
// src/test/setup.ts
import '@testing-library/jest-dom'

// Mock global fetch for all tests
global.fetch = vi.fn()

// Clean up after each test
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

afterEach(() => {
  cleanup()
})
```

---

## Writing Tests

### Unit Tests: Pure Functions

```typescript
// src/utils/price.test.ts
import { describe, it, expect } from 'vitest'
import { formatPrice, calculateDiscount } from './price'

describe('formatPrice', () => {
  it('formats USD with cents', () => {
    expect(formatPrice(19.99)).toBe('$19.99')
  })

  it('handles zero', () => {
    expect(formatPrice(0)).toBe('$0.00')
  })

  it('rounds to 2 decimals', () => {
    expect(formatPrice(10.999)).toBe('$11.00')
  })
})

describe('calculateDiscount', () => {
  it('applies percentage discount', () => {
    expect(calculateDiscount(100, 20)).toBe(80)
  })

  it('returns 0 for 100% discount', () => {
    expect(calculateDiscount(50, 100)).toBe(0)
  })

  it('throws on invalid percentage', () => {
    expect(() => calculateDiscount(100, -10)).toThrow('Invalid discount')
  })
})
```

### React Component Tests

```typescript
// src/components/Button.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from './Button'

describe('Button', () => {
  it('renders with label', () => {
    render(<Button label="Click me" onClick={() => {}} />)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn()
    render(<Button label="Submit" onClick={handleClick} />)
    
    fireEvent.click(screen.getByText('Submit'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('is disabled when loading', () => {
    render(<Button label="Save" onClick={() => {}} isLoading />)
    expect(screen.getByRole('button')).toBeDisabled()
  })
})
```

### Async Tests: API Calls

```typescript
// src/hooks/useUser.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useUser } from './useUser'

describe('useUser', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('fetches and returns user data', async () => {
    const mockUser = { id: 1, name: 'Alice' }
    
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => mockUser,
      ok: true,
    } as Response)

    const { result } = renderHook(() => useUser(1))

    // Wait for async state update
    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser)
    })

    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('handles fetch errors', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network failed'))

    const { result } = renderHook(() => useUser(1))

    await waitFor(() => {
      expect(result.current.error).toBeInstanceOf(Error)
    })
  })
})
```

### Mocking Modules

```typescript
// src/services/api.test.ts
import { describe, it, expect, vi } from 'vitest'
import { getUser } from './api'

// Mock the entire module
vi.mock('./api', () => ({
  getUser: vi.fn(),
}))

describe('getUser', () => {
  it('returns mocked user', async () => {
    const mockUser = { id: 1, name: 'Bob' }
    vi.mocked(getUser).mockResolvedValue(mockUser)

    const user = await getUser(1)
    expect(user).toEqual(mockUser)
  })
})
```

### Mocking Browser APIs

```typescript
// src/utils/storage.test.ts
import { describe, it, expect, vi } from 'vitest'
import { getItem, setItem } from './storage'

describe('localStorage', () => {
  const getItemMock = vi.fn()
  const setItemMock = vi.fn()

  beforeEach(() => {
    vi.stubGlobal('localStorage', {
      getItem: getItemMock,
      setItem: setItemMock,
    })
  })

  it('reads from localStorage', () => {
    getItemMock.mockReturnValue('{"theme":"dark"}')
    const result = getItem('settings')
    expect(result).toEqual({ theme: 'dark' })
  })

  it('writes to localStorage', () => {
    setItem('token', 'abc123')
    expect(setItemMock).toHaveBeenCalledWith('token', '"abc123"')
  })
})
```

### Testing Custom Hooks

```typescript
// src/hooks/useCounter.test.ts
import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useCounter } from './useCounter'

describe('useCounter', () => {
  it('increments count', () => {
    const { result } = renderHook(() => useCounter())

    act(() => {
      result.current.increment()
    })

    expect(result.current.count).toBe(1)
  })

  it('decrements count', () => {
    const { result } = renderHook(() => useCounter(5))

    act(() => {
      result.current.decrement()
    })

    expect(result.current.count).toBe(4)
  })

  it('resets to initial value', () => {
    const { result } = renderHook(() => useCounter(10))

    act(() => {
      result.current.increment()
      result.current.reset()
    })

    expect(result.current.count).toBe(10)
  })
})
```

---

## Advanced Features

### Coverage Reports

```bash
npm run test:coverage
```

Output:

```
 % Coverage report from v8
----------|---------|----------|---------|---------|-------------------
File      | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
----------|---------|----------|---------|---------|-------------------
All files |   82.14 |    71.42 |   85.71 |   82.14 |
 price.ts |  100.00 |   100.00 |  100.00 |  100.00 |
 api.ts   |   66.66 |    50.00 |   75.00 |   66.66 | 15-20
----------|---------|----------|---------|---------|-------------------
```

Open `coverage/index.html` in a browser for interactive exploration.

### Browser UI (@vitest/ui)

```bash
npm run test:ui
```

Opens a dashboard at `http://localhost:51204/__vitest__/` showing:

- Test suite tree
- Pass/fail status per test
- Execution time
- Filter by text, status, or duration

```
┌─────────────────────────────────────┐
│  Vitest UI                          │
│  ┌──────────┬─────────────────────┐ │
│  │ Filter   │ ✅ 42 passed       │ │
│  │ [search] │ ❌ 3 failed        │ │
│  ├──────────┤ ⏱️  1.2s           │ │
│  │ ▶ utils  │                    │ │
│  │   ✅ add │ Details panel      │ │
│  │   ❌ sub │ Error stack trace  │ │
│  └──────────┴─────────────────────┘ │
└─────────────────────────────────────┘
```

### Snapshot Testing

```typescript
// src/components/Card.test.tsx
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Card } from './Card'

describe('Card', () => {
  it('renders correctly', () => {
    const { container } = render(
      <Card title="Hello" content="World" />
    )
    expect(container.firstChild).toMatchSnapshot()
  })
})
```

Update snapshots after intentional changes:

```bash
npm test -- --update
```

### Parallel Execution

Vitest runs test files in parallel by default. For CPU-bound tests, limit workers:

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    pool: 'threads',
    poolOptions: {
      threads: {
        maxThreads: 4,
      },
    },
  },
})
```

---

## Integration: CI/CD

### Pre-commit Hooks

```bash
npm install -D husky lint-staged
npx husky init
```

```bash
# .husky/pre-commit
npx lint-staged
```

```json
// package.json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "vitest related --run"]
  }
}
```

This runs only tests related to changed files — fast feedback before commit.

### GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Test

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run type check
        run: npx tsc --noEmit

      - name: Run tests
        run: npm run test:coverage

      - name: Upload coverage
        uses: actions/upload-artifact@v4
        with:
          name: coverage-report
          path: coverage/

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4

      - name: Deploy to Cloudflare Pages
        uses: cloudflare/pages-action@v1
        with:
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: my-vite-app
          directory: dist
          gitHubToken: ${{ secrets.GITHUB_TOKEN }}
```

**Key points:**

- Tests run on every PR — catch bugs before merge
- Coverage uploaded as artifact for review
- Deploy only runs if tests pass (`needs: test`)
- Cloudflare Pages deploys after green build

---

## Quick Reference Card

### Commands

```bash
vitest              # Watch mode
vitest run          # Run once (CI)
vitest --ui         # Browser UI
vitest --coverage   # Coverage report
vitest --watch      # Explicit watch
vitest --reporter=verbose   # Detailed output
```

### Matchers

```typescript
expect(value).toBe(expected)           // Strict equality
expect(value).toEqual(expected)        // Deep equality
expect(value).toBeTruthy()             // Truthy check
expect(value).toBeNull()               // Null check
expect(array).toContain(item)          // Array includes
expect(fn).toThrow()                   // Throws error
expect(fn).toHaveBeenCalled()          // Mock called
expect(fn).toHaveBeenCalledWith(args)  // Mock args
expect(element).toBeInTheDocument()    // DOM exists
```

### Mock Patterns

```typescript
// Function mock
const fn = vi.fn()
fn.mockReturnValue(42)
fn.mockResolvedValue({ data: [] })

// Module mock
vi.mock('./api', () => ({ fetchData: vi.fn() }))

// Spy on existing function
const spy = vi.spyOn(console, 'log')
spy.mockImplementation(() => {})

// Timer mock
vi.useFakeTimers()
vi.advanceTimersByTime(1000)
```

---

## Common Pitfalls

| Problem | Cause | Fix |
|---------|-------|-----|
| `ReferenceError: document is not defined` | Missing jsdom | Set `environment: 'jsdom'` |
| `fetch is not defined` | Node < 18 | Use `global.fetch = vi.fn()` or Node 18+ |
| Tests pass individually but fail together | Shared state | Use `beforeEach` to reset state |
| `act()` warnings in React | State update outside act | Wrap interactions in `act()` |
| Coverage shows 0% | Missing provider | Install `@vitest/coverage-v8` |
| Mocks not resetting | Forgetting cleanup | Call `vi.resetAllMocks()` in `beforeEach` |
| Import errors for CSS/assets | Vite transforms | Add `css: true` or mock imports |
| Slow test suite | Too many workers | Limit `maxThreads` in config |

### Fixing Shared State Issues

```typescript
// BAD: Shared state between tests
let count = 0

describe('counter', () => {
  it('increments', () => { count++ })      // count = 1
  it('increments again', () => { count++ }) // count = 2 (flaky!)
})

// GOOD: Isolated state per test
describe('counter', () => {
  let count: number

  beforeEach(() => {
    count = 0
  })

  it('increments', () => { count++ })      // count = 1
  it('increments again', () => { count++ }) // count = 1 (reliable)
})
```

---

## Homework

1. **Configure Vitest** in a Vite + React + TypeScript project. Add `@vitest/ui` and run tests in the browser dashboard.

2. **Write unit tests** for a utility function that validates email addresses. Test: valid emails, invalid emails, empty strings.

3. **Test a React form component** with `userEvent` (install `@testing-library/user-event`). Verify:
   - Input updates on type
   - Submit button calls handler with form data
   - Validation errors display for empty fields

4. **Mock a fetch call** in a custom hook. Test loading state, success state, and error state.

5. **Set up GitHub Actions** for your project. Ensure tests run on every PR and block merge on failure.

6. **Generate a coverage report** and identify which files have < 80% coverage. Write tests to bring them up.

---

## Key Takeaways

- **Vitest = Vite's test runner** — same config, same transforms, zero duplication
- **esbuild makes it fast** — 20x faster compilation than Jest's Babel pipeline
- **Native ESM** — no CJS hacks, imports work exactly like in your app
- **`globals: true`** — Use `describe/it/expect` without importing everywhere
- **`jsdom` environment** — Required for React component tests
- **Mock aggressively** — Isolate units by mocking dependencies, APIs, and browser globals
- **`@vitest/ui`** — Browser dashboard beats CLI for debugging failures
- **CI first** — Run tests on every PR before deploy; never ship untested code

---

*Next: Lesson 07 — Vite + Backend Integration (fullstack patterns)*
