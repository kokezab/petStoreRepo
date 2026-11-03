import { zerocodeRequest } from '@/shared/api';
import {
  getGetFieldsQueryKey,
  useGetFields,
} from '@/shared/api/generated/zerocode/field-definition-controller/field-definition-controller';
import type { FieldDefinitionResponse } from '@/shared/api/generated/zerocode/models/fieldDefinitionResponse';

import type { ItemField, ItemFieldConstraints } from '../model/itemField';

export const itemFieldKeys = {
  all: getGetFieldsQueryKey,
};

// Constraints arrive as an open JSON map; keep only the numeric ones the form
// knows how to enforce.
function normalizeConstraints(raw: Record<string, unknown> | undefined): ItemFieldConstraints {
  const pick = (key: string) => (typeof raw?.[key] === 'number' ? (raw[key] as number) : undefined);
  return { maxLength: pick('maxLength'), min: pick('min'), max: pick('max') };
}

function normalizeItemField(dto: FieldDefinitionResponse): ItemField {
  return {
    fieldKey: dto.fieldKey ?? '',
    label: dto.label ?? '',
    type: dto.type ?? 'TEXT',
    required: dto.required ?? false,
    constraints: normalizeConstraints(dto.constraints),
    displayOrder: dto.displayOrder ?? 0,
  };
}

// The custom fields shown as item columns and form inputs, in display order.
export function useItemFields() {
  return useGetFields({
    request: zerocodeRequest,
    query: {
      select: (dtos) =>
        dtos.map(normalizeItemField).sort((a, b) => a.displayOrder - b.displayOrder),
    },
  });
}
