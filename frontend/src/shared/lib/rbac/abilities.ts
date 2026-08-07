/**
 * Central catalog of RBAC abilities: each subject mapped to the actions valid on
 * it. This is the single source of truth for which `action:subject` pairs exist.
 * `Ability` (and the `can`/`setRules` signatures) are derived from it, so a typo
 * or a nonsense pair fails to compile:
 *
 *   'move:Equipment'  ✅  (Equipment lists 'move')
 *   'move:Company'    ❌  (Company doesn't) — compile error
 *   'create:Widget'   ❌  (Widget isn't a subject) — compile error
 *
 * Lives in shared/ (not per-entity) because shared/ can't import from entities/
 * under FSD, yet the RBAC store's types need to know the whole catalog at once.
 * It only names subjects as string literals — no entity type imports — so there's
 * no layering violation. When you add a subject/action, add it here.
 */
export interface AbilityMap {
  Country: 'create' | 'update' | 'delete';
  Equipment: 'create' | 'update' | 'delete' | 'move';
  Company: 'create' | 'update' | 'delete';
}

export type Subject = keyof AbilityMap;

/** The actions valid for a given subject, e.g. `ActionFor<'Equipment'>` includes 'move'. */
export type ActionFor<S extends Subject> = AbilityMap[S];

/**
 * All valid `action:subject` keys. Built by distributing over each subject so
 * actions never leak across subjects — 'move:Equipment' is in the union,
 * 'move:Company' is not.
 */
export type Ability = { [S in Subject]: `${AbilityMap[S]}:${S}` }[Subject];

/**
 * The RBAC check. Generic over the subject so the action is constrained to that
 * subject's valid actions — `can('move', 'Company')` is a compile error.
 */
export type Can = <S extends Subject>(
  action: ActionFor<S>,
  subject: S,
  record?: unknown,
) => boolean;
