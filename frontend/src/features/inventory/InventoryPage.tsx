import { Card, Col, Flex, Row, Statistic, Typography } from 'antd';

import type { GetInventory200 } from '@/api/generated/models';
import { useGetInventory } from '@/api/generated/store/store';
import { QueryState } from '@/components/QueryState/QueryState';

const { Title, Paragraph } = Typography;

/**
 * Colours mirror the pet status tags so a status reads the same everywhere.
 * Statuses the API returns that we have no explicit colour for fall back to the
 * theme's default value colour.
 */
const STATUS_COLORS: Record<string, string> = {
  available: '#52c41a',
  pending: '#faad14',
  sold: '#f5222d',
};

/** Known statuses come first, in a sensible order; anything else follows. */
const STATUS_ORDER = ['available', 'pending', 'sold'];

function sortByStatus([a]: [string, number], [b]: [string, number]) {
  const ai = STATUS_ORDER.indexOf(a);
  const bi = STATUS_ORDER.indexOf(b);
  if (ai === -1 && bi === -1) return a.localeCompare(b);
  if (ai === -1) return 1;
  if (bi === -1) return -1;
  return ai - bi;
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function InventorySummary({ inventory }: { inventory: GetInventory200 }) {
  const entries = Object.entries(inventory).sort(sortByStatus);
  const total = entries.reduce((sum, [, count]) => sum + count, 0);

  return (
    <Flex vertical gap='large'>
      <Card>
        <Statistic title='Total pets' value={total} />
      </Card>

      <Row gutter={[16, 16]}>
        {entries.map(([status, count]) => (
          <Col key={status} xs={24} sm={12} md={8}>
            <Card variant='outlined'>
              <Statistic
                title={capitalize(status)}
                value={count}
                valueStyle={{ color: STATUS_COLORS[status] }}
              />
            </Card>
          </Col>
        ))}
      </Row>
    </Flex>
  );
}

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
