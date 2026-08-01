# Storybook + `Widgets` fixture test bed — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a fake, dev-only `Widgets` codebook that acts as a CI-enforced living test bed for `shared/ui/codebook-page`, so regressions in the generic component fail the build.

**Architecture:** A Storybook 9 setup renders a composed `Widgets` codebook. The fixture injects a real `CodebookHooks<Widget>` whose `useQuery`/`useMutation` read/write an in-memory store (Approach C — no network, no MSW). Each story carries a `play()` interaction test; these run headlessly in CI via the story-as-test runner.

**Tech Stack:** React 19, TypeScript, Vite 8, Vitest 4, Playwright, antd 6, TanStack Query 5, zod 4, Zustand 5, Storybook 9 (`@storybook/react-vite`).

## Global Constraints

- Fixture is **dev-only**: nothing in `__fixtures__`/`__stories__` may be exported from `codebook-page/index.ts` or imported by app code — it must not enter the production bundle.
- Fixture lives **inside** `src/shared/ui/codebook-page/` (it is not an `entities/` slice).
- **No MSW** in this test bed. Data comes from an in-memory store via real TanStack Query hooks (Approach C).
- Storybook framework: **`@storybook/react-vite`**, Storybook **v9**.
- Reuse the existing **Playwright** dependency for the browser test runner; do not add a second browser tool.
- `steiger ./src`, `tsc -b`, and `eslint .` must stay green with the fixture present (`npm run check`).
- The `@` alias maps to `src` (configured in `vite.config.ts` and `vitest.config.ts`).
- Permission builders must return **lazy** functions (evaluated at point-of-use), mirroring `entities/company/model/permissions.ts` — never eager booleans.
- Validation messages in zod schemas are **i18n keys** (e.g. `'validation.required'`, `'validation.tooLong'`), matching `entities/company/model/schema.ts`.

---

### Task 1: Install and initialise Storybook

**Files:**
- Create: `.storybook/main.ts`
- Create: `.storybook/preview.tsx`
- Create: `src/shared/ui/codebook-page/__stories__/Smoke.stories.tsx` (temporary; removed in Task 8)
- Modify: `package.json` (scripts + devDependencies added by the installer)

**Interfaces:**
- Produces: a working `npm run storybook`, and a `Smoke` story used by Task 2 to prove the test runner works before the real fixture exists.

- [ ] **Step 1: Run the Storybook initializer**

Run: `npx storybook@latest init --builder vite --yes`
Expected: adds `@storybook/react-vite` + core Storybook v9 devDeps to `package.json`, creates `.storybook/`, and adds `storybook`/`build-storybook` scripts. It may create example stories under `src/stories/` — delete that folder (`rm -rf src/stories`), we use our own.

- [ ] **Step 2: Point Storybook at our stories and alias**

Replace `.storybook/main.ts` with:

```ts
import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-essentials'],
  framework: { name: '@storybook/react-vite', options: {} },
  // The `@` -> src alias is inherited from vite.config.ts automatically,
  // because @storybook/react-vite loads the project's Vite config.
};

export default config;
```

- [ ] **Step 3: Add a temporary smoke story**

Create `src/shared/ui/codebook-page/__stories__/Smoke.stories.tsx`:

```tsx
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta = {
  title: 'codebook-page/_smoke',
  render: () => <div data-testid="smoke">storybook is alive</div>,
};
export default meta;

export const Smoke: StoryObj = {};
```

- [ ] **Step 4: Boot Storybook**

Run: `npm run storybook -- --ci --quiet`
Expected: dev server starts on http://localhost:6006 and the `_smoke` story renders "storybook is alive". Stop the server after confirming.

- [ ] **Step 5: Commit**

```bash
git add .storybook package.json package-lock.json src/shared/ui/codebook-page/__stories__/Smoke.stories.tsx
git commit -m "chore: initialise Storybook (react-vite)"
```

---

### Task 2: Wire story-as-test runner into CI

**Files:**
- Modify: `.storybook/preview.tsx` (only if runner needs it)
- Modify: `package.json` (add `test:storybook` script)
- Modify: `.github/workflows/ci.yml` (add a step running `test:storybook`)
- Possibly create: `vitest.storybook.config.ts` or a `.storybook/vitest.setup.ts` (Vitest-addon path only)

**Interfaces:**
- Produces: `npm run test:storybook` — runs every story's `play()` headlessly and exits non-zero on failure. Later story tasks rely on this command to validate their `play()` assertions.

> **Risk resolution point.** Attempt the Vitest addon first (reuses our Vitest 4 + Playwright). If it does not support Vitest 4 / Vite 8 cleanly, fall back to `@storybook/test-runner`. Record which path was taken in the commit message.

- [ ] **Step 1 (Primary — Vitest addon): install and configure**

Run: `npx storybook@latest add @storybook/addon-vitest`
This wires a Vitest "storybook" project and a browser provider. Ensure the browser provider is Playwright in the generated config:

```ts
// generated vitest project (e.g. .storybook/vitest config) should contain:
browser: { enabled: true, provider: 'playwright', instances: [{ browser: 'chromium' }] },
```

Add to `package.json` scripts:

```json
"test:storybook": "vitest run --project=storybook"
```

- [ ] **Step 2 (Primary): verify against the smoke story**

Run: `npx playwright install chromium` then `npm run test:storybook`
Expected: 1 passed (the `Smoke` story renders with no `play()` error).

- [ ] **Step 1b (Fallback — only if Step 1/2 fails on Vitest 4): use the test-runner**

Run: `npm i -D @storybook/test-runner concurrently http-server`
Add scripts to `package.json`:

```json
"test:storybook": "concurrently -k -s first \"npm run build-storybook -- --quiet && npx http-server storybook-static -p 6006 --silent\" \"npx wait-on tcp:6006 && test-storybook --url http://localhost:6006\""
```

(Install `wait-on` too: `npm i -D wait-on`.) Run `npm run test:storybook` and expect the smoke story to pass.

- [ ] **Step 3: Add the CI step**

In `.github/workflows/ci.yml`, inside the existing `check` job (which already runs `npm ci`), add after `npm run test:unit`:

```yaml
      - run: npx playwright install --with-deps chromium
      - run: npm run test:storybook
```

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json .github/workflows/ci.yml .storybook
git commit -m "test: run Storybook stories as tests in CI (record: vitest-addon | test-runner)"
```

---

### Task 3: Widget domain — types, schema, in-memory store

**Files:**
- Create: `src/shared/ui/codebook-page/__fixtures__/widget/types.ts`
- Create: `src/shared/ui/codebook-page/__fixtures__/widget/schema.ts`
- Create: `src/shared/ui/codebook-page/__fixtures__/widget/store.ts`
- Test: `src/shared/ui/codebook-page/__fixtures__/widget/store.test.ts`

**Interfaces:**
- Produces:
  - `Widget = { id: number; name: string; category: WidgetCategory; quantity: number; active: boolean; status: WidgetStatus }`
  - `WidgetCategory = 'gadget' | 'gizmo' | 'doohickey'`, `WidgetStatus = 'active' | 'done'`
  - `widgetSchema` (zod), `WidgetFormValues = z.infer<typeof widgetSchema>`
  - `createWidgetStore(initial: Widget[]): WidgetStore` where
    `WidgetStore = { list(): Widget[]; create(data: WidgetFormValues): Widget; update(id: number, data: Partial<Widget>): Widget; remove(id: number): void; reset(next: Widget[]): void }`
  - `seedWidgets: Widget[]` (deterministic 12-row seed)

- [ ] **Step 1: Write the failing store test**

`store.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

import { createWidgetStore } from './store';
import type { Widget } from './types';

const rows: Widget[] = [
  { id: 1, name: 'Alpha', category: 'gadget', quantity: 2, active: true, status: 'active' },
  { id: 2, name: 'Beta', category: 'gizmo', quantity: 5, active: false, status: 'done' },
];

describe('createWidgetStore', () => {
  it('lists clones, not references', () => {
    const store = createWidgetStore(rows);
    const a = store.list();
    a[0].name = 'mutated';
    expect(store.list()[0].name).toBe('Alpha');
  });

  it('creates with a fresh incrementing id', () => {
    const store = createWidgetStore(rows);
    const created = store.create({ name: 'Gamma', category: 'doohickey', quantity: 1, active: true });
    expect(created.id).toBe(3);
    expect(store.list()).toHaveLength(3);
  });

  it('updates by id', () => {
    const store = createWidgetStore(rows);
    store.update(1, { quantity: 99 });
    expect(store.list().find((w) => w.id === 1)?.quantity).toBe(99);
  });

  it('removes by id', () => {
    const store = createWidgetStore(rows);
    store.remove(1);
    expect(store.list().map((w) => w.id)).toEqual([2]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/shared/ui/codebook-page/__fixtures__/widget/store.test.ts`
Expected: FAIL — `createWidgetStore` not found.

- [ ] **Step 3: Implement types, schema, store**

`types.ts`:

```ts
export type WidgetCategory = 'gadget' | 'gizmo' | 'doohickey';
export type WidgetStatus = 'active' | 'done';

export interface Widget {
  id: number;
  name: string;
  category: WidgetCategory;
  quantity: number;
  active: boolean;
  /** Record lifecycle used to demo status-locked permissions (done = locked). */
  status: WidgetStatus;
}
```

`schema.ts`:

```ts
import { z } from 'zod';

// Validation messages are i18n keys, matching entities/company/model/schema.ts.
export const widgetSchema = z.object({
  name: z.string().min(1, 'validation.required').max(60, 'validation.tooLong'),
  category: z.enum(['gadget', 'gizmo', 'doohickey']),
  quantity: z.number().int().min(0, 'validation.invalid'),
  active: z.boolean(),
});

export type WidgetFormValues = z.infer<typeof widgetSchema>;
```

`store.ts`:

```ts
import type { Widget, WidgetFormValues } from './types';

export interface WidgetStore {
  list: () => Widget[];
  create: (data: WidgetFormValues) => Widget;
  update: (id: number, data: Partial<Widget>) => Widget;
  remove: (id: number) => void;
  reset: (next: Widget[]) => void;
}

const clone = (w: Widget): Widget => ({ ...w });

export function createWidgetStore(initial: Widget[]): WidgetStore {
  let rows = initial.map(clone);
  let nextId = rows.reduce((max, w) => Math.max(max, w.id), 0) + 1;

  return {
    list: () => rows.map(clone),
    create: (data) => {
      const created: Widget = { ...data, id: nextId++, status: 'active' };
      rows = [...rows, created];
      return clone(created);
    },
    update: (id, data) => {
      rows = rows.map((w) => (w.id === id ? { ...w, ...data } : w));
      const found = rows.find((w) => w.id === id);
      if (!found) throw new Error(`Widget ${id} not found`);
      return clone(found);
    },
    remove: (id) => {
      rows = rows.filter((w) => w.id !== id);
    },
    reset: (next) => {
      rows = next.map(clone);
      nextId = rows.reduce((max, w) => Math.max(max, w.id), 0) + 1;
    },
  };
}

const CATEGORIES: Widget['category'][] = ['gadget', 'gizmo', 'doohickey'];

export const seedWidgets: Widget[] = Array.from({ length: 12 }, (_, i) => ({
  id: i + 1,
  name: `Widget ${String(i + 1).padStart(2, '0')}`,
  category: CATEGORIES[i % 3],
  quantity: (i * 3) % 11,
  active: i % 2 === 0,
  status: i === 1 ? 'done' : 'active', // one locked row for the permission story
}));
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/shared/ui/codebook-page/__fixtures__/widget/store.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/shared/ui/codebook-page/__fixtures__/widget/{types.ts,schema.ts,store.ts,store.test.ts}
git commit -m "feat: widget fixture domain (types, schema, in-memory store)"
```

---

### Task 4: Widget hooks factory (Approach C)

**Files:**
- Create: `src/shared/ui/codebook-page/__fixtures__/widget/hooks.ts`
- Test: `src/shared/ui/codebook-page/__fixtures__/widget/hooks.test.tsx`

**Interfaces:**
- Consumes: `WidgetStore`, `Widget`, `WidgetFormValues` (Task 3); `CodebookHooks`, `CodebookHooksClient`, `CodebookHooksServer`, `ListParams`, `Paginated` from `../../core/types`.
- Produces:
  - `createWidgetHooks(config: WidgetHooksConfig): CodebookHooks<Widget>`
  - `interface WidgetHooksConfig { mode: 'client' | 'server'; store: WidgetStore; latencyMs?: number; failList?: boolean }`
  - `WIDGET_LIST_KEY = ['fixture-widgets'] as const`

- [ ] **Step 1: Write the failing hook test**

`hooks.test.tsx`:

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';

import { createWidgetHooks } from './hooks';
import { createWidgetStore } from './store';
import type { Widget } from './types';

const rows: Widget[] = [
  { id: 1, name: 'Alpha', category: 'gadget', quantity: 2, active: true, status: 'active' },
];

function wrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

describe('createWidgetHooks (client mode)', () => {
  it('useList resolves the store rows', async () => {
    const hooks = createWidgetHooks({ mode: 'client', store: createWidgetStore(rows) });
    if (hooks.mode !== 'client') throw new Error('expected client mode');
    const { result } = renderHook(() => hooks.useList(), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.data).toHaveLength(1));
    expect(result.current.data?.[0].name).toBe('Alpha');
  });

  it('useList surfaces an error when failList is set', async () => {
    const hooks = createWidgetHooks({ mode: 'client', store: createWidgetStore(rows), failList: true });
    if (hooks.mode !== 'client') throw new Error('expected client mode');
    const { result } = renderHook(() => hooks.useList(), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('createWidgetHooks (server mode)', () => {
  it('useList paginates in-memory', async () => {
    const many: Widget[] = Array.from({ length: 15 }, (_, i) => ({
      id: i + 1, name: `W${i}`, category: 'gadget', quantity: i, active: true, status: 'active',
    }));
    const hooks = createWidgetHooks({ mode: 'server', store: createWidgetStore(many) });
    if (hooks.mode !== 'server') throw new Error('expected server mode');
    const { result } = renderHook(() => hooks.useList({ page: 1, pageSize: 10 }), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.data?.total).toBe(15));
    expect(result.current.data?.items).toHaveLength(10);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/shared/ui/codebook-page/__fixtures__/widget/hooks.test.tsx`
Expected: FAIL — `createWidgetHooks` not found.

- [ ] **Step 3: Implement the hooks factory**

`hooks.ts`:

```ts
import { useMutation, useQuery, useQueryClient, type UseQueryResult } from '@tanstack/react-query';

import type {
  CodebookHooks,
  ListParams,
  Paginated,
} from '../../core/types';
import type { WidgetStore } from './store';
import type { Widget, WidgetFormValues } from './types';

export const WIDGET_LIST_KEY = ['fixture-widgets'] as const;

export interface WidgetHooksConfig {
  mode: 'client' | 'server';
  store: WidgetStore;
  /** Artificial delay before the list resolves — used by the Loading story. */
  latencyMs?: number;
  /** Make useList reject — used by the ListError story. */
  failList?: boolean;
}

const wait = (ms?: number) => (ms ? new Promise((r) => setTimeout(r, ms)) : Promise.resolve());

function applyServerParams(rows: Widget[], params: ListParams): Paginated<Widget> {
  let out = [...rows];
  if (params.sortField) {
    const dir = params.sortOrder === 'descend' ? -1 : 1;
    const key = params.sortField as keyof Widget;
    out.sort((a, b) => (a[key] < b[key] ? -1 : a[key] > b[key] ? 1 : 0) * dir);
  }
  const total = out.length;
  const start = (params.page - 1) * params.pageSize;
  return { items: out.slice(start, start + params.pageSize), total };
}

export function createWidgetHooks(config: WidgetHooksConfig): CodebookHooks<Widget> {
  const { store, latencyMs, failList } = config;

  const useCreate = () => {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: async (data: WidgetFormValues) => {
        await wait(latencyMs);
        return store.create(data);
      },
      onSuccess: () => qc.invalidateQueries({ queryKey: WIDGET_LIST_KEY }),
    });
  };

  const useUpdate = () => {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: async ({ id, data }: { id: string | number; data: Partial<Widget> }) => {
        await wait(latencyMs);
        return store.update(Number(id), data);
      },
      onSuccess: () => qc.invalidateQueries({ queryKey: WIDGET_LIST_KEY }),
    });
  };

  const useDelete = () => {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: async (id: string | number) => {
        await wait(latencyMs);
        store.remove(Number(id));
      },
      onSuccess: () => qc.invalidateQueries({ queryKey: WIDGET_LIST_KEY }),
    });
  };

  const runList = async () => {
    await wait(latencyMs);
    if (failList) throw new Error('fixture: forced list failure');
    return store.list();
  };

  if (config.mode === 'client') {
    return {
      mode: 'client',
      useList: () =>
        useQuery({ queryKey: WIDGET_LIST_KEY, queryFn: runList }) as UseQueryResult<Widget[]>,
      useCreate,
      useUpdate,
      useDelete,
    };
  }

  return {
    mode: 'server',
    useList: (params: ListParams) =>
      useQuery({
        queryKey: [...WIDGET_LIST_KEY, params],
        queryFn: async () => applyServerParams(await runList(), params),
      }) as UseQueryResult<Paginated<Widget>>,
    useCreate,
    useUpdate,
    useDelete,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/shared/ui/codebook-page/__fixtures__/widget/hooks.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/shared/ui/codebook-page/__fixtures__/widget/{hooks.ts,hooks.test.tsx}
git commit -m "feat: widget fixture hooks (in-memory, real query lifecycle)"
```

---

### Task 5: Widget permission variants

**Files:**
- Create: `src/shared/ui/codebook-page/__fixtures__/widget/permissions.ts`
- Test: `src/shared/ui/codebook-page/__fixtures__/widget/permissions.test.ts`

**Interfaces:**
- Consumes: `CodebookPermissions`, `PermissionResult` from `../../core/types`; `Widget` (Task 3).
- Produces:
  - `buildWidgetPermissions(deps: { can: (a: string, s: string, r?: unknown) => boolean }): CodebookPermissions<Widget>`
  - `readonlyWidgetPermissions: CodebookPermissions<Widget>` (create/update/delete all not visible)
  - Update/delete are **status-locked**: a `done` record returns `{ visible: true, enabled: false, reason: 'codebook.lockedField' }`.

- [ ] **Step 1: Write the failing test**

`permissions.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

import { buildWidgetPermissions } from './permissions';
import type { Widget } from './types';

const active: Widget = { id: 1, name: 'A', category: 'gadget', quantity: 1, active: true, status: 'active' };
const done: Widget = { ...active, id: 2, status: 'done' };

const allow = () => true;

describe('buildWidgetPermissions', () => {
  it('locks update/delete for done records with a reason', () => {
    const p = buildWidgetPermissions({ can: allow });
    const upd = p.update as (r: Widget) => { visible: boolean; enabled: boolean; reason?: string };
    expect(upd(active).enabled).toBe(true);
    expect(upd(done).enabled).toBe(false);
    expect(upd(done).reason).toBe('codebook.lockedField');
  });

  it('respects the injected can() for create', () => {
    const denied = buildWidgetPermissions({ can: () => false });
    const create = denied.create as () => boolean;
    expect(create()).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/shared/ui/codebook-page/__fixtures__/widget/permissions.test.ts`
Expected: FAIL — `buildWidgetPermissions` not found.

- [ ] **Step 3: Implement permissions**

`permissions.ts`:

```ts
import type { CodebookPermissions, PermissionResult } from '../../core/types';
import type { Widget } from './types';

interface Deps {
  can: (action: string, subject: string, record?: unknown) => boolean;
}

// Status-lock helper: mirrors the equipment/country convention — a `done`
// record is RBAC-visible but disabled, with an i18n reason for the tooltip.
function statusLocked(can: boolean, record: Widget): PermissionResult {
  if (!can) return { visible: false, enabled: false };
  if (record.status === 'done') {
    return { visible: true, enabled: false, reason: 'codebook.lockedField' };
  }
  return { visible: true, enabled: true };
}

// Lazy functions (resolved at point-of-use), matching entities/company/model/permissions.ts.
export function buildWidgetPermissions({ can }: Deps): CodebookPermissions<Widget> {
  return {
    create: () => can('create', 'Widget'),
    update: (r) => statusLocked(can('update', 'Widget', r), r),
    delete: (r) => statusLocked(can('delete', 'Widget', r), r),
  };
}

export const readonlyWidgetPermissions: CodebookPermissions<Widget> = {
  create: () => false,
  update: () => ({ visible: false, enabled: false }),
  delete: () => ({ visible: false, enabled: false }),
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/shared/ui/codebook-page/__fixtures__/widget/permissions.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/shared/ui/codebook-page/__fixtures__/widget/{permissions.ts,permissions.test.ts}
git commit -m "feat: widget fixture permission variants (status-locked + read-only)"
```

---

### Task 6: Composed `WidgetsCodebook` component + Storybook decorators

**Files:**
- Create: `src/shared/ui/codebook-page/__fixtures__/widget/WidgetsCodebook.tsx`
- Create: `src/shared/ui/codebook-page/__stories__/decorators.tsx`

**Interfaces:**
- Consumes: everything from Task 3–5; the public compound API from `../../index` (`Codebook`, `useDefaultActionsColumn`) — imported via the slice's own files with a **relative** path (`../../index`), not `@/shared/ui/codebook-page` (avoid a slice importing its own public alias).
- Produces:
  - `WidgetsCodebook(props: { hooks: CodebookHooks<Widget>; permissions: CodebookPermissions<Widget>; showPager?: boolean })` — the composed page.
  - `withProviders` decorator (fresh `QueryClient` + antd `<App>`).
  - `seedRbac(rules: Record<string, boolean | ((r?: unknown) => boolean)>)` and `resetRbac()` helpers built on `useAbilityStore`.

- [ ] **Step 1: Implement the composed component**

`WidgetsCodebook.tsx`:

```tsx
import { Input, InputNumber, Select, Switch } from 'antd';

import { Codebook, useDefaultActionsColumn } from '../../index';
import type { CodebookHooks, CodebookPermissions } from '../../core/types';
import { widgetSchema } from './schema';
import type { Widget } from './types';

interface Props {
  hooks: CodebookHooks<Widget>;
  permissions: CodebookPermissions<Widget>;
  showPager?: boolean;
}

export function WidgetsCodebook({ hooks, permissions, showPager = true }: Props) {
  const actionsColumn = useDefaultActionsColumn<Widget>();

  return (
    <Codebook.Root<Widget>
      rowKey="id"
      hooks={hooks}
      permissions={permissions}
      schema={widgetSchema}
    >
      <Codebook.Toolbar title="Widgets" />
      {showPager && <Codebook.Pager pageSize={10} showSizeChanger pageSizeOptions={[5, 10, 20]} />}

      <Codebook.Table<Widget>
        columns={[
          { title: 'Name', dataIndex: 'name', sorter: true },
          { title: 'Category', dataIndex: 'category' },
          { title: 'Quantity', dataIndex: 'quantity', sorter: true },
          {
            title: 'Active',
            dataIndex: 'active',
            render: (active: boolean) => (active ? 'Yes' : 'No'),
          },
          { title: 'Status', dataIndex: 'status' },
        ]}
        actionsColumn={actionsColumn}
      />

      <Codebook.FormModal title="Widget">
        <Codebook.Field name="name" label="Name">
          <Input maxLength={60} />
        </Codebook.Field>
        <Codebook.Field name="category" label="Category">
          <Select
            options={[
              { value: 'gadget', label: 'Gadget' },
              { value: 'gizmo', label: 'Gizmo' },
              { value: 'doohickey', label: 'Doohickey' },
            ]}
          />
        </Codebook.Field>
        <Codebook.Field name="quantity" label="Quantity">
          <InputNumber min={0} />
        </Codebook.Field>
        <Codebook.Field name="active" label="Active">
          <Switch />
        </Codebook.Field>
      </Codebook.FormModal>
    </Codebook.Root>
  );
}
```

- [ ] **Step 2: Implement the decorators**

`decorators.tsx`:

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App as AntApp } from 'antd';
import type { Decorator } from '@storybook/react';

import { useAbilityStore } from '@/shared/lib/rbac';

// A fresh QueryClient per story keeps cache/mutation state from leaking.
export const withProviders: Decorator = (Story) => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <QueryClientProvider client={qc}>
      <AntApp>
        <Story />
      </AntApp>
    </QueryClientProvider>
  );
};

type Rules = Record<string, boolean | ((record?: unknown) => boolean)>;

export function seedRbac(rules: Rules) {
  useAbilityStore.setState({ rules });
}

export function resetRbac() {
  useAbilityStore.setState({ rules: {} });
}
```

> Note: `useAbilityStore` must be exported from `@/shared/lib/rbac/index.ts`. If it is not, add `export { useAbilityStore } from './store';` there in this step and commit that with the task.

- [ ] **Step 3: Verify it renders in Storybook**

Add a throwaway story temporarily (or reuse `Smoke`) that renders `<WidgetsCodebook hooks={createWidgetHooks({ mode: 'client', store: createWidgetStore(seedWidgets) })} permissions={buildWidgetPermissions({ can: () => true })} />` behind `withProviders`, run `npm run storybook`, confirm the table of 12 rows renders, then remove the throwaway. (Task 7 adds the permanent stories.)

- [ ] **Step 4: Typecheck**

Run: `npx tsc -b`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/shared/ui/codebook-page/__fixtures__/widget/WidgetsCodebook.tsx src/shared/ui/codebook-page/__stories__/decorators.tsx src/shared/lib/rbac/index.ts
git commit -m "feat: composed WidgetsCodebook fixture + story decorators"
```

---

### Task 7: Read/state stories with `play()` assertions

**Files:**
- Create: `src/shared/ui/codebook-page/__stories__/WidgetsCodebook.stories.tsx`

**Interfaces:**
- Consumes: `WidgetsCodebook`, `withProviders` (Task 6); `createWidgetHooks` (Task 4); `createWidgetStore`, `seedWidgets` (Task 3); `buildWidgetPermissions` (Task 5).
- Produces: stories `ClientMode`, `ServerMode`, `Loading`, `Empty`, `ListError` (CRUD/permission stories come in Task 8, appended to the same file).

- [ ] **Step 1: Write the stories file with read/state `play()` tests**

```tsx
import { expect, waitFor, within } from '@storybook/test';
import type { Meta, StoryObj } from '@storybook/react';

import { createWidgetHooks } from '../__fixtures__/widget/hooks';
import { buildWidgetPermissions } from '../__fixtures__/widget/permissions';
import { createWidgetStore, seedWidgets } from '../__fixtures__/widget/store';
import { WidgetsCodebook } from '../__fixtures__/widget/WidgetsCodebook';
import { withProviders } from './decorators';

const allowAll = buildWidgetPermissions({ can: () => true });

const meta: Meta<typeof WidgetsCodebook> = {
  title: 'codebook-page/Widgets',
  component: WidgetsCodebook,
  decorators: [withProviders],
};
export default meta;
type Story = StoryObj<typeof WidgetsCodebook>;

export const ClientMode: Story = {
  args: {
    hooks: createWidgetHooks({ mode: 'client', store: createWidgetStore(seedWidgets) }),
    permissions: allowAll,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => expect(canvas.getByText('Widget 01')).toBeInTheDocument());
  },
};

export const ServerMode: Story = {
  args: {
    hooks: createWidgetHooks({ mode: 'server', store: createWidgetStore(seedWidgets) }),
    permissions: allowAll,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => expect(canvas.getByText('Widget 01')).toBeInTheDocument());
  },
};

export const Loading: Story = {
  args: {
    hooks: createWidgetHooks({ mode: 'client', store: createWidgetStore(seedWidgets), latencyMs: 100000 }),
    permissions: allowAll,
  },
  play: async ({ canvasElement }) => {
    // antd Table renders a spinner element while loading=isFetching is true.
    await waitFor(() =>
      expect(canvasElement.querySelector('.ant-spin')).toBeInTheDocument(),
    );
  },
};

export const Empty: Story = {
  args: {
    hooks: createWidgetHooks({ mode: 'client', store: createWidgetStore([]) }),
    permissions: allowAll,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => expect(canvas.getByText('No data')).toBeInTheDocument());
  },
};

// ListError documents CURRENT behavior: Root does not propagate isError to the
// table context (Root.tsx), so a failed list renders as the empty state, NOT an
// error UI. This assertion pins that behavior; the gap is a tracked follow-up.
export const ListError: Story = {
  args: {
    hooks: createWidgetHooks({ mode: 'client', store: createWidgetStore(seedWidgets), failList: true }),
    permissions: allowAll,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => expect(canvas.getByText('No data')).toBeInTheDocument());
  },
};
```

- [ ] **Step 2: Run the story tests**

Run: `npm run test:storybook`
Expected: `ClientMode`, `ServerMode`, `Loading`, `Empty`, `ListError` all PASS. (If `Empty`/`ListError` fail on the exact empty-state text, inspect the rendered antd empty text via `npm run storybook` and adjust the matcher — antd's default is "No data".)

- [ ] **Step 3: Commit**

```bash
git add src/shared/ui/codebook-page/__stories__/WidgetsCodebook.stories.tsx
git commit -m "test: widget stories for list modes, loading, empty, list-error"
```

---

### Task 8: CRUD + permission stories, and cleanup

**Files:**
- Modify: `src/shared/ui/codebook-page/__stories__/WidgetsCodebook.stories.tsx` (append stories)
- Delete: `src/shared/ui/codebook-page/__stories__/Smoke.stories.tsx`

**Interfaces:**
- Consumes: `userEvent` from `@storybook/test`; `seedRbac`, `resetRbac` (Task 6).

- [ ] **Step 1: Append CRUD + permission stories**

Add to `WidgetsCodebook.stories.tsx` (and extend the import at the top to
`import { expect, userEvent, waitFor, within } from '@storybook/test';`, plus
`import { seedRbac, resetRbac, withProviders } from './decorators';`):

```tsx
export const CreateFlow: Story = {
  args: {
    hooks: createWidgetHooks({ mode: 'client', store: createWidgetStore(seedWidgets) }),
    permissions: allowAll,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => expect(canvas.getByText('Widget 01')).toBeInTheDocument());
    await userEvent.click(canvas.getByRole('button', { name: /add/i }));
    // The modal renders in a portal (document.body), so query the whole screen.
    const dialog = within(await within(document.body).findByRole('dialog'));
    await userEvent.type(dialog.getByLabelText('Name'), 'Fresh Widget');
    await userEvent.click(document.body.querySelector('.ant-modal-footer .ant-btn-primary')!);
    await waitFor(() => expect(canvas.getByText('Fresh Widget')).toBeInTheDocument());
  },
};

export const EditFlow: Story = {
  args: {
    hooks: createWidgetHooks({ mode: 'client', store: createWidgetStore(seedWidgets) }),
    permissions: allowAll,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => expect(canvas.getByText('Widget 01')).toBeInTheDocument());
    // First row's Edit button is the first EditOutlined button in the actions column.
    const editButtons = canvasElement.querySelectorAll('button .anticon-edit');
    await userEvent.click(editButtons[0].closest('button')!);
    const dialog = within(await within(document.body).findByRole('dialog'));
    const name = dialog.getByLabelText('Name');
    await userEvent.clear(name);
    await userEvent.type(name, 'Renamed 01');
    await userEvent.click(document.body.querySelector('.ant-modal-footer .ant-btn-primary')!);
    await waitFor(() => expect(canvas.getByText('Renamed 01')).toBeInTheDocument());
  },
};

export const DeleteFlow: Story = {
  args: {
    hooks: createWidgetHooks({ mode: 'client', store: createWidgetStore(seedWidgets) }),
    permissions: allowAll,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => expect(canvas.getByText('Widget 01')).toBeInTheDocument());
    const delButtons = canvasElement.querySelectorAll('button .anticon-delete');
    await userEvent.click(delButtons[0].closest('button')!);
    // antd Popconfirm confirm button renders in a portal.
    const confirm = await within(document.body).findByRole('button', { name: /^ok$/i });
    await userEvent.click(confirm);
    await waitFor(() => expect(canvas.queryByText('Widget 01')).not.toBeInTheDocument());
  },
};

export const PermissionGated: Story = {
  args: {
    hooks: createWidgetHooks({ mode: 'client', store: createWidgetStore(seedWidgets) }),
    // Uses the rbac path: buildWidgetPermissions reads the seeded ability store.
    permissions: buildWidgetPermissions({
      can: (action, subject, record) => {
        // create denied; update/delete allowed (then status-locked for 'done' rows)
        if (action === 'create') return false;
        return true;
      },
    }),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => expect(canvas.getByText('Widget 01')).toBeInTheDocument());
    // create is not visible -> no Add button
    expect(canvas.queryByRole('button', { name: /add/i })).not.toBeInTheDocument();
    // 'Widget 02' is seeded status:'done' -> its edit button is disabled
    const editButtons = Array.from(canvasElement.querySelectorAll('button .anticon-edit')).map(
      (i) => i.closest('button') as HTMLButtonElement,
    );
    expect(editButtons.some((b) => b.disabled)).toBe(true);
  },
};
```

- [ ] **Step 2: Remove the smoke story**

```bash
git rm src/shared/ui/codebook-page/__stories__/Smoke.stories.tsx
```

- [ ] **Step 3: Run the full story suite**

Run: `npm run test:storybook`
Expected: all 9 Widget stories PASS (`ClientMode`, `ServerMode`, `Loading`, `Empty`, `ListError`, `CreateFlow`, `EditFlow`, `DeleteFlow`, `PermissionGated`). If a portal selector misses, open `npm run storybook`, inspect the DOM for the story, and adjust the selector.

- [ ] **Step 4: Full project check**

Run: `npm run check`
Expected: `tsc -b`, `eslint`, `steiger ./src`, and prettier all pass with the fixture present.

- [ ] **Step 5: Commit**

```bash
git add src/shared/ui/codebook-page/__stories__/WidgetsCodebook.stories.tsx
git commit -m "test: widget CRUD + permission-gated stories; remove smoke story"
```

---

## Follow-ups (out of scope — file as issues)

- `Root` does not propagate `listQuery.isError` into the table context (`Root.tsx:129-157`); the `ListError` story documents the resulting empty-state behavior. Decide whether list errors should render a dedicated error UI and wire it if so.

## Self-Review

- **Spec coverage:** placement (Task 3–6 under `__fixtures__`/`__stories__`), Approach C in-memory store + real QueryClient (Task 3–4), factory with `latencyMs`/`failList`/`seed`/mode (Task 4), both list modes (stories `ClientMode`/`ServerMode`), full state matrix incl. `ListError` document-not-fix (Task 7–8), provider harness + rbac seeding (Task 6), Storybook 9 + react-vite (Task 1), story-as-test in CI with addon-vitest→test-runner fallback (Task 2), dev-only/not-in-bundle (no `index.ts` export; verified by `npm run check` in Task 8), `steiger`/`tsc` green (Task 8). All spec sections map to a task.
- **Placeholder scan:** no TBD/TODO; every code step shows complete code; commands have expected output.
- **Type consistency:** `createWidgetStore`/`WidgetStore`, `createWidgetHooks`/`WidgetHooksConfig`, `WIDGET_LIST_KEY`, `buildWidgetPermissions`/`readonlyWidgetPermissions`, `WidgetsCodebook`, `withProviders`/`seedRbac`/`resetRbac` are named identically across the tasks that define and consume them.
