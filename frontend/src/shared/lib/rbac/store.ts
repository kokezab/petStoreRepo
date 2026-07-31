import { create } from 'zustand';

type Rule = boolean | ((record?: unknown) => boolean);

interface AbilityState {
  rules: Record<string, Rule>;
  /** Call once after auth resolves (e.g. from a /me response) to populate rules */
  setRules: (rules: Record<string, Rule>) => void;
  can: (action: string, subject: string, record?: unknown) => boolean;
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
    const rule = get().rules[`${action}:${subject}`];
    if (typeof rule === 'function') return rule(record);
    return !!rule;
  },
}));
