# Antd App Layout + Tailwind Utilities

## Goal

Rework the app shell to use Antd's `Layout` system consistently (building on the
sticky `NavBar` header already in place), wire the existing-but-unused
`useThemeStore` into Antd's theming, and introduce Tailwind CSS as a
utility-class layer for one-off layout glue — without fighting Antd's own
styling.

## Scope

- App shell layout (`App.tsx`, `index.css`)
- Theming wiring (`main.tsx` or a new provider wrapper, `useThemeStore`)
- Tailwind installation and config
- Explicitly **not** in scope: redesigning individual pages
  (`PetListPage`, `InventoryPage`, `PetDetailsPage`, `SignupPage`,
  `SettingsPage`), adding new UI controls for theme/accent/font-size/density
  (no toggle button/settings form in this pass), migrating existing components
  off Antd.

## 1. Tailwind Setup

- Install `tailwindcss` and `@tailwindcss/vite` (Tailwind v4, Vite plugin
  approach — no `tailwind.config.js` / PostCSS pipeline needed).
- Register the Vite plugin in `vite.config.ts`.
- In `index.css`, import Tailwind's theme and utilities layers directly,
  skipping the `preflight` (reset) layer so it doesn't fight Antd's own CSS
  reset on buttons/inputs/etc.:
  ```css
  @import "tailwindcss/theme.css";
  @import "tailwindcss/utilities.css";
  ```
- Tailwind utility classes are used only in our own wrapper markup (layout
  spacing, flex containers, one-off padding/margin) — never applied to style
  the internals of Antd components, and Antd components are never restyled
  via Tailwind's `@apply`.

## 2. App Shell (`App.tsx`)

Replace the current fragment-based structure with Antd's `Layout`:

```tsx
<Layout style={{ minHeight: '100vh' }}>
  <NavBar />
  <Layout.Content className="mx-auto w-full max-w-5xl px-6 py-8">
    <Routes>...</Routes>
  </Layout.Content>
  <Layout.Footer className="text-center text-sm" />
</Layout>
```

- `Layout.Content` takes over the centering/max-width job currently done by
  the hand-rolled `#root { width: 1126px; margin: 0 auto; ... }` rule in
  `index.css` — that rule (and the related `border-inline`, `text-align:
  center`) is removed from `index.css`.
- `Layout.Footer` is minimal — just consistent spacing, no content required
  yet (no copyright text, links, etc. — nothing to put there today).
- `NavBar` itself is unchanged from its current implementation (sticky
  `Layout.Header` with `Menu`).

## 3. Theme Wiring (`useThemeStore` → `ConfigProvider`)

Add an `AppThemeProvider` component (new file, e.g.
`src/app/AppThemeProvider.tsx`) that wraps `App` with Antd's `ConfigProvider`,
reading from `useThemeStore`:

- `algorithm`: composed from
  - `theme.darkAlgorithm` if `theme === 'dark'`, else `theme.defaultAlgorithm`
  - plus `theme.compactAlgorithm` included in the array when
    `preferences.layout.density === 'compact'`
  (Antd supports passing an array of algorithms to compose them.)
- `token.colorPrimary`: `preferences.accentColor`
- `token.fontSize`: mapped from `preferences.fontSize`:
  - `small` → 12
  - `medium` → 14 (Antd default)
  - `large` → 16

This makes `toggleTheme`, `setAccentColor`, `setFontSize`, and `setDensity`
(already defined in the store) functionally affect the rendered app, even
though no UI to trigger them is added in this pass. A future pass can add
controls for these in `SettingsPage.tsx`.

`AppThemeProvider` is mounted in `main.tsx`, wrapping `<App />` (inside
`QueryClientProvider`, outside or inside `FlagProvider` — position doesn't
matter functionally, keep it adjacent to `QueryClientProvider` for
readability).

## 4. `index.css` Cleanup

- Remove `#root` width/centering/border rules (superseded by
  `Layout.Content`).
- Keep the existing CSS custom properties (`--text`, `--bg`, etc.) and
  `prefers-color-scheme` block as-is for now — they're not wired to Antd
  tokens in this pass and removing them is out of scope (some may still be
  referenced by page-level styles not covered here).
- Keep `body { margin: 0; }` and typography base rules (`h1`, `h2`, `code`)
  unchanged.

## Testing

- Existing `NavBar.test.tsx` and `PetListPage.test.tsx` should continue to
  pass unchanged (no structural changes to those components' own markup,
  only their ancestor layout).
- Manually verify in-browser: layout renders correctly, `NavBar` still sticks
  on scroll, content is centered with consistent padding at both desktop and
  the existing `1024px` mobile breakpoint, and toggling
  `useThemeStore.actions.toggleTheme()` (e.g. via browser devtools/console)
  visibly switches the app to Antd's dark algorithm.
