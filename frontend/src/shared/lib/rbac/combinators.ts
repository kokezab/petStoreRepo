/** Combine several (record) => boolean checks — true only if ALL pass. */
export const all =
  <T>(...checks: Array<(record: T) => boolean>) =>
  (record: T) =>
    checks.every((check) => check(record));

/** Combine several (record) => boolean checks — true if ANY passes. */
export const any =
  <T>(...checks: Array<(record: T) => boolean>) =>
  (record: T) =>
    checks.some((check) => check(record));
