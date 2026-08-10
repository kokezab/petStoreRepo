import { Space } from 'antd';

import { QueryState } from '@/components/QueryState/QueryState';

import { useVisiblePets } from './model/useVisiblePets';
import { AddPetButton, AddPetModal, PetCategoryFilter, PetList, PetsStatusFilter } from './ui';

export function PetListPage() {
  const { visiblePets, isLoading, error } = useVisiblePets();

  return (
    <div>
      <Space orientation='vertical'>
        <PetsStatusFilter />
        <PetCategoryFilter />
      </Space>

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
