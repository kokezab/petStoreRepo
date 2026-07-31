import type { PermissionResult } from '@/shared/ui/codebook-page';

/**
 * Factory tying `field` and `lockedValues` to a specific entity type T, so
 * TypeScript rejects field names that don't exist on T and values that don't
 * match that field's type.
 *
 * Usage (per entity, once):
 *   const fieldLock = createFieldLock<Country>();
 *   update: fieldLock((r) => can('update', 'Country', r), 'status', ['done'], 'countries.permissions.cannotEditDone')
 */
export function createFieldLock<T>() {
  return function withFieldLock<K extends keyof T>(
    check: (record: T) => boolean,
    field: K,
    lockedValues: readonly T[K][],
    reason?: string,
  ) {
    return (record: T): PermissionResult => {
      const visible = check(record); // RBAC: can they see this action at all
      const isLocked = lockedValues.includes(record[field]); // business rule: is it allowed right now
      return {
        visible,
        enabled: visible && !isLocked,
        reason: isLocked ? (reason ?? 'codebook.lockedField') : undefined,
      };
    };
  };
}
