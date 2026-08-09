import { describe, expect, it } from 'vitest';

import { buildEquipmentPermissions } from './permissions';
import type { Equipment } from './types';

function rec(over: Partial<Equipment> = {}): Equipment {
  return {
    id: 1,
    name: 'Router',
    code: 100,
    active: true,
    ...over,
  };
}

describe('buildEquipmentPermissions — move', () => {
  it('is hidden when RBAC denies move', () => {
    const perms = buildEquipmentPermissions({ can: () => false });
    expect(perms.move(rec())).toEqual({ visible: false, enabled: false, reason: undefined });
  });

  it('is visible and enabled when permitted and active', () => {
    const perms = buildEquipmentPermissions({ can: (action) => action === 'move' });
    expect(perms.move(rec({ active: true }))).toEqual({
      visible: true,
      enabled: true,
      reason: undefined,
    });
  });

  it('is visible but locked (with a reason) when the record is inactive/done', () => {
    const perms = buildEquipmentPermissions({ can: (action) => action === 'move' });
    expect(perms.move(rec({ active: false }))).toEqual({
      visible: true,
      enabled: false,
      reason: 'equipment.permissions.cannotMoveDone',
    });
  });

  it('scopes the RBAC check to the "move" action on "Equipment"', () => {
    const calls: Array<[string, string]> = [];
    const perms = buildEquipmentPermissions({
      can: (action, subject) => {
        calls.push([action, subject]);
        return true;
      },
    });
    perms.move(rec());
    expect(calls).toContainEqual(['move', 'Equipment']);
  });
});
