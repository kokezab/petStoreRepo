import { create } from 'zustand';

import type { Ability, Can } from './abilities';

type Rule = boolean | ((record?: unknown) => boolean);

interface AbilityState {
  /** Keyed by `action:subject` — only the pairs the catalog declares (see abilities.ts). */
  rules: Partial<Record<Ability, Rule>>;
  /** Call once after auth resolves (e.g. from a /me response) to populate rules */
  setRules: (rules: Partial<Record<Ability, Rule>>) => void;
  can: Can;
}

/**
 * Minimal ability store. Swap the internals for a real CASL Ability instance
 * if you use CASL — keep the `can(action, subject, record)` signature the
 * same so entities/*\/model/permissions.ts files don't need to change.
 */
export const useAbilityStore = create<AbilityState>((set, get) => ({
  rules: {},
  setRules: (rules) => set({ rules }),
  can: (action, subject, record) => {
    // `action`/`subject` are a valid pair by construction (Can's generic), so the
    // composed key is a real Ability — TS just can't narrow the template itself.
    const rule = get().rules[`${action}:${subject}` as Ability];
    if (typeof rule === 'function') return rule(record);
    return !!rule;
  },
}));
