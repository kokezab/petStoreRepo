import { create } from 'zustand';

import type { FieldDefinition } from './types';

type FieldModal =
  | { kind: 'closed' }
  | { kind: 'create' }
  | { kind: 'edit'; field: FieldDefinition }
  | { kind: 'delete'; field: FieldDefinition };

interface FieldModalState {
  modal: FieldModal;
  openCreate: () => void;
  openEdit: (field: FieldDefinition) => void;
  openDelete: (field: FieldDefinition) => void;
  close: () => void;
}

export const useFieldModalStore = create<FieldModalState>((set) => ({
  modal: { kind: 'closed' },
  openCreate: () => set({ modal: { kind: 'create' } }),
  openEdit: (field) => set({ modal: { kind: 'edit', field } }),
  openDelete: (field) => set({ modal: { kind: 'delete', field } }),
  close: () => set({ modal: { kind: 'closed' } }),
}));
