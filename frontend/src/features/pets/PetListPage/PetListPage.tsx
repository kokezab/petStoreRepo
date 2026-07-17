import { useState } from 'react';

import type { FindPetsByStatusStatusItem } from '@/api/generated/models';
import { useFindPetsByStatus } from '@/api/generated/pet/pet';

import { AddPetButton, AddPetModal, PetList } from '../components';

const STATUS_OPTIONS: FindPetsByStatusStatusItem[] = ['available', 'pending', 'sold'];

export function PetListPage() {
  const [status, setStatus] = useState<FindPetsByStatusStatusItem>('available');
  const { data, isLoading, error } = useFindPetsByStatus({ status: [status] });

  return (
    <div>
      <label>
        Status filter
        <select
          aria-label='Status filter'
          value={status}
          onChange={(event) => setStatus(event.target.value as FindPetsByStatusStatusItem)}
        >
          {STATUS_OPTIONS.map((option) => (
            <option value={option} key={option}>
              {option}
            </option>
          ))}
        </select>
      </label>

      {isLoading ? (
        <p role='status' aria-label='Loading pets'>
          Loading pets…
        </p>
      ) : null}
      {error ? <p role='alert'>Failed to load pets.</p> : null}
      {!isLoading && !error && (
        <PetList data={data ?? []} noDataMessage='No pets found' isLoading={isLoading} />
      )}
      <AddPetButton />
      <AddPetModal />
    </div>
  );
}
