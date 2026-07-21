import { useEffect, useState } from 'react';

import { PetList } from '../components';
import { Alert, Select } from 'antd';
import axios from 'axios';

type PetStatus = 'available' | 'pending' | 'sold';

type Pet = {
  id: number;
  name: string;
  photoUrls: string[];
  status: PetStatus;
};

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
  const [status, setStatus] = useState<PetStatus>('available');
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [data, setData] = useState<Pet[] | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setIsError(false);

    axios
      .get<Pet[]>(`https://petstore.swagger.io/v2/pet/findByStatus?status=${status}`)
      .then((response) => {
        setIsLoading(false);
        setIsError(false);
        setData(response.data);
      })
      .catch((error) => {
        setIsLoading(false);
        setIsError(true);
        setData(null);
      });
  }, [status]);

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
