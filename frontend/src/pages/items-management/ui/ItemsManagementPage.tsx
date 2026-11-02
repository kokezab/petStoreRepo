import { useMemo } from 'react';

import { Table } from 'antd';

import { useItemDefinitions } from '../api/itemDefinitionQueries';
import { useItemFields } from '../api/itemFieldQueries';
import { buildItemColumns } from '../model/itemColumns';

export function ItemsManagementPage() {
  const { data: items } = useItemDefinitions();
  const { data: fields } = useItemFields();

  const columns = useMemo(() => buildItemColumns(fields ?? []), [fields]);

  return <Table rowKey='id' dataSource={items} columns={columns} />;
}
