import { useFindPetsByStatus } from '@/entities/pet';
import { FEATURE_FLAGS, useFeatureFlag } from '@/lib/feature-flags';

import { usePetsFilter } from './usePetsFilter';

export function useVisiblePets() {
  const { status, category } = usePetsFilter();
  const isCategoryFilterEnabled = useFeatureFlag(FEATURE_FLAGS.petCategoryFilter);
  const { data, isLoading, error } = useFindPetsByStatus({ status: [status] });

  const visiblePets =
    isCategoryFilterEnabled && category
      ? data?.filter((pet) => pet.category?.name === category)
      : data;

  return { visiblePets, isLoading, error };
}
