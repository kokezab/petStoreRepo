import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ViewState {
  pageSize: number;
  setPageSize: (n: number) => void;
}

/**
 * Generic factory for a small, persisted "view preferences" store.
 * The mechanism lives here in shared/ui, but each entity slice creates
 * and owns its own instance (its own localStorage key) — see
 * entities/country/model/viewStore.ts for the usage pattern.
 *
 * Extend ViewState here if you also want to persist sort/hidden columns/filters.
 */
export function createViewStore(storageKey: string) {
  return create<ViewState>()(
    persist(
      (set) => ({
        pageSize: 10,
        setPageSize: (pageSize) => set({ pageSize }),
      }),
      { name: `codebook-view:${storageKey}` },
    ),
  );
}
