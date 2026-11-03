import { useMutation, useQueryClient } from '@tanstack/react-query';

import { zerocodeRequest } from '@/shared/api';
import {
  createItem,
  deleteItem,
  getGetItemsQueryKey,
  updateItem,
  useGetItems,
} from '@/shared/api/generated/zerocode/item-controller/item-controller';
import type { CreateRequest, UpdateRequest } from '@/shared/api/generated/zerocode/models';
import type { ItemCreateRequest } from '@/shared/api/generated/zerocode/models/itemCreateRequest';
import type { ItemUpdateRequest } from '@/shared/api/generated/zerocode/models/itemUpdateRequest';

import { normalizeItemDefinition } from './normalizeItemDefinition';

export const itemDefinitionKeys = {
  all: getGetItemsQueryKey,
};

export function useItemDefinitions() {
  return useGetItems({
    request: zerocodeRequest,
    query: {
      select: (dtos) => dtos.map(normalizeItemDefinition),
    },
  });
}

function useInvalidateItemDefinitions() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: itemDefinitionKeys.all() });
}

export function useCreateItemDefinition() {
  const invalidate = useInvalidateItemDefinitions();
  return useMutation({
    mutationFn: (body: ItemCreateRequest) =>
      createItem(body as unknown as CreateRequest, zerocodeRequest),
    onSuccess: invalidate,
  });
}

export function useUpdateItemDefinition() {
  const invalidate = useInvalidateItemDefinitions();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: ItemUpdateRequest }) =>
      updateItem(id, body as unknown as UpdateRequest, zerocodeRequest),
    onSuccess: invalidate,
  });
}

export function useDeleteItemDefinition() {
  const invalidate = useInvalidateItemDefinitions();
  return useMutation({
    mutationFn: (id: string) => deleteItem(id, zerocodeRequest),
    onSuccess: invalidate,
  });
}
