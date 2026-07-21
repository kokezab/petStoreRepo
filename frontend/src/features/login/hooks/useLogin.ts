import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';

import { getLoginUserQueryOptions } from '@/api/generated/user/user';
import { useApiError } from '@/hooks/useApiError';

import type { LoginFormValues } from '../LoginPage';

/**
 * Owns everything it means to log in: running the login request as a
 * mutation (the generated client only exposes it as a query, since it's a
 * GET endpoint), navigating on success, and exposing a renderable error
 * message. Errors stay local via `skipGlobalErrorToast` because the caller
 * shows `error` inline.
 */
export function useLogin() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const {
    mutateAsync,
    isPending,
    error: mutationError,
    reset,
  } = useMutation({
    mutationFn: (values: LoginFormValues) =>
      queryClient.fetchQuery(
        getLoginUserQueryOptions(values, { query: { meta: { skipGlobalErrorToast: true } } }),
      ),
    meta: { skipGlobalErrorToast: true },
  });
  const { message: error } = useApiError(mutationError, 'Invalid username or password');
  const login = async (values: LoginFormValues) => {
    reset();
    await mutateAsync(values);
    navigate('/pets');
  };

  return { login, isPending, error };
}
