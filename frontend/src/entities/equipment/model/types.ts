import type { EquipmentWithLocationResponse } from '@/api/generated/tracer/models';

/** Raw generated DTO — all fields optional. Only used inside this slice's api segment. */
export type EquipmentDto = EquipmentWithLocationResponse;

/**
 * Normalized internal type the rest of the app trusts. The Spring-generated DTO
 * marks every field optional, but `id`/`name`/`code` are the entity's identity and
 * must be present — normalizeEquipment enforces that at the boundary (and logs drift).
 */
export interface Equipment extends EquipmentWithLocationResponse {
  id: number;
  name: string;
  code: number;
}
