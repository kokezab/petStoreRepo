import type { User } from '@/shared/api/generated/models';
import { useCreateUsersWithArrayInput } from '@/shared/api/generated/user/user';
import { useApiError } from '@/shared/lib/api-error';

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
