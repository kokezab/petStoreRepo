import type { TableProps as AntTableProps } from 'antd';
import { Table as AntTable } from 'antd';
import type { ColumnsType } from 'antd/es/table';

import { useCodebookContext } from '../core/context';

type OwnedProps = 'rowKey' | 'dataSource' | 'columns' | 'pagination' | 'onChange' | 'loading';

interface TableProps<T> extends Omit<AntTableProps<T>, OwnedProps> {
  columns: ColumnsType<T>;
  actionsColumn?: ColumnsType<T>[number];
}

export function Table<T extends object>({ columns, actionsColumn, ...rest }: TableProps<T>) {
  const { data, isFetching, rowKey, pagination, onTableChange } = useCodebookContext<T>();

  return (
    <AntTable<T>
      {...rest}
      rowKey={rowKey as string}
      loading={isFetching}
      dataSource={data}
      columns={actionsColumn ? [...columns, actionsColumn] : columns}
      pagination={pagination}
      onChange={onTableChange}
    />
  );
}
