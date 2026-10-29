import * as Sentry from '@sentry/react';

import type { FieldDefinitionResponse } from '@/shared/api/generated/zerocode/models/fieldDefinitionResponse';

import type { FieldDefinition } from '../model/types';

export function normalizeFieldDefinition(dto: FieldDefinitionResponse): FieldDefinition {
  const missing = (['id', 'fieldKey', 'label', 'type'] as const).filter((key) => dto[key] == null);
  if (missing.length > 0) {
    // The backend always sets these, but the spec doesn't mark them required
    // (missing @Schema annotations), so a gap here is contract drift - report it
    // instead of silently rendering an empty row.
    Sentry.captureMessage('FieldDefinition core fields missing from API response', {
      level: 'warning',
      extra: { fieldDefinitionId: dto.id, missing },
    });
  }

  return {
    id: dto.id ?? '',
    fieldKey: dto.fieldKey ?? '',
    label: dto.label ?? '',
    type: dto.type ?? 'TEXT',
    required: dto.required ?? false,
    constraints: dto.constraints ?? {},
    displayOrder: dto.displayOrder ?? 0,
    createdAt: dto.createdAt,
  };
}
