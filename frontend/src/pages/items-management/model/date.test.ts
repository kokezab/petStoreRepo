import { describe, expect, it } from 'vitest';

import { fromDatePickerValue, toDatePickerValue } from './date';

describe('toDatePickerValue', () => {
  it('parses YYYY-MM-DD text', () => {
    expect(toDatePickerValue('2026-11-02')?.format('YYYY-MM-DD')).toBe('2026-11-02');
  });

  it('returns undefined for empty, malformed or impossible values', () => {
    expect(toDatePickerValue(undefined)).toBeUndefined();
    expect(toDatePickerValue('')).toBeUndefined();
    expect(toDatePickerValue('2026-1-2')).toBeUndefined();
    expect(toDatePickerValue('2026-02-30')).toBeUndefined();
  });
});

describe('fromDatePickerValue', () => {
  it('formats the picked date as YYYY-MM-DD', () => {
    expect(fromDatePickerValue(toDatePickerValue('2026-11-02'))).toBe('2026-11-02');
  });

  it('returns undefined when the picker is cleared', () => {
    expect(fromDatePickerValue(null)).toBeUndefined();
  });
});
