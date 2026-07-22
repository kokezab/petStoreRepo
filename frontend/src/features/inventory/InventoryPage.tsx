import { Flex, Typography } from 'antd';

import { useGetInventory } from '@/api/generated/store/store';
import { QueryState } from '@/components/QueryState/QueryState';

import { InventorySummary } from './components/InventorySummary/InventorySummary';

const { Title, Paragraph } = Typography;

export function InventoryPage() {
  const { data: inventory, isLoading, error } = useGetInventory();

  return (
    <Flex vertical gap='middle'>
      <div>
        <Title level={2} style={{ marginBottom: 0 }}>
          Inventory
        </Title>
        <Paragraph type='secondary' style={{ marginBottom: 0 }}>
          Current pet counts grouped by status.
        </Paragraph>
      </div>

      <QueryState
        isLoading={isLoading}
        error={error}
        data={inventory}
        loadingLabel='Loading inventory'
        errorFallback='Failed to load inventory.'
        isEmpty={(data) => Object.keys(data).length === 0}
        emptyMessage='No inventory data available.'
      >
        {(inventory) => <InventorySummary inventory={inventory} />}
      </QueryState>
    </Flex>
  );
}
