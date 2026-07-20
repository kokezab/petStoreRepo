import { useState } from 'react';

import type { FindPetsByStatusStatusItem } from '@/api/generated/models';
import { useFindPetsByStatus } from '@/api/generated/pet/pet';
import { QueryState } from '@/components/QueryState/QueryState';

import { AddPetButton, AddPetModal, PetList } from '../components';
import { PetsStatusFilter } from '../components/PetsStatusFilter';
import { usePetsFilterStore } from '@/stores/usePetsFilterStore';

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
