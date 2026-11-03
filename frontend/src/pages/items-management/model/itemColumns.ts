import type { TableColumnsType } from 'antd';
import type { ReactNode } from 'react';

import type { FieldDefinitionResponseType } from '@/shared/api/generated/zerocode/models/fieldDefinitionResponseType';

import { isoToLocalDateTimeDisplay } from './dateTime';
import type { ItemDefinition } from './types';

export interface CustomFieldColumn {
  fieldKey: string;
  label: string;
  type: FieldDefinitionResponseType;
}

// React renders nothing for a boolean, so BOOLEAN values need explicit text.
function renderCustomValue(type: FieldDefinitionResponseType, value: unknown) {
  if (type === 'BOOLEAN' && typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  if (type === 'DATETIME') {
    return isoToLocalDateTimeDisplay(value) as ReactNode;
  }
  return value as ReactNode;
}

// Name and Description are fixed item properties; every custom field gets its
// own column, read from the item's `customValues` by field key.
export function buildItemColumns(
  customFields: CustomFieldColumn[],
): TableColumnsType<ItemDefinition> {
  return [
    { key: 'name', title: 'Name', dataIndex: 'name' },
    { key: 'description', title: 'Description', dataIndex: 'description' },
    ...customFields.map((field) => ({
      key: field.fieldKey,
      title: field.label,
      dataIndex: ['customValues', field.fieldKey],
      render: (value: unknown) => renderCustomValue(field.type, value),
    })),
  ];
}
