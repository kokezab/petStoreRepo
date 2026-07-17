import type { Pet } from '@/api/generated/models';
import { List } from 'antd';
import { PetListItem } from '../PetListItem/PetListItem';

interface PetListProps {
  data: Pet[];
  noDataMessage?: string;
  isLoading: boolean;
}

export function PetList({ data, noDataMessage = 'No data', isLoading }: PetListProps) {
  return (
    <div role='list' aria-label='Pets'>
      <List
        loading={{ spinning: isLoading, description: 'Loading pets...' }}
        dataSource={data}
        renderItem={(pet) => <PetListItem key={pet.id} pet={pet} />}
        locale={{ emptyText: noDataMessage }}
      />
    </div>
  );
}
