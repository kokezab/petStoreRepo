import type { CodebookPermissions, PermissionResult } from '../../core/types';
import type { Widget } from './types';

interface Deps {
  can: (action: string, subject: string, record?: unknown) => boolean;
}

// Status-lock helper: demonstrates a status-locked permission for this fixture — a `done`
// record is RBAC-visible but disabled, with an i18n reason for the tooltip.
function statusLocked(can: boolean, record: Widget): PermissionResult {
  if (!can) return { visible: false, enabled: false };
  if (record.status === 'done') {
    return { visible: true, enabled: false, reason: 'codebook.lockedField' };
  }
  return { visible: true, enabled: true };
}

// Lazy functions (resolved at point-of-use), matching entities/company/model/permissions.ts.
export function buildWidgetPermissions({ can }: Deps): CodebookPermissions<Widget> {
  return {
    create: () => can('create', 'Widget'),
    update: (r) => statusLocked(can('update', 'Widget', r), r),
    delete: (r) => statusLocked(can('delete', 'Widget', r), r),
  };
}
