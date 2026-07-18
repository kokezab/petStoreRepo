import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';

import { showErrorMessage } from '@/lib/antd-message-bridge';
import { getApiErrorMessage, isBoundaryWorthyError } from '@/lib/api-error';

// Queries/mutations opt out with `meta: { skipGlobalErrorToast: true }` when
// they already render their own inline error state (see useApiError).
function handleGlobalError(error: unknown, meta: Record<string, unknown> | undefined) {
  if (meta?.skipGlobalErrorToast) return;
  // Query errors severe enough to be re-thrown into an Error Boundary (see
  // queries.throwOnError below) already get a fallback UI - toasting too is redundant.
  if (isBoundaryWorthyError(error)) return;
  showErrorMessage(getApiErrorMessage(error));
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // One quick retry keeps some resilience to transient network blips for real
      // users, without react-query's default 3-attempt exponential backoff (up to
      // ~7s) leaving the UI on a stale/loading state far longer than a failure
      // warrants.
      retry: 1,
      retryDelay: 300,
      // Network failures and 5xx responses can't be rendered around locally -
      // escalate them to the nearest Error Boundary (see RouteErrorBoundary).
      // 4xx business errors (404, validation, etc.) stay local via useApiError.
      throwOnError: (error) => isBoundaryWorthyError(error),
    },
  },
  queryCache: new QueryCache({
    onError: (error, query) => handleGlobalError(error, query.meta),
  }),
  mutationCache: new MutationCache({
    onError: (error, _variables, _context, mutation) => handleGlobalError(error, mutation.meta),
  }),
});
