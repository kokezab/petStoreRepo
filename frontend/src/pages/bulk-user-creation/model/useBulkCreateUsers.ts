import type { User } from '@/api/generated/models';
import { useCreateUsersWithArrayInput } from '@/api/generated/user/user';
import { useApiError } from '@/hooks/useApiError';

export function useBulkCreateUsers() {
  const {
    mutateAsync,
    isPending,
    error: mutationError,
    reset,
  } = useCreateUsersWithArrayInput({
    mutation: { meta: { skipGlobalErrorToast: true } },
  });
  const { message: error } = useApiError(mutationError, 'Error creating users');

  const createUsers = async (users: User[]) => {
    reset();
    await mutateAsync({ data: users });
  };

  return { createUsers, isPending, error };
}
