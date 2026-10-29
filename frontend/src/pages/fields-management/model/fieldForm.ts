import type { FieldDefinition, FieldType } from './types';

export interface FieldFormValues {
  label: string;
  type: FieldType;
  required?: boolean;
  maxLength?: number | null;
  min?: number | null;
  max?: number | null;
}

export function toFormValues(field: FieldDefinition): FieldFormValues {
  const { constraints } = field;
  return {
    label: field.label,
    type: field.type,
    required: field.required,
    maxLength: (constraints.maxLength as number) ?? null,
    min: (constraints.min as number) ?? null,
    max: (constraints.max as number) ?? null,
  };
}

export function buildConstraints(values: FieldFormValues): Record<string, unknown> {
  const constraints: Record<string, unknown> = {};
  if (values.type === 'TEXT' && values.maxLength != null) {
    constraints.maxLength = values.maxLength;
  }
  if (values.type === 'NUMBER') {
    if (values.min != null) constraints.min = values.min;
    if (values.max != null) constraints.max = values.max;
  }
  return constraints;
}
