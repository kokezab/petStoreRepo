import type { ItemPageResponse } from '@/shared/api/generated/zerocode/models/itemPageResponse';
import type { ItemResponse } from '@/shared/api/generated/zerocode/models/itemResponse';

import type { ItemDefinition, ItemDefinitionPage } from '../model/types';

export function normalizeItemDefinition(dto: ItemResponse): ItemDefinition {
  return {
    id: dto.id ?? '',
    name: dto.name ?? '',
    description: dto.description ?? '',
    customValues: dto.customValues ?? {},
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  };
}

export function normalizeItemDefinitionPage(dto: ItemPageResponse): ItemDefinitionPage {
  const items = (dto.items ?? []).map(normalizeItemDefinition);
  return { items, total: dto.total ?? items.length };
}
