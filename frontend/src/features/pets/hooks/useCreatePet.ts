import { useQueryClient } from '@tanstack/react-query';

import { getFindPetsByStatusQueryKey, useAddPet } from '@/api/generated/pet/pet';
import { useApiError } from '@/hooks/useApiError';

import type { AddPetFormValues } from '../components/AddPetForm/AddPetForm';

export function useCreatePet() {
  const {
    mutateAsync,
    isPending,
    error: mutationError,
    reset,
  } = useAddPet({
    mutation: { meta: { skipGlobalErrorToast: true } },
  });
  const queryClient = useQueryClient();
  const { message: error } = useApiError(mutationError, 'Error adding pet');

  const createPet = async (values: AddPetFormValues) => {
    reset();
    await mutateAsync({
      data: {
        photoUrls: [],
        name: values.name,
        category: { name: values.category },
        status: values.status,
      },
    });
    // Blunt-but-correct: refetch every status query so the new pet appears
    // whichever filter is active.
    await queryClient.invalidateQueries({ queryKey: getFindPetsByStatusQueryKey() });
  };

  return { createPet, isPending, error };
}
