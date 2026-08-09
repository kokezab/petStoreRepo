import { List } from 'antd';

import type { Pet } from '@/entities/pet';
import { useLocalization } from '@/shared/lib/i18n';

import { PetListItem } from '../PetListItem/PetListItem';

interface PetListProps {
  data: Pet[];
  noDataMessage?: string;
  isLoading: boolean;
}

export function PetList({ data, noDataMessage = 'No data', isLoading }: PetListProps) {
  const { t } = useLocalization();
  return (
    <div role='list' aria-label={t('petList.listLabel')}>
      <List
        loading={{ spinning: isLoading, description: 'Loading pets...' }}
        dataSource={data}
        renderItem={(pet) => <PetListItem key={pet.id} pet={pet} />}
        locale={{ emptyText: noDataMessage }}
      />
    </div>
  );
}
