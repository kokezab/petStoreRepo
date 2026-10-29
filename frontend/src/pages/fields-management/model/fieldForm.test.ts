import { buildConstraints } from './fieldForm';

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
