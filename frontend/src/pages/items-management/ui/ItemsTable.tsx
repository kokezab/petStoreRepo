import { useMemo } from 'react';

import { Button, message, Modal, Space, Table, type TableColumnsType } from 'antd';

import { getApiErrorMessage } from '@/shared/lib/api-error';

import { useDeleteItemDefinition, useItemDefinitions } from '../api/itemDefinitionQueries';
import { buildItemColumns } from '../model/itemColumns';
import type { ItemField } from '../model/itemField';
import type { ItemDefinition } from '../model/types';

interface ItemsTableProps {
  fields: ItemField[];
  // Edit/Delete actions are shown only when this is set.
  onEdit?: (item: ItemDefinition) => void;
}

export function ItemsTable({ fields, onEdit }: ItemsTableProps) {
  const { data: items, isLoading } = useItemDefinitions();
  const deleteMutation = useDeleteItemDefinition();

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

  return <Table rowKey='id' loading={isLoading} dataSource={items ?? []} columns={columns} />;
}
