import { useShallow } from 'zustand/react/shallow';

import { useAbilityStore } from './store';

export function usePermissions() {
  // Select `can` (a stable store method) AND `rules` together via useShallow.
  // - `rules` is included so consumers re-render when abilities are (re)seeded
  //   — e.g. after auth resolves and setRules() runs. `can` reads the latest
  //   rules at call time, but subscribing to `can` alone never re-renders on a
  //   rule change, leaving any permission computed eagerly on first render
  //   (when rules are still empty) permanently stale.
  // - useShallow does a shallow-equality check, so this doesn't infinite-loop
  //   the way returning a fresh object from a plain selector would under
  //   zustand v5's useSyncExternalStore ("getSnapshot should be cached").
  const { can } = useAbilityStore(useShallow((s) => ({ can: s.can, rules: s.rules })));
  return { can };
}
