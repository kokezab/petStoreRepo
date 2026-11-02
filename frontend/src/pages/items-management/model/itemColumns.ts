import type { TableColumnsType } from 'antd';

import type { ItemDefinition } from './types';

export interface CustomFieldColumn {
  fieldKey: string;
  label: string;
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
    })),
  ];
}
