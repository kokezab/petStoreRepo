import { create } from 'zustand';

import type { FindPetsByStatusStatusItem } from '@/api/generated/models';

interface PetsFilterState {
  status: FindPetsByStatusStatusItem;
  actions: { setStatus: (status: FindPetsByStatusStatusItem) => void };
}

export const usePetsFilterStore = create<PetsFilterState>((set) => ({
  status: 'available',
  actions: {
    setStatus: (status: FindPetsByStatusStatusItem) => set({ status }),
  },
}));

export const usePetsFilterActions = () => usePetsFilterStore((state) => state.actions);
