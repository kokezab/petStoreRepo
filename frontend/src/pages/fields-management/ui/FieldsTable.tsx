import { Button, message, Popconfirm, Space, Table, type TableColumnsType } from 'antd';

import { getApiErrorMessage } from '@/shared/lib/api-error';

import { useDeleteFieldDefinition, useFieldDefinitions } from '../api/fieldDefinitionQueries';
import type { FieldDefinition } from '../model/types';

interface FieldsTableProps {
  onEdit: (field: FieldDefinition) => void;
}

function formatConstraints(constraints: Record<string, unknown>) {
  return Object.entries(constraints)
    .map(([key, value]) => `${key}=${String(value)}`)
    .join(', ');
}

export function FieldsTable({ onEdit }: FieldsTableProps) {
  const { data, isLoading } = useFieldDefinitions();
  const deleteMutation = useDeleteFieldDefinition();

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      message.success('Field deleted');
    } catch (error) {
      message.error(getApiErrorMessage(error, 'Request failed'));
    }
  };

  const columns: TableColumnsType<FieldDefinition> = [
    { title: 'Field key', dataIndex: 'fieldKey', key: 'fieldKey' },
    { title: 'Label', dataIndex: 'label', key: 'label' },
    { title: 'Type', dataIndex: 'type', key: 'type' },
    {
      title: 'Required',
      dataIndex: 'required',
      key: 'required',
      render: (value: boolean) => (value ? 'yes' : 'no'),
    },
    {
      title: 'Constraints',
      dataIndex: 'constraints',
      key: 'constraints',
      render: formatConstraints,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button size='small' onClick={() => onEdit(record)}>
            Edit
          </Button>
          <Popconfirm
            title='Delete this field?'
            onConfirm={() => handleDelete(record.id)}
            okButtonProps={{ danger: true }}
          >
            <Button
              size='small'
              danger
              loading={deleteMutation.isPending && deleteMutation.variables === record.id}
            >
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return <Table rowKey='id' loading={isLoading} columns={columns} dataSource={data ?? []} />;
}
