import type { Can } from '@/shared/lib/rbac';
import type { CodebookPermissions } from '@/shared/ui/codebook-page';

import type { Company } from './types';

interface Deps {
  can: Can;
}

/**
 * Company has no `draft/active/done` lifecycle to field-lock on (unlike
 * equipment/country), so permissions are plain RBAC: has the ability or not.
 *
 * Each is lazy (a function) rather than eager. Evaluating eagerly here would
 * freeze the result at CompaniesPage's first render — before RBAC rules are
 * seeded — leaving the action permanently false. As a function it's resolved at
 * point-of-use (Root.resolvePermissions, re-run whenever Root re-renders) against
 * the live, seeded rules.
 */
export function buildCompanyPermissions({ can }: Deps): CodebookPermissions<Company> {
  return {
    create: () => can('create', 'Company'),
    update: (r) => can('update', 'Company', r),
    delete: (r) => can('delete', 'Company', r),
  };
}
