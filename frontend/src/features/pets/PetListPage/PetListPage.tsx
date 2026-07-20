import { useState } from 'react';

import type { FindPetsByStatusStatusItem } from '@/api/generated/models';
import { useFindPetsByStatus } from '@/api/generated/pet/pet';

import { PetList } from '../components';
import { Alert, Select } from 'antd';

const statusOptions = [
  {
    value: 'available',
    label: 'available',
  },
  {
    value: 'pending',
    label: 'pending',
  },
  {
    value: 'sold',
    label: 'sold',
  },
];

export function PetListPage() {
  const [status, setStatus] = useState<FindPetsByStatusStatusItem>('available');
  useState<FindPetsByStatusStatusItem>('available');
  useState<FindPetsByStatusStatusItem>('available');
  useState<FindPetsByStatusStatusItem>('available');
  const { data, isLoading, isError } = useFindPetsByStatus({ status: [status] });

  if (isLoading) return <p>Loading pets...</p>;
  if (isError) return <Alert type='error' title='Failed to load pets.' />;

  return (
    <div>
      <Select<FindPetsByStatusStatusItem>
        value={status}
        onChange={(value) => setStatus(value)}
        options={statusOptions}
      />
      <PetList data={data || []} noDataMessage='No pets found' />
    </div>
  );
}
