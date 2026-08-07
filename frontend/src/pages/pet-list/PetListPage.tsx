import { QueryState } from '@/components/QueryState/QueryState';

import { useVisiblePets } from './model/useVisiblePets';
import { AddPetButton, AddPetModal, PetCategoryFilter, PetList, PetsStatusFilter } from './ui';

export function PetListPage() {
  const { visiblePets, isLoading, error } = useVisiblePets();

  return (
    <div>
      <div className='mb-4 flex flex-col items-start gap-2'>
        <PetsStatusFilter />
        <PetCategoryFilter />
      </div>

      <QueryState
        isLoading={isLoading}
        error={error}
        data={visiblePets}
        loadingLabel='Loading pets'
        errorFallback='Failed to load pets.'
      >
        {(pets) => <PetList data={pets} noDataMessage='No pets found' isLoading={false} />}
      </QueryState>
      <AddPetButton />
      <AddPetModal />
    </div>
  );
}
