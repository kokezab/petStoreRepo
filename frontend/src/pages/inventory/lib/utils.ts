import { STATUS_ORDER } from './constants';

/**
 * Orders inventory `[status, count]` entries by {@link STATUS_ORDER}, with any
 * unknown statuses appended alphabetically after the known ones.
 */
export function sortByStatus([a]: [string, number], [b]: [string, number]) {
  const ai = STATUS_ORDER.indexOf(a);
  const bi = STATUS_ORDER.indexOf(b);
  if (ai === -1 && bi === -1) return a.localeCompare(b);
  if (ai === -1) return 1;
  if (bi === -1) return -1;
  return ai - bi;
}
