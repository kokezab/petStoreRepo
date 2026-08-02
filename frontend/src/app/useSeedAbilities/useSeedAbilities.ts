import { useEffect } from 'react';

import type { Country } from '@/entities/country';
import { useAbilityStore } from '@/shared/lib/rbac';

function isEntityActive<T extends { active: boolean }>(record: unknown) {
  return !!(record as T).active;
}

/**
 * Stand-in for fetching the current user's abilities from your auth/`/me`
 * endpoint and seeding them into the RBAC store on mount.
 *
 * The seed object is typed against the ability catalog (see shared/lib/rbac/
 * abilities.ts): keys are checked as `action:subject` pairs, so 'move:Equipment'
 * compiles but 'move:Company' or a typo won't.
 */
export function useSeedAbilities() {
  const setRules = useAbilityStore((s) => s.setRules);

  useEffect(() => {
    // TODO: seed rules from your auth/`/me` endpoint
    setRules({
      'create:Country': true,
      'update:Country': true,
      // example: RBAC itself can depend on the record too. The store passes records
      // in untyped (record?: unknown), so narrow to the shape this rule cares about.
      'delete:Country': (record) => (record as Country | undefined)?.status !== 'done',

      'create:Equipment': true,
      'update:Equipment': true,
      'delete:Equipment': isEntityActive,
      'move:Equipment': isEntityActive,

      'create:Company': true,
      'update:Company': true,
      'delete:Company': true,
    });
  }, [setRules]);
}
