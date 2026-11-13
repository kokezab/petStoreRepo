import dayjs, { type Dayjs } from 'dayjs';

// DATE values are stored and sent as "YYYY-MM-DD" text. The form keeps that
// text too; only the DatePicker works with Dayjs, so convert at its edges.
export const DATE_FORMAT = 'YYYY-MM-DD';

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

// "YYYY-MM-DD" text to the picker's value. Anything else shows as empty.
export function toDatePickerValue(value: unknown): Dayjs | undefined {
  if (typeof value !== 'string') return undefined;
  const match = DATE_PATTERN.exec(value.trim());
  if (!match) return undefined;
  const [, year, month, day] = match;
  const date = dayjs(new Date(Number(year), Number(month) - 1, Number(day)));
  // Reject overflowing dates such as "2026-02-30" instead of rolling them over.
  return date.format(DATE_FORMAT) === value.trim() ? date : undefined;
}

// The picker's value to "YYYY-MM-DD" text. Cleared becomes undefined.
export function fromDatePickerValue(value: Dayjs | null | undefined): string | undefined {
  return value ? value.format(DATE_FORMAT) : undefined;
}
