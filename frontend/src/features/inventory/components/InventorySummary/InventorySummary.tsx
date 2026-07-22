import { Card, Col, Flex, Row, Statistic } from 'antd';

import type { GetInventory200, PetStatus } from '@/api/generated/models';
import { PetStatusTag } from '@/features/pets/components/PetStatusTag/PetStatusTag';

import { sortByStatus } from '../../utils';

export function InventorySummary({ inventory }: { inventory: GetInventory200 }) {
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
              <Statistic title={<PetStatusTag status={status as PetStatus} />} value={count} />
            </Card>
          </Col>
        ))}
      </Row>
    </Flex>
  );
}
