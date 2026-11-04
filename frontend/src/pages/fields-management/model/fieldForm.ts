import dayjs, { type Dayjs } from 'dayjs';

import type { FieldDefinition, FieldType } from './types';

export interface FieldFormValues {
  label: string;
  type: FieldType;
  required?: boolean;
  maxLength?: number | null;
  min?: number | null;
  max?: number | null;
  /** Earliest allowed value for DATE / DATETIME fields. */
  minDate?: Dayjs | null;
  /** Latest allowed value for DATE / DATETIME fields. */
  maxDate?: Dayjs | null;
}

/** Wire format the backend parses: LocalDate for DATE, OffsetDateTime for DATETIME. */
const DATE_WIRE_FORMAT = 'YYYY-MM-DD';

function isDateType(type: FieldType): type is 'DATE' | 'DATETIME' {
  return type === 'DATE' || type === 'DATETIME';
}

function parseDate(value: unknown): Dayjs | null {
  if (typeof value !== 'string') return null;
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed : null;
}

function formatDate(type: 'DATE' | 'DATETIME', value: Dayjs): string {
  // dayjs#format() with no pattern yields an ISO-8601 offset date-time
  // (e.g. 2026-10-23T14:30:00+02:00), which is what OffsetDateTime expects.
  return type === 'DATE' ? value.format(DATE_WIRE_FORMAT) : value.format();
}

export function toFormValues(field: FieldDefinition): FieldFormValues {
  const { constraints } = field;
  if (isDateType(field.type)) {
    return {
      label: field.label,
      type: field.type,
      required: field.required,
      minDate: parseDate(constraints.min),
      maxDate: parseDate(constraints.max),
    };
  }
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
  if (isDateType(values.type)) {
    if (values.minDate) constraints.min = formatDate(values.type, values.minDate);
    if (values.maxDate) constraints.max = formatDate(values.type, values.maxDate);
  }
  return constraints;
}
