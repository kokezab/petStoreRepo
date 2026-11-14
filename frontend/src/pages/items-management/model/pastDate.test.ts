import dayjs from 'dayjs';
import { describe, expect, it } from 'vitest';

import type { ItemField } from './itemField';
import { findPastDates } from './pastDate';

const dueDate = { fieldKey: 'due_date', label: 'Due date', type: 'DATE' } as ItemField;
const other = { fieldKey: 'shipped_on', label: 'Shipped on', type: 'DATE' } as ItemField;
const today = dayjs(new Date(2026, 10, 13, 12));

describe('findPastDates', () => {
  it('returns the due date when it is before today', () => {
    expect(findPastDates({ due_date: '2026-11-12' }, [dueDate], today)).toEqual([
      { label: 'Due date', date: '2026-11-12' },
    ]);
  });

  it('ignores today, future and missing due dates', () => {
    expect(findPastDates({ due_date: '2026-11-13' }, [dueDate], today)).toEqual([]);
    expect(findPastDates({ due_date: '2026-12-01' }, [dueDate], today)).toEqual([]);
    expect(findPastDates({}, [dueDate], today)).toEqual([]);
  });

  it('ignores past dates in fields that are not checked', () => {
    expect(findPastDates({ shipped_on: '2026-01-01' }, [other], today)).toEqual([]);
  });

  it('ignores the due date when the field is not active', () => {
    expect(findPastDates({ due_date: '2026-01-01' }, [], today)).toEqual([]);
  });
});
