import type { ItemResponseCustomValues } from '@/shared/api/generated/zerocode/models/itemResponseCustomValues';

export interface ItemDefinition {
  id: string;
  name: string;
  description?: string;
  customValues?: ItemResponseCustomValues;
  createdAt?: string;
  updatedAt?: string;
}
