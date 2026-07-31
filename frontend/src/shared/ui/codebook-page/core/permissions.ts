import type { CodebookPermissions, PermissionResult, ResolvedPermissions } from './types';

function toResult(value: boolean | PermissionResult): PermissionResult {
  return typeof value === 'boolean' ? { visible: value, enabled: value } : value;
}

function normalize<T>(value: CodebookPermissions<T>['update'], record: T): PermissionResult {
  if (value === undefined) return { visible: true, enabled: true };
  if (typeof value === 'boolean') return toResult(value);
  return toResult(value(record) as boolean | PermissionResult);
}

function normalizeCreate<T>(value: CodebookPermissions<T>['create']): PermissionResult {
  if (value === undefined) return { visible: true, enabled: true };
  if (typeof value === 'boolean') return toResult(value);
  return toResult(value() as boolean | PermissionResult);
}

/**
 * Turns whatever shorthand the caller used (plain boolean, (record) => boolean,
 * or (record) => PermissionResult) into a uniform, always-callable shape the
 * codebook UI components can consume without caring which shorthand was used.
 */
export function resolvePermissions<T>(perms?: CodebookPermissions<T>): ResolvedPermissions<T> {
  return {
    canCreate: normalizeCreate(perms?.create),
    canUpdate: (record) => normalize(perms?.update, record),
    canDelete: (record) => normalize(perms?.delete, record),
    canView: (record) => normalize(perms?.view, record),
  };
}
