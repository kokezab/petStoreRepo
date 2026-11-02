import type { ItemResponse } from '@/shared/api/generated/zerocode/models/itemResponse';

import type { ItemDefinition } from '../model/types';

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
