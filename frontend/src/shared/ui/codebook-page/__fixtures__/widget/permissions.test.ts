import { describe, expect, it } from 'vitest';

import { buildWidgetPermissions } from './permissions';
import type { Widget } from './types';

const active: Widget = {
  id: 1,
  name: 'A',
  category: 'gadget',
  quantity: 1,
  active: true,
  status: 'active',
};
const done: Widget = { ...active, id: 2, status: 'done' };

const allow = () => true;

describe('buildWidgetPermissions', () => {
  it('locks update/delete for done records with a reason', () => {
    const p = buildWidgetPermissions({ can: allow });
    const upd = p.update as (r: Widget) => { visible: boolean; enabled: boolean; reason?: string };
    expect(upd(active).enabled).toBe(true);
    expect(upd(done).enabled).toBe(false);
    expect(upd(done).reason).toBe('codebook.lockedField');
  });

  it('respects the injected can() for create', () => {
    const denied = buildWidgetPermissions({ can: () => false });
    const create = denied.create as () => boolean;
    expect(create()).toBe(false);
  });
});
