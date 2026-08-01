import * as Sentry from '@sentry/react';

import type { Equipment, EquipmentDto } from '../model/types';

/**
 * Normalize a raw equipment DTO into the trusted internal `Equipment` type.
 *
 * The Tracer spec generates every field as optional, but `id`/`name`/`code` are
 * the entity's identity and are required in practice. When one arrives missing
 * that's contract drift, not a normal falsy case — report it so it's visible in
 * Sentry instead of silently absorbed, then fall back so the UI stays usable.
 */
export function normalizeEquipment(dto: EquipmentDto): Equipment {
  const missing: string[] = [];
  if (dto.id == null) missing.push('id');
  if (dto.name == null) missing.push('name');
  if (dto.code == null) missing.push('code');

  if (missing.length > 0) {
    Sentry.captureMessage(
      `Equipment required field(s) missing from API response: ${missing.join(', ')}`,
      {
        level: 'warning',
        extra: { equipmentId: dto.id, missing },
      },
    );
  }

  return {
    ...dto,
    id: dto.id ?? -1,
    name: dto.name ?? '',
    code: dto.code ?? 0,
  };
}
