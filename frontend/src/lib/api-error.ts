import { isAxiosError } from 'axios';

import type { ApiResponse } from '@/api/generated/models';

export function getApiErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  if (isAxiosError<ApiResponse>(error)) {
    return error.response?.data?.message ?? fallback;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

export function getApiErrorStatus(error: unknown): number | undefined {
  return isAxiosError(error) ? error.response?.status : undefined;
}

// Errors a component can render around (404, 400 validation, etc.) should
// stay local via useApiError. Only network failures and server errors are
// unrecoverable enough to escalate to an Error Boundary via throwOnError.
export function isBoundaryWorthyError(error: unknown): boolean {
  if (!isAxiosError(error)) return false;
  const status = error.response?.status;
  return status === undefined || status >= 500;
}
