import { useQueryClient } from '@tanstack/react-query';

import { getFindPetsByStatusQueryKey, useAddPet } from '@/api/generated/pet/pet';
import { useApiError } from '@/hooks/useApiError';

import type { AddPetFormValues } from '../components/AddPetForm/AddPetForm';

/**
 * Owns everything it means to create a Pet: mapping form values to the Pet
 * payload, running the mutation, invalidating the list cache, and exposing a
 * renderable error message. Callers (the modal today, potentially other entry
 * points) just invoke `createPet` and render `error`/`isPending`.
 *
 * Errors stay local: `skipGlobalErrorToast` opts this mutation out of the app's
 * global error toast (see handleGlobalError in main.tsx) because the caller
 * shows `error` inline. `createPet` rejects on failure so a caller can `await`
 * it to decide whether to close the surrounding UI.
 */
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
