import { List } from 'antd';

import type { Pet } from '@/api/generated/models';

import { PetListItem } from '../PetListItem/PetListItem';

interface PetListProps {
  data: Pet[];
  noDataMessage?: string;
}

export function PetList({ data, noDataMessage = 'No data' }: PetListProps) {
  return (
    <div role='list' aria-label='Pets'>
      <List
        dataSource={data}
        renderItem={(pet) => <PetListItem key={pet.id} pet={pet} />}
        locale={{ emptyText: noDataMessage }}
      />
    </div>
  );
}
