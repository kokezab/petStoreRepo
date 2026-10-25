import * as Sentry from '@sentry/react';

import type { FieldDefinitionResponse } from '@/api/generated/zerocode/models/fieldDefinitionResponse';

import type { FieldDefinition } from '../model/types';

function reportMissing(field: keyof FieldDefinitionResponse, dto: FieldDefinitionResponse) {
  Sentry.captureMessage(`FieldDefinition.${field} missing from API response`, {
    level: 'warning',
    extra: { fieldId: dto.id },
  });
}

export function normalizeField(dto: FieldDefinitionResponse): FieldDefinition {
  // The backend always assigns these; a missing one is contract drift, not a
  // normal falsy case — report it instead of silently absorbing it.
  if (!dto.id) reportMissing('id', dto);
  if (!dto.label) reportMissing('label', dto);
  if (!dto.type) reportMissing('type', dto);

  return {
    id: dto.id ?? '',
    fieldKey: dto.fieldKey ?? '',
    label: dto.label ?? '',
    type: dto.type ?? 'TEXT',
    required: dto.required ?? false,
    displayOrder: dto.displayOrder ?? Number.MAX_SAFE_INTEGER,
    createdAt: dto.createdAt,
  };
}
