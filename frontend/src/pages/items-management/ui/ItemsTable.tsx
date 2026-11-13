import { useMemo, useState } from 'react';

import { Button, message, Modal, Space, Table, type TableColumnsType, type TableProps } from 'antd';

import { getApiErrorMessage } from '@/shared/lib/api-error';

import {
  type ItemListParams,
  useDeleteItemDefinition,
  useItemDefinitions,
} from '../api/itemDefinitionQueries';
import { buildItemColumns } from '../model/itemColumns';
import type { ItemField } from '../model/itemField';
import type { ItemDefinition } from '../model/types';

interface ItemsTableProps {
  fields: ItemField[];
  // Edit/Delete actions are shown only when this is set.
  onEdit?: (item: ItemDefinition) => void;
}

type TablePagination = Parameters<NonNullable<TableProps<ItemDefinition>['onChange']>>[0];

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]; // the backend caps a page at 100

// Oldest first, so a newly added item lands at the end of the list.
const DEFAULT_PARAMS: ItemListParams = { page: 0, size: 10, sortBy: 'createdAt', direction: 'asc' };

// A page-size change goes back to the first page.
function paramsFromPagination(
  current: ItemListParams,
  pagination: TablePagination,
): ItemListParams {
  const size = pagination.pageSize ?? current.size;
  const page = size !== current.size ? 0 : (pagination.current ?? 1) - 1;
  return { ...current, page, size };
}

export function ItemsTable({ fields, onEdit }: ItemsTableProps) {
  const [params, setParams] = useState<ItemListParams>(DEFAULT_PARAMS);
  const { data, isLoading, isPlaceholderData } = useItemDefinitions(params);
  const deleteMutation = useDeleteItemDefinition();

  // Deleting the last item on the last page would leave an empty page: step
  // back to the new last page instead.
  const total = data?.total ?? 0;
  const lastPage = Math.max(0, Math.ceil(total / params.size) - 1);
  if (data && !isPlaceholderData && params.page > lastPage) {
    setParams({ ...params, page: lastPage });
  }

  const columns = useMemo<TableColumnsType<ItemDefinition>>(() => {
    const handleDelete = async (id: string) => {
      try {
        await deleteMutation.mutateAsync(id);
        message.success('Item deleted');
      } catch (error) {
        message.error(getApiErrorMessage(error, 'Request failed'));
      }
    };

    // A modal confirm (role="dialog"), so the confirmation is announced and
    // reachable like any other dialog.
    const confirmDelete = (item: ItemDefinition) => {
      Modal.confirm({
        title: `Delete "${item.name}"?`,
        okText: 'Delete',
        okButtonProps: { danger: true },
        cancelText: 'Cancel',
        onOk: () => handleDelete(item.id),
      });
    };

    const base = buildItemColumns(fields);
    if (!onEdit) return base;
    return [
      ...base,
      {
        title: 'Actions',
        key: 'actions',
        render: (_, record) => (
          <Space>
            <Button size='small' onClick={() => onEdit(record)}>
              Edit
            </Button>
            <Button
              size='small'
              danger
              loading={deleteMutation.isPending && deleteMutation.variables === record.id}
              onClick={() => confirmDelete(record)}
            >
              Delete
            </Button>
          </Space>
        ),
      },
    ];
  }, [fields, onEdit, deleteMutation]);

  return (
    <Table
      rowKey='id'
      loading={isLoading || isPlaceholderData}
      dataSource={data?.items ?? []}
      columns={columns}
      pagination={{
        current: params.page + 1,
        pageSize: params.size,
        total,
        showSizeChanger: true,
        pageSizeOptions: PAGE_SIZE_OPTIONS,
      }}
      onChange={(pagination) => setParams(paramsFromPagination(params, pagination))}
    />
  );
}
