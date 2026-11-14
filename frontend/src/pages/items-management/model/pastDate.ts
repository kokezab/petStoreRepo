import dayjs, { type Dayjs } from 'dayjs';

import { DATE_FORMAT } from './date';
import type { ItemField } from './itemField';

// DATE fields whose value should not be in the past. Saving one with a past
// date is allowed, but the user is warned right after the save.
export const PAST_DATE_FIELD_KEYS: readonly string[] = ['due_date'];

export interface PastDate {
  label: string;
  date: string;
}

// The checked DATE fields of a just-saved item whose value is before today.
// Values are "YYYY-MM-DD" text, so they compare correctly as strings.
export function findPastDates(
  customValues: Record<string, unknown>,
  fields: ItemField[],
  today: Dayjs = dayjs(),
): PastDate[] {
  const todayText = today.format(DATE_FORMAT);
  return fields
    .filter((field) => field.type === 'DATE' && PAST_DATE_FIELD_KEYS.includes(field.fieldKey))
    .flatMap((field) => {
      const value = customValues[field.fieldKey];
      return typeof value === 'string' && value < todayText
        ? [{ label: field.label, date: value }]
        : [];
    });
}
