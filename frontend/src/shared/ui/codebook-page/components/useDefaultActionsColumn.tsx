import { Space } from 'antd';
import type { ColumnsType } from 'antd/es/table';

import { DeleteAction, EditAction } from './Actions';

/** Ready-made "Actions" column with Edit + Delete. Pass as `actionsColumn` to Codebook.Table. */
export function useDefaultActionsColumn<T extends object>(): ColumnsType<T>[number] {
  return {
    title: 'Actions',
    key: 'actions',
    render: (_: unknown, record: T) => (
      <Space>
        <EditAction record={record} />
        <DeleteAction record={record} />
      </Space>
    ),
  };
}
