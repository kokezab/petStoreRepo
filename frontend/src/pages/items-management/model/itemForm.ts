import { isoToLocalDateTimeInput, localDateTimeToIso } from './dateTime';
import type { ItemField } from './itemField';
import type { ItemDefinition } from './types';

export interface ItemFormValues {
  name: string;
  description?: string;
  customValues?: Record<string, unknown>;
}

export interface ItemRequestBody {
  name: string;
  description?: string;
  customValues: Record<string, unknown>;
}

// Only active fields get form values: values left behind by deleted fields
// stay out of the form, so they are never sent back.
export function toFormValues(item: ItemDefinition, fields: ItemField[]): ItemFormValues {
  const stored = (item.customValues ?? {}) as Record<string, unknown>;
  const customValues: Record<string, unknown> = {};
  for (const field of fields) {
    if (!(field.fieldKey in stored)) continue;
    const value = stored[field.fieldKey];
    customValues[field.fieldKey] =
      field.type === 'DATETIME' ? isoToLocalDateTimeInput(value) : value;
  }
  return { name: item.name, description: item.description, customValues };
}

function isEmpty(value: unknown): boolean {
  return value == null || (typeof value === 'string' && value.trim() === '');
}

// The request body for create/update: active fields only, empty values
// dropped, DATETIME text converted to an ISO offset date-time.
export function toRequestBody(values: ItemFormValues, fields: ItemField[]): ItemRequestBody {
  const input = values.customValues ?? {};
  const customValues: Record<string, unknown> = {};
  for (const field of fields) {
    const value = input[field.fieldKey];
    if (isEmpty(value)) continue;
    customValues[field.fieldKey] =
      field.type === 'DATETIME' && typeof value === 'string'
        ? (localDateTimeToIso(value) ?? value)
        : value;
  }
  return {
    name: values.name,
    description: isEmpty(values.description) ? undefined : values.description,
    customValues,
  };
}
