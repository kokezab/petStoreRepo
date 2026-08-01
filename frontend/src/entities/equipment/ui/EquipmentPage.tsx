import { Input, Select } from 'antd';

import { useLocalization } from '@/shared/lib/i18n';
import { usePermissions } from '@/shared/lib/rbac';
import { Codebook, useDefaultActionsColumn } from '@/shared/ui/codebook-page';

import { equipmentHooksServer } from '../api';
import { buildEquipmentPermissions } from '../model/permissions';
import { equipmentSchema } from '../model/schema';
import type { Equipment } from '../model/types';
import { useEquipmentViewStore } from '../model/viewStore';

export function EquipmentPage() {
  const { t } = useLocalization();
  const { can } = usePermissions();
  const view = useEquipmentViewStore();
  const actionsColumn = useDefaultActionsColumn<Equipment>();
  const permissions = buildEquipmentPermissions({ can });

  return (
    <Codebook.Root<Equipment>
      rowKey='id'
      hooks={equipmentHooksServer}
      permissions={permissions}
      schema={equipmentSchema}
    >
      <Codebook.Toolbar title={t('equipment.title')} />
      <Codebook.Pager
        pageSize={view.pageSize}
        onPageSizeChange={view.setPageSize}
        showSizeChanger
        pageSizeOptions={[10, 20, 50]}
      />

      <Codebook.Table<Equipment>
        columns={[
          {
            title: t('equipment.fields.name'),
            dataIndex: 'name',
            // Equipment runs in client mode (see equipment/api), so antd sorts
            // locally — that needs a comparator, not `sorter: true` (which only
            // works in server mode, where the backend does the sorting).
            sorter: (a, b) => a.name.localeCompare(b.name),
            defaultSortOrder: 'ascend',
          },
          { title: t('equipment.fields.code'), dataIndex: 'code' },
          { title: t('equipment.fields.status'), dataIndex: 'status' },
        ]}
        actionsColumn={actionsColumn}
      />

      <Codebook.FormModal title={t('equipment.entityName')}>
        <Codebook.Field name='name' label={t('equipment.fields.name')}>
          <Input />
        </Codebook.Field>

        <Codebook.Field name='code' label={t('equipment.fields.code')}>
          <Input maxLength={3} style={{ textTransform: 'uppercase' }} />
        </Codebook.Field>

        <Codebook.Field name='status' label={t('equipment.fields.status')} rules={[]}>
          <Select
            options={[
              { value: 'draft', label: 'Draft' },
              { value: 'active', label: 'Active' },
              { value: 'done', label: 'Done' },
            ]}
          />
        </Codebook.Field>
      </Codebook.FormModal>
    </Codebook.Root>
  );
}
