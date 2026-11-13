import { describe, expect, it } from 'vitest';

import { fromDateTimePickerValue, toDateTimePickerValue } from './dateTime';

describe('toDateTimePickerValue', () => {
  it('parses yyyy-MM-dd HH:mm:ss text', () => {
    expect(fromDateTimePickerValue(toDateTimePickerValue('2026-11-02 09:30:15'))).toBe(
      '2026-11-02 09:30:15',
    );
  });

  it('defaults missing seconds to zero', () => {
    expect(fromDateTimePickerValue(toDateTimePickerValue('2026-11-02 09:30'))).toBe(
      '2026-11-02 09:30:00',
    );
  });

  it('returns undefined for empty, malformed or impossible values', () => {
    expect(toDateTimePickerValue(undefined)).toBeUndefined();
    expect(toDateTimePickerValue('')).toBeUndefined();
    expect(toDateTimePickerValue('2026-11-02T09:30:00')).toBeUndefined();
    expect(toDateTimePickerValue('2026-02-30 10:00')).toBeUndefined();
    expect(toDateTimePickerValue('2026-11-02 25:00')).toBeUndefined();
  });
});

describe('fromDateTimePickerValue', () => {
  it('returns undefined when the picker is cleared', () => {
    expect(fromDateTimePickerValue(null)).toBeUndefined();
  });
});
