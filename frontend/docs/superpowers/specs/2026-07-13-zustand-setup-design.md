# Zustand Setup with Modal Demo

**Date:** 2026-07-13  
**Scope:** Install and configure zustand; create a dummy modal feature to demonstrate global state management and cross-component communication  
**Deletion Plan:** All demo components and stores will be removed after testing

---

## Overview

This spec covers installing zustand (a lightweight state management library) and building a simple modal demo that shows:
1. Global app state (theme preferences)
2. UI state management (modal open/close)
3. Cross-component communication via shared stores

The demo will be temporary and intentionally deleted after zustand is validated.

---

## Scope & Constraints

- **Do not replace React Query** — zustand manages global/UI state; React Query remains for server state
- **No tests** — demo feature is temporary and will be deleted
- **Keep it simple** — minimal dummy implementation, no extra features
- **Use existing patterns** — integrate with Ant Design where possible

---

## Architecture

### Folder Structure
```
src/
├── stores/
│   ├── useThemeStore.ts      (global theme state)
│   └── useModalStore.ts      (UI modal state)
├── features/
│   └── demo/                 (temporary, for deletion)
│       ├── ModalTrigger.tsx  (button to open modal)
│       ├── DemoModal.tsx     (modal component)
│       └── ModalStatus.tsx   (state display badge)
└── App.tsx                   (import & render demo)
```

### Store Design

#### `useThemeStore.ts`
**Purpose:** Demonstrate global app state persistence

**State:**
- `theme: 'light' | 'dark'` — current theme preference

**Actions:**
- `toggleTheme(): void` — switch between light and dark

**Implementation:** Simple zustand store with localStorage persistence (optional but recommended)

---

#### `useModalStore.ts`
**Purpose:** Demonstrate UI state and cross-component communication

**State:**
- `isOpen: boolean` — whether modal is visible
- `message: string` — modal content/message

**Actions:**
- `openModal(message: string): void` — open modal with message
- `closeModal(): void` — close modal

**Implementation:** Standard zustand store (no persistence needed for UI state)

---

## Components

### `ModalTrigger.tsx`
- Renders a button labeled "Open Demo Modal"
- On click, calls `useModalStore.openModal('Hello from zustand!')`
- Demonstrates how one component dispatches state changes

### `DemoModal.tsx`
- Subscribes to `useModalStore` for `isOpen` and `message`
- Renders Ant Design `<Modal>` component
- On close button, calls `useModalStore.closeModal()`
- Demonstrates how another component consumes state

### `ModalStatus.tsx`
- Displays current modal state: `Modal is [open/closed]`
- Subscribes to `useModalStore`
- Shows multiple components can subscribe to the same state independently

---

## Integration

**In `App.tsx`:**
- Import `<ModalTrigger />`, `<DemoModal />`, `<ModalStatus />`
- Add them to the component tree (e.g., in a demo section or sidebar)
- Temporary placeholder text or section to make them easy to remove

**No modifications to:**
- Existing features (PetList, PetDetails, Inventory, Settings, etc.)
- React Query setup
- API layer

---

## Acceptance Criteria

- ✅ Zustand installed and typed correctly with TypeScript
- ✅ Two stores created (`useThemeStore`, `useModalStore`) with proper types
- ✅ Demo components render without errors
- ✅ Clicking trigger button opens modal
- ✅ Clicking close on modal closes it
- ✅ Modal status badge shows correct state in real-time
- ✅ No console errors or warnings
- ✅ Code follows existing project conventions (TypeScript, formatting, import order)

---

## Testing & Verification

- Manual verification in dev server: click buttons, open/close modal, verify state updates
- Check that multiple components subscribe to same store independently
- Verify no impact on existing features

---

## Cleanup Notes

After verification, delete:
- `src/stores/useThemeStore.ts`
- `src/stores/useModalStore.ts`
- `src/features/demo/` folder entirely
- Demo imports/usage from `App.tsx`

Zustand package remains installed for future use.
