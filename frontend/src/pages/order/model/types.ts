// Orders has no read path: the only server interaction is placing an order
// (a mutation whose response is not rendered - see useCreateOrder/OrdersPage),
// and every field on the generated `Order` is optional in the spec, so there is
// no required-field contract drift to guard. These are therefore intentional
// domain-facing aliases rather than a normalization boundary. If a screen ever
// starts rendering fetched order data, introduce a `normalizeOrder` in the
// slice's `api/` segment (mirroring `entities/pet/api/normalizePet`) first.
export type { Order, OrderStatus } from '@/api/generated/models';
