import type { CompanyResponse } from '@/api/generated/tracer/models';

/** Raw generated DTO — all fields optional. Only used inside this slice's api segment. */
export type CompanyDto = CompanyResponse;

/**
 * Normalized internal type the rest of the app trusts. The Spring-generated DTO
 * marks every field optional, but `id`/`name`/`shortName` are the entity's identity
 * and must be present — normalizeCompany enforces that at the boundary (and logs drift).
 */
export interface Company extends CompanyResponse {
  id: number;
  name: string;
  shortName: string;
  active: boolean;
}
