import { create } from 'zustand';

import type { PetStatus } from '@/entities/pet';

interface PetsFilterState {
  status: PetStatus;
  actions: { setStatus: (status: PetStatus) => void };
}

export const usePetsFilterStore = create<PetsFilterState>((set) => ({
  status: 'available',
  actions: {
    setStatus: (status: PetStatus) => set({ status }),
  },
}));

export const usePetsFilterActions = () => usePetsFilterStore((state) => state.actions);
