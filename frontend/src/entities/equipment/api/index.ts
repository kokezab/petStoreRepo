import { useMutation, useQueryClient, type UseQueryResult } from '@tanstack/react-query';

import {
  createEquipment,
  deleteEquipment,
  moveEquipment,
  updateEquipment,
} from '@/api/generated/tracer/equipment-command-controller/equipment-command-controller';
import {
  getGetEquipmentQueryKey,
  useGetEquipment,
} from '@/api/generated/tracer/equipment-query-controller/equipment-query-controller';
import type { CreateEquipmentCommand, UpdateEquipmentCommand } from '@/api/generated/tracer/models';
import { tracerRequest } from '@/shared/api';
import type { CodebookHooksClient } from '@/shared/ui/codebook-page';

import type { Equipment } from '../model/types';
import { normalizeEquipment } from './normalizeEquipment';

// The list endpoint returns the full collection in a single call (no server-side
// paging/sort/filter), so this codebook runs in `client` mode.
//
// Orval's generated mutation hooks don't match the CodebookHooks contract 1:1:
//   - create returns the new id (number), delete is a bulk-by-ids operation,
//     update returns void.
// Per the convention (see entities/country/api), that mismatch is adapted here in
// the hook wrappers and nowhere else — the rest of the app trusts this shape.

const QUERY_KEY = getGetEquipmentQueryKey();

export const equipmentHooksServer: CodebookHooksClient<Equipment> = {
  mode: 'client',
  useList: () =>
    useGetEquipment({
      // Normalize at the boundary: the rest of the app trusts `Equipment`,
      // never the raw generated DTO. Drift is logged inside normalizeEquipment.
      query: { select: (data) => data.map(normalizeEquipment) },
      // Route to the Tracer backend, not the shared default (petstore) base URL.
      request: tracerRequest,
    }) as UseQueryResult<Equipment[]>,
  useCreate: () => {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: async (data: Partial<Equipment>) => {
        const id = await createEquipment(data as CreateEquipmentCommand, tracerRequest);
        return { ...data, id } as Equipment;
      },
      onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
    });
  },
  useUpdate: () => {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: async ({ id, data }: { id: string | number; data: Partial<Equipment> }) => {
        await updateEquipment(Number(id), data as UpdateEquipmentCommand, tracerRequest);
        return { ...data, id: Number(id) } as Equipment;
      },
      onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
    });
  },
  useDelete: () => {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: (id: string | number) => deleteEquipment({ ids: [Number(id)] }, tracerRequest),
      onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
    });
  },
};

/**
 * Re-parent an equipment via PATCH /v1/equipment/{id}/move. Not part of the
 * CodebookHooks contract (which only covers list/create/update/delete) — moving
 * is equipment-specific, so it's a standalone hook consumed by the Move UI.
 * `parentId: undefined` moves the equipment to the root (no parent).
 */
export function useMoveEquipment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, parentId }: { id: number; parentId?: number }) =>
      moveEquipment(id, { parentId }, tracerRequest),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}
