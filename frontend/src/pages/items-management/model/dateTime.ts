import dayjs, { type Dayjs } from 'dayjs';

// DATETIME values are typed as local "yyyy-MM-dd HH:mm[:ss]" text and stored
// by the backend as ISO-8601 offset date-times.
export const LOCAL_DATETIME_PATTERN = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})(?::(\d{2}))?$/;

const pad = (value: number) => String(value).padStart(2, '0');

function formatOffset(date: Date): string {
  const minutes = -date.getTimezoneOffset();
  const sign = minutes >= 0 ? '+' : '-';
  const abs = Math.abs(minutes);
  return `${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`;
}

function formatLocal(date: Date, withSeconds: boolean): string {
  const day = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  const time = `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  return withSeconds ? `${day} ${time}:${pad(date.getSeconds())}` : `${day} ${time}`;
}

// "2026-11-02 09:30:00" → "2026-11-02T09:30:00+01:00"; undefined if malformed.
export function localDateTimeToIso(text: string): string | undefined {
  const match = LOCAL_DATETIME_PATTERN.exec(text.trim());
  if (!match) return undefined;
  const [, y, mo, d, h, mi, s = '00'] = match;
  const date = new Date(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi), Number(s));
  if (Number.isNaN(date.getTime())) return undefined;
  return `${y}-${mo}-${d}T${h}:${mi}:${s}${formatOffset(date)}`;
}

function parseIso(iso: unknown): Date | undefined {
  if (typeof iso !== 'string') return undefined;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

// ISO offset date-time → local "yyyy-MM-dd HH:mm:ss", for the form input.
export function isoToLocalDateTimeInput(iso: unknown): unknown {
  const date = parseIso(iso);
  return date ? formatLocal(date, true) : iso;
}

// ISO offset date-time → local "yyyy-MM-dd HH:mm", for the list.
export function isoToLocalDateTimeDisplay(iso: unknown): unknown {
  const date = parseIso(iso);
  return date ? formatLocal(date, false) : iso;
}

// The form holds DATETIME as "yyyy-MM-dd HH:mm:ss" text; only the DatePicker
// (with showTime) works with Dayjs, so convert at its edges.
export const DATETIME_FORMAT = 'YYYY-MM-DD HH:mm:ss';

// Local "yyyy-MM-dd HH:mm[:ss]" text to the picker's value. Anything else,
// including impossible dates such as "2026-02-30 10:00", shows as empty.
export function toDateTimePickerValue(value: unknown): Dayjs | undefined {
  if (typeof value !== 'string') return undefined;
  const match = LOCAL_DATETIME_PATTERN.exec(value.trim());
  if (!match) return undefined;
  const [, y, mo, d, h, mi, s = '00'] = match;
  const date = dayjs(
    new Date(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi), Number(s)),
  );
  return date.format(DATETIME_FORMAT) === `${y}-${mo}-${d} ${h}:${mi}:${s}` ? date : undefined;
}

// The picker's value to "yyyy-MM-dd HH:mm:ss" text. Cleared becomes undefined.
export function fromDateTimePickerValue(value: Dayjs | null | undefined): string | undefined {
  return value ? value.format(DATETIME_FORMAT) : undefined;
}
