import { describe, expect, it } from 'vitest';

import { fromTimePickerValue, toTimePickerValue } from './time';

describe('toTimePickerValue', () => {
  it('parses HH:mm:ss text', () => {
    expect(toTimePickerValue('09:30:15')?.format('HH:mm:ss')).toBe('09:30:15');
  });

  it('parses HH:mm text with zero seconds', () => {
    expect(toTimePickerValue('17:05')?.format('HH:mm:ss')).toBe('17:05:00');
  });

  it('returns undefined for empty or malformed values', () => {
    expect(toTimePickerValue(undefined)).toBeUndefined();
    expect(toTimePickerValue('')).toBeUndefined();
    expect(toTimePickerValue('9:30')).toBeUndefined();
  });
});

describe('fromTimePickerValue', () => {
  it('formats the picked time as HH:mm:ss', () => {
    expect(fromTimePickerValue(toTimePickerValue('09:30:00'))).toBe('09:30:00');
  });

  it('returns undefined when the picker is cleared', () => {
    expect(fromTimePickerValue(null)).toBeUndefined();
  });
});
