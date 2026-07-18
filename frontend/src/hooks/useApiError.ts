import { useMemo } from 'react';

import { getApiErrorMessage, getApiErrorStatus } from '@/lib/api-error';

export function useApiError(error: unknown, fallback?: string) {
  return useMemo(
    () => ({
      isError: error != null,
      message: error != null ? getApiErrorMessage(error, fallback) : null,
      status: getApiErrorStatus(error),
    }),
    [error, fallback],
  );
}
