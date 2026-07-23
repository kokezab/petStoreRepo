import * as Sentry from '@sentry/react';

import type { Pet as PetDto } from '@/api/generated/models';

import type { Pet } from '../model/types';

export function normalizePet(dto: PetDto): Pet {
  if (!dto.photoUrls) {
    // Spec marks `photoUrls` required — server sent undefined. This is
    // contract drift, not a normal falsy case; report it so it's visible
    // instead of silently absorbed.
    Sentry.captureMessage('Pet.photoUrls missing from API response', {
      level: 'warning',
      extra: { petId: dto.id },
    });
  }

  return { ...dto, photoUrls: dto.photoUrls ?? [] };
}
