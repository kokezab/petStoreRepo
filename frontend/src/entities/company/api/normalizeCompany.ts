import * as Sentry from '@sentry/react';

import type { Company, CompanyDto } from '../model/types';

/**
 * Normalize a raw company DTO into the trusted internal `Company` type.
 *
 * The Tracer spec generates every field as optional, but `id`/`name`/`shortName`
 * are the entity's identity and are required in practice. When one arrives missing
 * that's contract drift, not a normal falsy case — report it so it's visible in
 * Sentry instead of silently absorbed, then fall back so the UI stays usable.
 */
export function normalizeCompany(dto: CompanyDto): Company {
  const missing: string[] = [];
  if (dto.id == null) missing.push('id');
  if (dto.name == null) missing.push('name');
  if (dto.shortName == null) missing.push('shortName');

  if (missing.length > 0) {
    Sentry.captureMessage(
      `Company required field(s) missing from API response: ${missing.join(', ')}`,
      {
        level: 'warning',
        extra: { companyId: dto.id, missing },
      },
    );
  }

  return {
    ...dto,
    id: dto.id ?? -1,
    name: dto.name ?? '',
    shortName: dto.shortName ?? '',
    active: dto.active ?? false,
  };
}
