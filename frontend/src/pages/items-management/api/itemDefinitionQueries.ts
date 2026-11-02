import { zerocodeRequest } from '@/shared/api';
import {
  getGetItemsQueryKey,
  useGetItems,
} from '@/shared/api/generated/zerocode/item-controller/item-controller';

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
