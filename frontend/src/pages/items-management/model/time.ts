import dayjs, { type Dayjs } from 'dayjs';

// TIME values are stored and sent as "HH:mm:ss" text. The form keeps that
// text too; only the TimePicker works with Dayjs, so convert at its edges.
export const TIME_FORMAT = 'HH:mm:ss';

const TIME_PATTERN = /^(\d{2}):(\d{2})(?::(\d{2}))?$/;

// "HH:mm[:ss]" text to the picker's value. Anything else shows as empty.
export function toTimePickerValue(value: unknown): Dayjs | undefined {
  if (typeof value !== 'string') return undefined;
  const match = TIME_PATTERN.exec(value.trim());
  if (!match) return undefined;
  const [, hours, minutes, seconds = '0'] = match;
  return dayjs().startOf('day').hour(Number(hours)).minute(Number(minutes)).second(Number(seconds));
}

// The picker's value to "HH:mm:ss" text. Cleared becomes undefined.
export function fromTimePickerValue(value: Dayjs | null | undefined): string | undefined {
  return value ? value.format(TIME_FORMAT) : undefined;
}
