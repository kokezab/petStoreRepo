import type { GetInventory200 } from '@/api/generated/models';

// A plain status -> count map; the spec has no required/optional fields to
// drift on here (it's an index signature), so this is just a domain-facing
// alias rather than a normalization boundary.
export type Inventory = GetInventory200;
