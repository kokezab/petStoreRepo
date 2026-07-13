# Zustand Setup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Install zustand and create a modal demo to validate global state management and cross-component communication.

**Architecture:** Two lightweight zustand stores (theme + modal UI state) with three demo components that communicate through shared state. Stores are in `src/stores/` with TypeScript types. Demo components in `src/features/demo/` for easy cleanup.

**Tech Stack:** Zustand, React 19, TypeScript, Ant Design Modal

## Global Constraints

- No tests — demo is temporary and will be deleted
- Do not modify existing features or React Query setup
- Follow existing code style (TypeScript, import order, formatting)
- Delete all demo code and stores after verification

---

## Task 1: Install Zustand

**Files:**
- Modify: `package.json`

**Interfaces:**
- Produces: zustand package available for import

- [ ] **Step 1: Install zustand**

```bash
npm install zustand
```

Expected output: Package added to `node_modules/` and `package.json`

- [ ] **Step 2: Verify installation**

```bash
npm ls zustand
```

Expected output: Shows zustand version (e.g., `zustand@4.x.x`)

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "deps: install zustand for state management"
```

---

## Task 2: Create useModalStore

**Files:**
- Create: `src/stores/useModalStore.ts`

**Interfaces:**
- Produces:
  - `useModalStore`: Zustand hook returning `{ isOpen: boolean; message: string; openModal: (msg: string) => void; closeModal: () => void }`

- [ ] **Step 1: Create stores directory and file**

Create file `src/stores/useModalStore.ts` with the following content:

```typescript
import { create } from 'zustand';

interface ModalState {
  isOpen: boolean;
  message: string;
  openModal: (message: string) => void;
  closeModal: () => void;
}

export const useModalStore = create<ModalState>((set) => ({
  isOpen: false,
  message: '',
  openModal: (message: string) => set({ isOpen: true, message }),
  closeModal: () => set({ isOpen: false, message: '' }),
}));
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npm run check
```

Expected output: No TypeScript errors related to `useModalStore.ts`

- [ ] **Step 3: Commit**

```bash
git add src/stores/useModalStore.ts
git commit -m "feat: create useModalStore for modal UI state"
```

---

## Task 3: Create useThemeStore

**Files:**
- Create: `src/stores/useThemeStore.ts`

**Interfaces:**
- Produces:
  - `useThemeStore`: Zustand hook returning `{ theme: 'light' | 'dark'; toggleTheme: () => void }`

- [ ] **Step 1: Create theme store**

Create file `src/stores/useThemeStore.ts` with the following content:

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ThemeState {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>(
  persist(
    (set) => ({
      theme: 'light',
      toggleTheme: () =>
        set((state) => ({
          theme: state.theme === 'light' ? 'dark' : 'light',
        })),
    }),
    {
      name: 'theme-storage',
    }
  )
);
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npm run check
```

Expected output: No TypeScript errors related to `useThemeStore.ts`

- [ ] **Step 3: Commit**

```bash
git add src/stores/useThemeStore.ts
git commit -m "feat: create useThemeStore for global theme state"
```

---

## Task 4: Create ModalTrigger Component

**Files:**
- Create: `src/features/demo/ModalTrigger.tsx`

**Interfaces:**
- Consumes: `useModalStore` from Task 2
- Produces: React component `<ModalTrigger />`

- [ ] **Step 1: Create demo folder and component**

Create file `src/features/demo/ModalTrigger.tsx` with the following content:

```typescript
import { Button } from 'antd';

import { useModalStore } from '../../stores/useModalStore';

export function ModalTrigger() {
  const openModal = useModalStore((state) => state.openModal);

  return (
    <Button type="primary" onClick={() => openModal('Hello from zustand!')}>
      Open Demo Modal
    </Button>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npm run check
```

Expected output: No TypeScript errors related to `ModalTrigger.tsx`

- [ ] **Step 3: Commit**

```bash
git add src/features/demo/ModalTrigger.tsx
git commit -m "feat: create ModalTrigger demo component"
```

---

## Task 5: Create DemoModal Component

**Files:**
- Create: `src/features/demo/DemoModal.tsx`

**Interfaces:**
- Consumes: `useModalStore` from Task 2
- Produces: React component `<DemoModal />`

- [ ] **Step 1: Create modal component**

Create file `src/features/demo/DemoModal.tsx` with the following content:

```typescript
import { Modal } from 'antd';

import { useModalStore } from '../../stores/useModalStore';

export function DemoModal() {
  const isOpen = useModalStore((state) => state.isOpen);
  const message = useModalStore((state) => state.message);
  const closeModal = useModalStore((state) => state.closeModal);

  return (
    <Modal
      title="Demo Modal"
      open={isOpen}
      onOk={closeModal}
      onCancel={closeModal}
    >
      <p>{message}</p>
    </Modal>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npm run check
```

Expected output: No TypeScript errors related to `DemoModal.tsx`

- [ ] **Step 3: Commit**

```bash
git add src/features/demo/DemoModal.tsx
git commit -m "feat: create DemoModal component"
```

---

## Task 6: Create ModalStatus Component

**Files:**
- Create: `src/features/demo/ModalStatus.tsx`

**Interfaces:**
- Consumes: `useModalStore` from Task 2
- Produces: React component `<ModalStatus />`

- [ ] **Step 1: Create status component**

Create file `src/features/demo/ModalStatus.tsx` with the following content:

```typescript
import { Tag } from 'antd';

import { useModalStore } from '../../stores/useModalStore';

export function ModalStatus() {
  const isOpen = useModalStore((state) => state.isOpen);

  return (
    <div>
      <p>
        Modal is{' '}
        <Tag color={isOpen ? 'green' : 'red'}>
          {isOpen ? 'open' : 'closed'}
        </Tag>
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npm run check
```

Expected output: No TypeScript errors related to `ModalStatus.tsx`

- [ ] **Step 3: Commit**

```bash
git add src/features/demo/ModalStatus.tsx
git commit -m "feat: create ModalStatus component"
```

---

## Task 7: Integrate Demo Components into App.tsx

**Files:**
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `<ModalTrigger />`, `<DemoModal />`, `<ModalStatus />` from Tasks 4-6

- [ ] **Step 1: Read current App.tsx**

```bash
head -50 src/App.tsx
```

This shows the current structure so we can add demo components appropriately.

- [ ] **Step 2: Add demo imports and section to App.tsx**

Open `src/App.tsx` and add these imports at the top (after existing imports):

```typescript
import { DemoModal } from './features/demo/DemoModal';
import { ModalStatus } from './features/demo/ModalStatus';
import { ModalTrigger } from './features/demo/ModalTrigger';
```

Then, add a demo section somewhere in the JSX (e.g., at the end of the main layout or in a sidebar). Find a suitable location and add:

```typescript
{/* DEMO: Zustand modal state management - delete after testing */}
<div style={{ padding: '16px', border: '1px solid #ccc', marginTop: '16px' }}>
  <h3>Zustand Demo</h3>
  <ModalStatus />
  <ModalTrigger />
  <DemoModal />
</div>
```

Expected: The demo section should be easily identifiable and removable.

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npm run check
```

Expected output: No TypeScript errors

- [ ] **Step 4: Verify the app runs without errors**

```bash
npm run dev
```

Expected output: Dev server starts without errors. Open http://localhost:5173 in browser and verify the app loads.

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx
git commit -m "demo: integrate zustand modal demo into App"
```

---

## Task 8: Manual Verification

**Files:**
- No files modified; verification only

- [ ] **Step 1: Start dev server**

```bash
npm run dev
```

Keep the dev server running.

- [ ] **Step 2: Open browser and navigate to the app**

Open http://localhost:5173 in your browser. The app should load without errors.

- [ ] **Step 3: Verify demo section renders**

Look for the "Zustand Demo" section with:
- A status badge showing "Modal is closed" in red
- An "Open Demo Modal" button
- The modal component (not visible yet)

Expected: All elements should render without console errors.

- [ ] **Step 4: Test opening the modal**

Click the "Open Demo Modal" button.

Expected:
- Modal appears with title "Demo Modal"
- Modal displays message "Hello from zustand!"
- Status badge changes to "Modal is open" in green

- [ ] **Step 5: Test closing the modal**

Click the "OK" or "Cancel" button on the modal.

Expected:
- Modal closes
- Status badge changes back to "Modal is closed" in red

- [ ] **Step 6: Test multiple state subscriptions**

Click "Open Demo Modal" again.

Expected:
- Modal opens
- Status badge updates simultaneously
- Both components reflect the same state independently

- [ ] **Step 7: Verify no console errors**

Open browser DevTools (F12) and check the Console tab.

Expected: No errors or warnings related to zustand or demo components

- [ ] **Step 8: Verify existing features still work**

Navigate to existing pages (Pets list, Inventory, Settings) and verify they work normally.

Expected: No regressions, existing features unaffected

- [ ] **Step 9: Verification complete**

All acceptance criteria met. Zustand is successfully installed and working.

---

## Post-Verification Cleanup (When Ready)

After the above tasks are complete and verified, follow these steps to clean up:

- [ ] Delete the demo folder

```bash
rm -r src/features/demo
```

- [ ] Delete the stores

```bash
rm src/stores/useThemeStore.ts src/stores/useModalStore.ts
```

- [ ] Remove demo section from App.tsx

Open `src/App.tsx` and remove:
- The three demo imports
- The entire demo `<div>` section

- [ ] Commit cleanup

```bash
git add src/App.tsx
git commit -m "demo: remove zustand demo after validation"
```

---

## Summary

**What gets delivered:**
- Zustand package installed
- Two type-safe stores (modal UI state, theme state)
- Three demo components showing cross-component communication
- Verified working behavior in dev server
- Clean deletion instructions for when demo is no longer needed

**What stays:**
- Zustand package (ready for future use)
- Project structure unchanged
- Existing features untouched
