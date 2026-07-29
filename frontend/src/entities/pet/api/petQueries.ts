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

type UseGetPetByIdOptions = NonNullable<Parameters<typeof useGetPetByIdGenerated>[1]>;

// `select` is owned here (it applies normalizePet) - exclude it from the
// caller-facing options so a caller-supplied `select` is a compile error rather
// than something silently overwritten below.
export function useGetPetById(
  petId: number,
  options?: Omit<UseGetPetByIdOptions, 'query'> & {
    query?: Omit<NonNullable<UseGetPetByIdOptions['query']>, 'select'>;
  },
) {
  return useGetPetByIdGenerated(petId, {
    ...options,
    query: { ...options?.query, select: normalizePet },
  });
}

export const useAddPet = useAddPetGenerated;
