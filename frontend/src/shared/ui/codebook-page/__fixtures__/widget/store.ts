import type { WidgetFormValues } from './schema';
import type { Widget } from './types';

export interface WidgetStore {
  list: () => Widget[];
  create: (data: WidgetFormValues) => Widget;
  update: (id: number, data: Partial<Widget>) => Widget;
  remove: (id: number) => void;
}

function clone(w: Widget): Widget {
  return { ...w };
}

export function createWidgetStore(initial: Widget[]): WidgetStore {
  let rows = initial.map(clone);
  let nextId = rows.reduce((max, w) => Math.max(max, w.id), 0) + 1;

  return {
    list: () => rows.map(clone),
    create: (data) => {
      const created: Widget = { ...data, id: nextId++, status: 'active' };
      rows = [...rows, created];
      return clone(created);
    },
    update: (id, data) => {
      rows = rows.map((w) => (w.id === id ? { ...w, ...data } : w));
      const found = rows.find((w) => w.id === id);
      if (!found) throw new Error(`Widget ${id} not found`);
      return clone(found);
    },
    remove: (id) => {
      rows = rows.filter((w) => w.id !== id);
    },
  };
}

const CATEGORIES: Widget['category'][] = ['gadget', 'gizmo', 'doohickey'];

export const seedWidgets: Widget[] = Array.from({ length: 12 }, (_, i) => ({
  id: i + 1,
  name: `Widget ${String(i + 1).padStart(2, '0')}`,
  category: CATEGORIES[i % 3],
  quantity: (i * 3) % 11,
  active: i % 2 === 0,
  status: i === 1 ? 'done' : 'active', // one locked row for the permission story
}));
