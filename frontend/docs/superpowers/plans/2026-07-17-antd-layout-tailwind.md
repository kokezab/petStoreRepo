# Antd App Layout + Tailwind Utilities Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rework the app shell to use Antd's `Layout` consistently, wire the existing `useThemeStore` into Antd's `ConfigProvider` theming, and add Tailwind CSS as a utility-class layer for layout glue (no Preflight, never used to restyle Antd internals).

**Architecture:** `App.tsx` becomes an Antd `Layout` (`NavBar` header + `Layout.Content` + `Layout.Footer`), replacing the hand-rolled `#root` centering CSS. A new `AppThemeProvider` wraps `App` in `main.tsx`, translating `useThemeStore` state into Antd `ConfigProvider` theme props (algorithm, colorPrimary, fontSize). Tailwind is installed via its Vite plugin and imported without the Preflight layer so it can't clash with Antd's reset.

**Tech Stack:** React 19, Antd 6, Tailwind CSS v4 (`@tailwindcss/vite`), Zustand (existing `useThemeStore`), Vite, Vitest + Testing Library.

## Global Constraints

- Tailwind utility classes are used only in our own wrapper markup (layout spacing, flex containers, one-off padding/margin) — never applied to restyle Antd component internals, and never via `@apply` on Antd class names.
- Tailwind's Preflight (CSS reset) layer must not be imported — only `tailwindcss/theme.css` and `tailwindcss/utilities.css`.
- No new UI controls (toggle buttons, settings forms) are added for theme/accent/font-size/density in this plan — only the `ConfigProvider` wiring.
- Individual page components (`PetListPage`, `InventoryPage`, `PetDetailsPage`, `SignupPage`, `SettingsPage`) are not redesigned — only their shared ancestor layout changes.
- `NavBar`'s own implementation (sticky `Layout.Header` + `Menu`) is not modified.

---

### Task 1: Install and configure Tailwind CSS

**Files:**
- Modify: `frontend/package.json` (via npm install)
- Modify: `frontend/vite.config.ts`
- Modify: `frontend/src/index.css`

**Interfaces:**
- Produces: Tailwind utility classes (e.g. `flex`, `mx-auto`, `max-w-5xl`, `px-6`, `py-8`, `text-center`, `text-sm`) available globally in any `.tsx` file via `className`.

- [ ] **Step 1: Install Tailwind packages**

Run: `npm install -D tailwindcss @tailwindcss/vite`

- [ ] **Step 2: Register the Tailwind Vite plugin**

Modify `frontend/vite.config.ts`:

```ts
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import path from 'path'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 5200,
  },
  define: {
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
})
```

- [ ] **Step 3: Import Tailwind's theme + utilities layers (no Preflight)**

At the top of `frontend/src/index.css`, add these two lines before the existing `:root { ... }` block:

```css
@import "tailwindcss/theme.css";
@import "tailwindcss/utilities.css";
```

- [ ] **Step 4: Verify Tailwind utilities compile**

Temporarily add `className="text-red-500"` to the `<h1>` in `frontend/src/features/navigation/NavBar.tsx`, run `npm run dev`, confirm the build text renders red in the browser, then remove the temporary class.

Run: `npm run dev` (start dev server, check browser at `http://localhost:5200`)
Expected: no Vite/PostCSS errors in terminal; "Build: ..." text is red, then reverts to normal after the class is removed.

- [ ] **Step 5: Commit**

```bash
git add frontend/package.json frontend/package-lock.json frontend/vite.config.ts frontend/src/index.css
git commit -m "Add Tailwind CSS (utilities only, no Preflight)"
```

---

### Task 2: Rework `App.tsx` to use Antd `Layout`

**Files:**
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/index.css`
- Test: `frontend/src/App.test.tsx` (create)

**Interfaces:**
- Consumes: `NavBar` from `frontend/src/features/navigation/NavBar.tsx` (unchanged).
- Produces: `App` default export renders an Antd `Layout` containing `NavBar`, a `Layout.Content` wrapping the existing `Routes`, and a `Layout.Footer`.

- [ ] **Step 1: Write the failing test**

Create `frontend/src/App.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';

import App from './App';

vi.mock('@/features/pets/PetListPage', () => ({ PetListPage: () => <div>Pets Page</div> }));
vi.mock('@/features/inventory/InventoryPage', () => ({
  InventoryPage: () => <div>Inventory Page</div>,
}));
vi.mock('@/features/pet-details/PetDetailsPage', () => ({
  PetDetailsPage: () => <div>Pet Details</div>,
}));
vi.mock('@/features/settings/SettingsPage', () => ({
  SettingsPage: () => <div>Settings Page</div>,
}));
vi.mock('@/features/signup/SignupPage', () => ({ SignupPage: () => <div>Signup Page</div> }));

describe('App', () => {
  it('renders NavBar, routed page content inside a main landmark, and a footer', () => {
    render(
      <MemoryRouter initialEntries={['/pets']}>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByRole('navigation')).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByText('Pets Page')).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });
});
```

Note: `App.tsx` currently renders `<BrowserRouter>` internally, which would conflict with the test's `<MemoryRouter>`. Step 3 removes `BrowserRouter` from `App.tsx` and moves it to `main.tsx` so `App` is routable in tests — this is required for the test above to work.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/App.test.tsx`
Expected: FAIL (either a nested-router error from `BrowserRouter` still being inside `App`, or missing `main`/`contentinfo` roles since `Layout.Content`/`Layout.Footer` don't exist yet).

- [ ] **Step 3: Implement the Antd `Layout` shell and move `BrowserRouter` out**

Replace `frontend/src/App.tsx`:

```tsx
import { Layout } from 'antd';
import { Route, Routes } from 'react-router';

import { NavBar } from '@/features/navigation/NavBar';
import { PetListPage } from '@/features/pets/PetListPage';

import { InventoryPage } from './features/inventory/InventoryPage';
import { PetDetailsPage } from './features/pet-details/PetDetailsPage';
import { SettingsPage } from './features/settings/SettingsPage';
import { SignupPage } from './features/signup/SignupPage';

export default function App() {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <NavBar />
      <Layout.Content className='mx-auto w-full max-w-5xl px-6 py-8'>
        <Routes>
          {/* <Route path='/' element={<Navigate to='/pets' replace />} /> */}
          <Route path='/' element={<PetListPage />} />
          <Route path='/pets' element={<PetListPage />} />
          <Route path='/pets/:id' element={<PetDetailsPage />} />
          <Route path='/inventory' element={<InventoryPage />} />
          <Route path='/settings' element={<SettingsPage />} />
          <Route path='/signup' element={<SignupPage />} />
        </Routes>
      </Layout.Content>
      <Layout.Footer className='text-center text-sm' />
    </Layout>
  );
}
```

Modify `frontend/src/main.tsx` to wrap `<App />` in `<BrowserRouter>` (full diff shown in Task 3, Step 1, since that step touches the same file for `AppThemeProvider` — for now just add the import and wrapper):

```tsx
import { BrowserRouter } from 'react-router';
```

and change the render call:

```tsx
    <StrictMode>
      <FlagProvider config={unleashConfig}>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </QueryClientProvider>
      </FlagProvider>
    </StrictMode>,
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/App.test.tsx`
Expected: PASS

- [ ] **Step 5: Remove the superseded `#root` centering rule from `index.css`**

In `frontend/src/index.css`, delete the `#root { ... }` block:

```css
#root {
  width: 1126px;
  max-width: 100%;
  margin: 0 auto;
  text-align: center;
  border-inline: 1px solid var(--border);
  min-height: 100svh;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}
```

Leave `body { margin: 0; }`, the `:root` custom properties, the `prefers-color-scheme` block, and the `h1`/`h2`/`code` typography rules untouched.

- [ ] **Step 6: Run the full test suite**

Run: `npx vitest run`
Expected: PASS (all existing tests, including `NavBar.test.tsx` and `PetListPage.test.tsx`, still pass — they don't depend on `#root` styling or `BrowserRouter` placement).

- [ ] **Step 7: Commit**

```bash
git add frontend/src/App.tsx frontend/src/App.test.tsx frontend/src/main.tsx frontend/src/index.css
git commit -m "Rework App shell to use Antd Layout (Content/Footer)"
```

---

### Task 3: Wire `useThemeStore` into an `AppThemeProvider`

**Files:**
- Create: `frontend/src/app/AppThemeProvider.tsx`
- Test: `frontend/src/app/AppThemeProvider.test.tsx`
- Modify: `frontend/src/main.tsx`

**Interfaces:**
- Consumes: `useThemeStore` from `frontend/src/stores/useThemeStore.ts` — reads `theme: 'light' | 'dark'`, `preferences.accentColor: string`, `preferences.fontSize: 'small' | 'medium' | 'large'`, `preferences.layout.density: 'comfortable' | 'compact'`.
- Produces: `AppThemeProvider` component with signature `({ children }: { children: React.ReactNode }) => JSX.Element`, wraps `children` in Antd's `ConfigProvider`.

- [ ] **Step 1: Write the failing test**

Create `frontend/src/app/AppThemeProvider.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { theme as antdTheme } from 'antd';

import { useThemeStore } from '@/stores/useThemeStore';

import { AppThemeProvider } from './AppThemeProvider';

describe('AppThemeProvider', () => {
  afterEach(() => {
    useThemeStore.setState({
      theme: 'light',
      preferences: {
        accentColor: '#6366f1',
        fontSize: 'medium',
        layout: { sidebarCollapsed: false, density: 'comfortable' },
      },
    });
  });

  it('renders children', () => {
    render(
      <AppThemeProvider>
        <div>content</div>
      </AppThemeProvider>,
    );

    expect(screen.getByText('content')).toBeInTheDocument();
  });

  it('applies the dark algorithm when theme is dark', () => {
    useThemeStore.setState({ theme: 'dark' });
    let capturedToken: { colorBgBase?: string } = {};

    function Probe() {
      capturedToken = antdTheme.useToken().token;
      return null;
    }

    render(
      <AppThemeProvider>
        <Probe />
      </AppThemeProvider>,
    );

    // Antd's dark algorithm sets colorBgBase to a dark value; default/light is '#fff'.
    expect(capturedToken.colorBgBase).not.toBe('#fff');
  });

  it('applies the accentColor preference as colorPrimary', () => {
    useThemeStore.setState((state) => ({
      preferences: { ...state.preferences, accentColor: '#ff0000' },
    }));
    let capturedToken: { colorPrimary?: string } = {};

    function Probe() {
      capturedToken = antdTheme.useToken().token;
      return null;
    }

    render(
      <AppThemeProvider>
        <Probe />
      </AppThemeProvider>,
    );

    expect(capturedToken.colorPrimary).toBe('#ff0000');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/app/AppThemeProvider.test.tsx`
Expected: FAIL with a module-not-found error for `./AppThemeProvider`.

- [ ] **Step 3: Implement `AppThemeProvider`**

Create `frontend/src/app/AppThemeProvider.tsx`:

```tsx
import { ConfigProvider, theme as antdTheme } from 'antd';
import type { ReactNode } from 'react';

import { useThemeStore } from '@/stores/useThemeStore';

const fontSizeMap = {
  small: 12,
  medium: 14,
  large: 16,
} as const;

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const theme = useThemeStore((state) => state.theme);
  const accentColor = useThemeStore((state) => state.preferences.accentColor);
  const fontSize = useThemeStore((state) => state.preferences.fontSize);
  const density = useThemeStore((state) => state.preferences.layout.density);

  const algorithms = [
    theme === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
  ];
  if (density === 'compact') {
    algorithms.push(antdTheme.compactAlgorithm);
  }

  return (
    <ConfigProvider
      theme={{
        algorithm: algorithms,
        token: {
          colorPrimary: accentColor,
          fontSize: fontSizeMap[fontSize],
        },
      }}
    >
      {children}
    </ConfigProvider>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/app/AppThemeProvider.test.tsx`
Expected: PASS

- [ ] **Step 5: Mount `AppThemeProvider` in `main.tsx`**

Replace `frontend/src/main.tsx` in full:

```tsx
import { StrictMode } from 'react';

import './index.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FlagProvider } from '@unleash/proxy-client-react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';

import { AppThemeProvider } from '@/app/AppThemeProvider';
import { config } from '@/config';

import App from './App.tsx';

const queryClient = new QueryClient({
  defaultOptions: {
    // One quick retry keeps some resilience to transient network blips for real
    // users, without react-query's default 3-attempt exponential backoff (up to
    // ~7s) leaving the UI on a stale/loading state far longer than a failure
    // warrants.
    queries: { retry: 1, retryDelay: 300 },
  },
});

const unleashConfig = {
  url: config.unleashUrl,
  clientKey: config.unleashClientKey,
  appName: config.unleashAppName,
};

async function enableMocking() {
  if (!import.meta.env.DEV) return;

  const { worker } = await import('./mocks/browser');
  // Playwright's acceptance suite blocks service workers (so its own page.route()
  // mocks are the only interceptor) — worker.start() then rejects or hangs. Swallow
  // that so the app still renders; real dev-mode registration resolves normally.
  try {
    await Promise.race([
      worker.start({
        onUnhandledRequest: 'bypass', // requests without a mock handler hit the real API
      }),
      new Promise((resolve) => setTimeout(resolve, 2000)),
    ]);
  } catch (error) {
    console.error(
      'MSW failed to start; requests will hit the real network / Playwright mocks.',
      error,
    );
  }
}

enableMocking().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <FlagProvider config={unleashConfig}>
        <QueryClientProvider client={queryClient}>
          <AppThemeProvider>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </AppThemeProvider>
        </QueryClientProvider>
      </FlagProvider>
    </StrictMode>,
  );
});
```

- [ ] **Step 6: Run the full test suite**

Run: `npx vitest run`
Expected: PASS (all tests, including the new `AppThemeProvider.test.tsx` and `App.test.tsx`)

- [ ] **Step 7: Manual verification in the browser**

Run: `npm run dev`, open `http://localhost:5200`, open devtools console, run:

```js
window.__themeStoreDebug = true; // no-op, just confirming console access
```

then, since there's no UI toggle yet, verify dark mode wiring by temporarily editing `frontend/src/stores/useThemeStore.ts` line 29 from `theme: 'light',` to `theme: 'dark',`, reloading the page, and confirming the Antd `NavBar`/`Layout` background switches to a dark palette. Revert the temporary edit afterward.

Expected: visible dark-mode switch; no console errors.

- [ ] **Step 8: Commit**

```bash
git add frontend/src/app/AppThemeProvider.tsx frontend/src/app/AppThemeProvider.test.tsx frontend/src/main.tsx
git commit -m "Wire useThemeStore into Antd ConfigProvider via AppThemeProvider"
```

---

### Task 4: Full verification pass

**Files:** none (verification only)

- [ ] **Step 1: Run typecheck, lint, and full test suite**

Run: `npm run check`
Expected: PASS with no TypeScript, ESLint, or Prettier errors.

- [ ] **Step 2: Run full test suite explicitly**

Run: `npx vitest run`
Expected: PASS (all suites, including `NavBar.test.tsx`, `PetListPage.test.tsx`, `App.test.tsx`, `AppThemeProvider.test.tsx`).

- [ ] **Step 3: Manual browser smoke test**

Run: `npm run dev`, open `http://localhost:5200`, and verify:
- `NavBar` still sticks to the top on scroll (from the prior NavBar work).
- Page content (`Layout.Content`) is centered with a max width and consistent padding at desktop width.
- Resize to below `1024px` width and confirm the existing `h1`/`h2` responsive font-size rules in `index.css` still apply (unaffected by this plan).
- Navigate between `/pets` and `/inventory` and confirm routed content still renders inside `Layout.Content`.

Expected: all checks pass visually, no console errors.

- [ ] **Step 4: Commit (if any fixes were needed)**

If Steps 1–3 required fixes, stage and commit them:

```bash
git add -A
git commit -m "Fix issues found during Antd layout verification pass"
```

If no fixes were needed, skip this step — nothing to commit.
