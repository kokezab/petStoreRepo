import { create } from 'zustand';

import type { PetStatus } from '@/entities/pet';

export type PetCategory = 'Dogs' | 'Cats';

interface PetsFilterState {
  status: PetStatus;
  category: PetCategory | null;
  actions: {
    setStatus: (status: PetStatus) => void;
    setCategory: (category: PetCategory | null) => void;
  };
}

export const usePetsFilterStore = create<PetsFilterState>((set) => ({
  status: 'available',
  category: null,
  actions: {
    setStatus: (status: PetStatus) => set({ status }),
    setCategory: (category: PetCategory | null) => set({ category }),
  },
}));

export const usePetsFilterActions = () => usePetsFilterStore((state) => state.actions);
