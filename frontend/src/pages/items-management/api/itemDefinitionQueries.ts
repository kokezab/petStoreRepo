import { keepPreviousData, useMutation, useQueryClient } from '@tanstack/react-query';

import { zerocodeRequest } from '@/shared/api';
import {
  createItem,
  deleteItem,
  getListItemsQueryKey,
  updateItem,
  useListItems,
} from '@/shared/api/generated/zerocode/item-controller/item-controller';
import type { ItemCreateRequest } from '@/shared/api/generated/zerocode/models/itemCreateRequest';
import type { ItemUpdateRequest } from '@/shared/api/generated/zerocode/models/itemUpdateRequest';
import type { ListItemsParams } from '@/shared/api/generated/zerocode/models/listItemsParams';

import { normalizeItemDefinitionPage } from './normalizeItemDefinition';

export type ItemListParams = Required<ListItemsParams>;

export const itemDefinitionKeys = {
  // Without params this is the prefix of every page's key, so invalidating it
  // refetches whichever pages are cached.
  list: (params?: ItemListParams) => getListItemsQueryKey(params),
};

// One page at a time from the server. The previous page stays on screen while
// the next one loads, so the table doesn't flash empty between pages.
export function useItemDefinitions(params: ItemListParams) {
  return useListItems(params, {
    request: zerocodeRequest,
    query: {
      select: normalizeItemDefinitionPage,
      placeholderData: keepPreviousData,
    },
  });
}

function useInvalidateItemDefinitions() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: itemDefinitionKeys.list() });
}

export function useCreateItemDefinition() {
  const invalidate = useInvalidateItemDefinitions();
  return useMutation({
    mutationFn: (body: ItemCreateRequest) => createItem(body, zerocodeRequest),
    onSuccess: invalidate,
  });
}

export function useUpdateItemDefinition() {
  const invalidate = useInvalidateItemDefinitions();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: ItemUpdateRequest }) =>
      updateItem(id, body, zerocodeRequest),
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
