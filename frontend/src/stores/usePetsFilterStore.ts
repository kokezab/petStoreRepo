import type { FindPetsByStatusStatusItem } from '@/api/generated/models';
import { create } from 'zustand';

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
