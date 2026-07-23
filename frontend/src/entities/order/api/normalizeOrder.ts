import type { Order as OrderDto } from '@/api/generated/models';

import type { Order } from '../model/types';

// Every Order field is optional per the spec today, so there's no required-field
// drift to guard against yet — this still exists so consumers never import the
// raw generated DTO directly (see CLAUDE.md API boundary rule).
export function normalizeOrder(dto: OrderDto): Order {
  return dto;
}
