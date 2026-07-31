import { createFieldLock } from '@/shared/lib/rbac';
import type { CodebookPermissions } from '@/shared/ui/codebook-page';

import type { Country } from './types';

const fieldLock = createFieldLock<Country>();

interface Deps {
  can: (action: string, subject: string, record?: unknown) => boolean;
}

/**
 * update/delete = has RBAC permission AND status isn't 'done'.
 * fieldLock resolves that into { visible, enabled, reason } automatically:
 *  - no RBAC permission            -> visible: false (button doesn't render)
 *  - has permission, status done   -> visible: true, enabled: false, with a tooltip reason
 *  - has permission, status !done  -> visible: true, enabled: true
 */
export function buildCountryPermissions({ can }: Deps): CodebookPermissions<Country> {
  return {
    // Lazy, like update/delete below. Evaluating eagerly here would freeze the
    // result at the moment buildCountryPermissions runs — which is CountriesPage's
    // first render, before RBAC rules are seeded — leaving "create" permanently
    // false. As a function it's resolved at point-of-use (Root.resolvePermissions,
    // re-run whenever Root re-renders, e.g. when the list query settles) against
    // the live, seeded rules.
    create: () => can('create', 'Country'),
    update: fieldLock(
      (r) => can('update', 'Country', r),
      'status',
      ['done'],
      'countries.permissions.cannotEditDone',
    ),
    delete: fieldLock(
      (r) => can('delete', 'Country', r),
      'status',
      ['done'],
      'countries.permissions.cannotDeleteDone',
    ),
  };
}
