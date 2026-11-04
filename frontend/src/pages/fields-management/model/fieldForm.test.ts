import dayjs from 'dayjs';

import { buildConstraints, toFormValues } from './fieldForm';

describe('buildConstraints', () => {
  it('keeps only maxLength for TEXT fields', () => {
    expect(buildConstraints({ label: 'Color', type: 'TEXT', maxLength: 40, min: 1 })).toEqual({
      maxLength: 40,
    });
  });

  it('keeps min and max for NUMBER fields', () => {
    expect(
      buildConstraints({ label: 'Qty', type: 'NUMBER', min: 0, max: 10, maxLength: 5 }),
    ).toEqual({ min: 0, max: 10 });
  });

  it('drops empty constraint inputs', () => {
    expect(buildConstraints({ label: 'Qty', type: 'NUMBER', min: null })).toEqual({});
  });
});

describe('date constraints', () => {
  it('serialises DATE bounds as yyyy-MM-dd', () => {
    expect(
      buildConstraints({
        label: 'Born',
        type: 'DATE',
        minDate: dayjs('2026-01-01T15:00:00'),
        maxDate: dayjs('2026-12-31'),
        min: 3,
      }),
    ).toEqual({ min: '2026-01-01', max: '2026-12-31' });
  });

  it('serialises DATETIME bounds as ISO offset date-times', () => {
    const constraints = buildConstraints({
      label: 'Delivered at',
      type: 'DATETIME',
      minDate: dayjs('2026-10-23T14:30:00'),
    });
    expect(constraints.max).toBeUndefined();
    expect(constraints.min).toMatch(/^2026-10-23T14:30:00[+-]\d{2}:\d{2}$/);
  });

  it('ignores date inputs for non-date types', () => {
    expect(buildConstraints({ label: 'Qty', type: 'NUMBER', minDate: dayjs() })).toEqual({});
  });

  it('round-trips stored date bounds into picker values', () => {
    const values = toFormValues({
      id: '1',
      fieldKey: 'born',
      label: 'Born',
      type: 'DATE',
      required: false,
      constraints: { min: '2026-01-01' },
      displayOrder: 0,
    });
    expect(values.minDate?.format('YYYY-MM-DD')).toBe('2026-01-01');
    expect(values.maxDate).toBeNull();
    expect(buildConstraints(values)).toEqual({ min: '2026-01-01' });
  });
});
