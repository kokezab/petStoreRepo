import type { ItemResponseCustomValues } from '@/shared/api/generated/zerocode/models/itemResponseCustomValues';

export interface ItemDefinition {
  id: string;
  name: string;
  description?: string;
  customValues?: ItemResponseCustomValues;
  createdAt?: string;
  updatedAt?: string;
}

// One server-side page of items; `total` counts items across all pages.
export interface ItemDefinitionPage {
  items: ItemDefinition[];
  total: number;
}
