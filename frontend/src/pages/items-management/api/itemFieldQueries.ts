import { zerocodeRequest } from '@/shared/api';
import {
  getGetFieldsQueryKey,
  useGetFields,
} from '@/shared/api/generated/zerocode/field-definition-controller/field-definition-controller';
import type { FieldDefinitionResponse } from '@/shared/api/generated/zerocode/models/fieldDefinitionResponse';

import type { CustomFieldColumn } from '../model/itemColumns';

export const itemFieldKeys = {
  all: getGetFieldsQueryKey,
};

function normalizeItemField(
  dto: FieldDefinitionResponse,
): CustomFieldColumn & { displayOrder: number } {
  return {
    fieldKey: dto.fieldKey ?? '',
    label: dto.label ?? '',
    displayOrder: dto.displayOrder ?? 0,
  };
}

// The custom fields shown as item columns, in display order.
export function useItemFields() {
  return useGetFields({
    request: zerocodeRequest,
    query: {
      select: (dtos) =>
        dtos.map(normalizeItemField).sort((a, b) => a.displayOrder - b.displayOrder),
    },
  });
}
