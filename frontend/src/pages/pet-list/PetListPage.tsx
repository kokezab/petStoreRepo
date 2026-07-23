import { QueryState } from '@/components/QueryState/QueryState';
import { useFindPetsByStatus } from '@/entities/pet';
import { usePetsFilterStore } from '@/stores/usePetsFilterStore';

import { AddPetButton, AddPetModal, PetList, PetsStatusFilter } from './ui';

export function PetListPage() {
  const status = usePetsFilterStore((state) => state.status);
  const { data, isLoading, error } = useFindPetsByStatus({ status: [status] });

  return (
    <div>
      <PetsStatusFilter />

      <QueryState
        isLoading={isLoading}
        error={error}
        data={data}
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
