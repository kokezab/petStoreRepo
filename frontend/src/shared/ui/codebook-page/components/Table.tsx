import { Table as AntTable } from 'antd';
import type { ColumnsType } from 'antd/es/table';

import { useCodebookContext } from '../core/context';

interface TableProps<T> {
  columns: ColumnsType<T>;
  actionsColumn?: ColumnsType<T>[number];
}

export function Table<T extends object>({ columns, actionsColumn }: TableProps<T>) {
  const { data, isLoading, rowKey, pagination, onTableChange } = useCodebookContext<T>();

  return (
    <AntTable<T>
      rowKey={rowKey as string}
      loading={isLoading}
      dataSource={data}
      columns={actionsColumn ? [...columns, actionsColumn] : columns}
      pagination={pagination}
      onChange={onTableChange}
    />
  );
}
