import { describe, expect, it } from 'vitest';

import { createWidgetStore } from './store';
import type { Widget } from './types';

const rows: Widget[] = [
  { id: 1, name: 'Alpha', category: 'gadget', quantity: 2, active: true, status: 'active' },
  { id: 2, name: 'Beta', category: 'gizmo', quantity: 5, active: false, status: 'done' },
];

describe('createWidgetStore', () => {
  it('lists clones, not references', () => {
    const store = createWidgetStore(rows);
    const a = store.list();
    a[0].name = 'mutated';
    expect(store.list()[0].name).toBe('Alpha');
  });

  it('creates with a fresh incrementing id', () => {
    const store = createWidgetStore(rows);
    const created = store.create({
      name: 'Gamma',
      category: 'doohickey',
      quantity: 1,
      active: true,
    });
    expect(created.id).toBe(3);
    expect(store.list()).toHaveLength(3);
  });

  it('updates by id', () => {
    const store = createWidgetStore(rows);
    store.update(1, { quantity: 99 });
    expect(store.list().find((w) => w.id === 1)?.quantity).toBe(99);
  });

  it('removes by id', () => {
    const store = createWidgetStore(rows);
    store.remove(1);
    expect(store.list().map((w) => w.id)).toEqual([2]);
  });
});
