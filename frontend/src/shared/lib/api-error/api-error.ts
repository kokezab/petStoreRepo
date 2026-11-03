import { isAxiosError } from 'axios';

import type { ApiResponse } from '@/shared/api/generated/models';

// The petstore backend returns ApiResponse ({ message }); the Zero-Code backend
// returns Spring ProblemDetail ({ detail }, plus { errors } on validation failures).
interface ApiErrorBody extends ApiResponse {
  detail?: string;
  errors?: unknown;
}

export function getApiErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  if (isAxiosError<ApiErrorBody>(error)) {
    const data = error.response?.data;
    if (data?.errors) return JSON.stringify(data.errors);
    return data?.detail ?? data?.message ?? fallback;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

// Per-field messages from a ProblemDetail `errors` map ({ fieldKey: message }),
// or undefined when the error carries none.
export function getApiFieldErrors(error: unknown): Record<string, string> | undefined {
  if (!isAxiosError<ApiErrorBody>(error)) return undefined;
  const errors = error.response?.data?.errors;
  if (!errors || typeof errors !== 'object' || Array.isArray(errors)) return undefined;
  const entries = Object.entries(errors).filter(
    (entry): entry is [string, string] => typeof entry[1] === 'string',
  );
  return entries.length ? Object.fromEntries(entries) : undefined;
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
