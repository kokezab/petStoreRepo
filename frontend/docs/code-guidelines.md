# Code guidelines

Code-style preferences that aren't (yet) enforced by a linter rule. These are
about *how we write* individual modules — for *where code lives* (layers,
slices, segments, public APIs), see the architecture section of
[`CLAUDE.md`](../CLAUDE.md).

- [Abstraction & duplication](#abstraction--duplication)
- [Function definitions](#function-definitions)
- [Interfaces and types](#interfaces-and-types)
- [Imports and aliases](#imports-and-aliases)
- [TODO & FIXME comments](#todo--fixme-comments)

## Abstraction & duplication

- **Keep code close to where it's used.** This is the same instinct as the
  "pages first" rule in [`CLAUDE.md`](../CLAUDE.md) — don't hoist something
  into a shared slice until it's genuinely shared.
- **WET before DRY.** Let a pattern repeat about three times before you
  abstract it. The third occurrence is usually when the *real* shape of the
  abstraction becomes clear; abstracting at the first or second is guessing,
  and the guess is expensive to undo.
- **A little duplication is cheaper than the wrong abstraction.** Duplication
  is local and trivial to delete. A premature abstraction couples every caller
  to a guess, and every future need that doesn't fit gets bolted on as a flag
  or an option until the "shared" helper is harder to read than the copies
  would have been.
- When you *do* promote shared code, promote it **down** a layer (to
  `entities/` or `shared/`) — never sideways to a sibling slice. See the
  layering rules in [`CLAUDE.md`](../CLAUDE.md).

## Function definitions

- At the **module root**, prefer a `function` declaration over an arrow
  function assigned to a `const`. Declarations hoist, read more clearly, and
  always show a name in stack traces. This applies to components too.
- **Inside** a function/component body, prefer arrow functions (handlers,
  callbacks) — unless you actually need `this`.
- Always give functions a name. A named function is worth it the first time
  you read a Sentry stack trace.

```tsx
// Avoid — arrow function at the module root
const ProductCard = (props: ProductCardProps) => { /* ... */ }

// Prefer — function declaration at the root
function ProductCard(props: ProductCardProps) {
  // Arrow functions inside the body are fine — we're already in a function
  const handleAddToCart = () => {
    addToCart(props.product.id)
  }

  return <Button onClick={handleAddToCart}>{props.product.name}</Button>
}
```

```ts
// Avoid — anonymous callback, shows up as "<anonymous>" in traces
products.filter(p => !p.archived).map(p => p.id)

// Fine for trivial one-liners, but name it when the body is non-trivial
// or when it's a top-level utility:
function isActive(product: Product) {
  return !product.archived
}
```

## Interfaces and types

- When describing an **object shape**, or **extending/combining** other object
  shapes, prefer `interface`.
- Use `type` for **unions**, **aliases**, and **mapped/utility** types — things
  `interface` can't express.
- **Don't** prefix interface names with `I`. Use the plain domain name.

```ts
// Bad
interface IProduct { /* ... */ }

// Good — object shape
interface Product {
  id: string
  name: string
  photos: string[]
}

// Good — extending is what interfaces are for
interface FeaturedProduct extends Product {
  featuredUntil: string
}

// Good — type for a union; interface can't do this
type ProductStatus = 'draft' | 'active' | 'archived'
```

> Note: our normalized internal models (`Product`) are `interface`s; the raw
> generated DTOs (`ProductDto`) come from Orval. Keep the boundary between them
> as described in the API section of [`CLAUDE.md`](../CLAUDE.md).

## Imports and aliases

- **Order:** external libraries first (alphabetical by package name), then
  local imports (alphabetical). Roughly: the "further away" an import lives, the
  higher it appears.
- Use the **`@/` alias** for anything under `src/` instead of deep relative
  paths (`../../../`). `@/*` maps to `./src/*`.
- An import must **never end in `..`** (importing from an unnamed parent
  `index`) — it hides what you're actually pulling in and invites circular
  dependencies. Import the specific module.
- Reminder (from the architecture rules): only a slice's `index.ts` is public.
  Don't reach into another slice's internals, and don't import sideways on the
  same layer.

```ts
// Avoid
import { Button } from '../../../../shared/ui'
import { normalizeProduct } from '..'

// Prefer
import { Table } from 'antd'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/shared/ui'
import { normalizeProduct } from '@/entities/product'
```

## TODO & FIXME comments

Use `TODO` / `FIXME` for code that is temporary, a short-term solution, or
good-enough-but-not-perfect. Left unlinked, TODOs rot silently in the codebase.

Every TODO/FIXME **must** include the tag in caps, a ticket reference, and a
short description of what needs doing. The ticket carries the real context so
the comment can stay terse and greppable.

```ts
// bad — no ticket, will be ignored forever
// TODO: handle the empty state here

// bad — a sentence, not searchable
// We should handle the empty state here eventually

// good
// TODO(PET-290): render the empty state once the design is finalized
```
