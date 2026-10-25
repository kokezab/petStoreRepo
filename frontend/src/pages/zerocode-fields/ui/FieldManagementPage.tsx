import { Button, Space, Table, type TableColumnsType, Typography } from 'antd';

import { FEATURE_FLAGS, useFeatureFlag } from '@/lib/feature-flags';
import { useLocalization } from '@/shared/lib/i18n';

import { useFields } from '../api/fieldQueries';
import type { FieldDefinition } from '../model/types';
import { useFieldModalStore } from '../model/useFieldModalStore';
import { DeleteFieldModal } from './DeleteFieldModal';
import { FieldFormModal } from './FieldFormModal';

export function FieldManagementPage() {
  const { t } = useLocalization();
  const canManage = useFeatureFlag(FEATURE_FLAGS.fieldManagement);
  const { data: fields, isPending } = useFields();
  const openCreate = useFieldModalStore((state) => state.openCreate);
  const openEdit = useFieldModalStore((state) => state.openEdit);
  const openDelete = useFieldModalStore((state) => state.openDelete);

  const columns: TableColumnsType<FieldDefinition> = [
    { title: t('fieldManagement.columns.label'), dataIndex: 'label' },
    { title: t('fieldManagement.columns.type'), dataIndex: 'type' },
    {
      title: t('fieldManagement.columns.required'),
      dataIndex: 'required',
      render: (required: boolean) =>
        required ? t('fieldManagement.yes') : t('fieldManagement.no'),
    },
  ];

  if (canManage) {
    columns.push({
      title: t('fieldManagement.columns.actions'),
      key: 'actions',
      render: (_, field) => (
        <Space>
          <Button size='small' onClick={() => openEdit(field)}>
            {t('fieldManagement.edit')}
          </Button>
          <Button size='small' danger onClick={() => openDelete(field)}>
            {t('fieldManagement.delete')}
          </Button>
        </Space>
      ),
    });
  }

  return (
    <Space orientation='vertical' style={{ width: '100%' }} size='large'>
      <Space style={{ width: '100%', justifyContent: 'space-between' }}>
        <Typography.Title level={2} style={{ margin: 0 }}>
          {t('fieldManagement.title')}
        </Typography.Title>
        {canManage && (
          <Button type='primary' onClick={openCreate}>
            {t('fieldManagement.addButton')}
          </Button>
        )}
      </Space>
      <Table<FieldDefinition>
        aria-label={t('fieldManagement.listLabel')}
        rowKey='id'
        columns={columns}
        dataSource={fields}
        loading={isPending}
        pagination={false}
      />
      {canManage && (
        <>
          <FieldFormModal />
          <DeleteFieldModal />
        </>
      )}
    </Space>
  );
}
