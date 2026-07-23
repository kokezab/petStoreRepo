import type { FindPetsByStatusParams } from '@/api/generated/models';
import {
  getFindPetsByStatusQueryKey,
  useAddPet as useAddPetGenerated,
  useFindPetsByStatus as useFindPetsByStatusGenerated,
  useGetPetById as useGetPetByIdGenerated,
} from '@/api/generated/pet/pet';

import { normalizePet } from './normalizePet';

export { getFindPetsByStatusQueryKey };

export function useFindPetsByStatus(params: FindPetsByStatusParams) {
  return useFindPetsByStatusGenerated(params, {
    query: { select: (pets) => pets.map(normalizePet) },
  });
}

export function useGetPetById(
  petId: number,
  options?: Parameters<typeof useGetPetByIdGenerated>[1],
) {
  return useGetPetByIdGenerated(petId, {
    ...options,
    query: { ...options?.query, select: normalizePet },
  });
}

export const useAddPet = useAddPetGenerated;
