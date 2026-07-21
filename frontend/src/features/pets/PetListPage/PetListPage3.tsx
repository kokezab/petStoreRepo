import { useState } from 'react';

import { PetList } from '../components';
import { Alert, Select } from 'antd';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

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

type PetStatus = 'available' | 'pending' | 'sold';

type Pet = {
  id: number;
  name: string;
  photoUrls: string[];
  status: PetStatus;
};

export function PetListPage() {
  const [status, setStatus] = useState<PetStatus>('available');
  const { data, isLoading, isError } = useQuery({
    queryKey: ['pets', status],
    queryFn: async () => {
      const response = await axios.get<Pet[]>(
        `https://petstore.swagger.io/v2/pet/findByStatus?status=${status}`,
      );
      return response.data;
    },
  });

  if (isLoading) return <p>Loading pets...</p>;
  if (isError) return <Alert type='error' title='Failed to load pets.' />;

  return (
    <div>
      <Select<PetStatus>
        value={status}
        onChange={(value) => setStatus(value)}
        options={statusOptions}
      />
      <PetList data={data || []} noDataMessage='No pets found' />
    </div>
  );
}
