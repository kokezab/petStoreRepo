import type { ReactNode } from 'react';

import { getApiErrorMessage } from '@/lib/api-error';

interface QueryStateProps<T> {
  isLoading: boolean;
  error: unknown;
  data: T | undefined;
  /** Accessible label for the loading indicator, e.g. "Loading pets". */
  loadingLabel: string;
  /** Shown when the query errors and the error carries no server message. */
  errorFallback: string;
  /** Optional predicate for an empty result; when true, renders emptyMessage. */
  isEmpty?: (data: T) => boolean;
  emptyMessage?: string;
  children: (data: T) => ReactNode;
}

/**
 * The loading -> error -> empty -> content ladder that every data-backed page
 * repeats. Concentrating it here keeps the branches (and their a11y roles)
 * consistent, and guarantees `children` only ever sees defined data.
 *
 * Only locally-renderable errors reach here: 5xx/network failures are thrown to
 * the nearest RouteErrorBoundary via the query client's `throwOnError` (see
 * main.tsx). The message prefers the server's, falling back to `errorFallback`.
 */
export function QueryState<T>({
  isLoading,
  error,
  data,
  loadingLabel,
  errorFallback,
  isEmpty,
  emptyMessage,
  children,
}: QueryStateProps<T>) {
  if (isLoading) {
    return (
      <p role='status' aria-label={loadingLabel}>
        {loadingLabel}…
      </p>
    );
  }

  if (error) {
    return <p role='alert'>{getApiErrorMessage(error, errorFallback)}</p>;
  }

  if (data === undefined) {
    return <p role='alert'>{errorFallback}</p>;
  }

  if (isEmpty?.(data) && emptyMessage) {
    return <p>{emptyMessage}</p>;
  }

  return <>{children(data)}</>;
}
