import { Input, Select } from 'antd';

import { useLocalization } from '@/shared/lib/i18n';
import { usePermissions } from '@/shared/lib/rbac';
import { Codebook, useDefaultActionsColumn } from '@/shared/ui/codebook-page';

import { countryHooksServer } from '../api';
import { buildCountryPermissions } from '../model/permissions';
import { countrySchema } from '../model/schema';
import type { Country } from '../model/types';
import { useCountryViewStore } from '../model/viewStore';

export function CountriesPage() {
  const { t } = useLocalization();
  const { can } = usePermissions();
  const view = useCountryViewStore();
  const actionsColumn = useDefaultActionsColumn<Country>();

  return (
    <Codebook.Root<Country>
      rowKey='id'
      hooks={countryHooksServer}
      permissions={buildCountryPermissions({ can })}
      schema={countrySchema}
    >
      <Codebook.Toolbar title={t('countries.title')} />
      <Codebook.Pager pageSize={view.pageSize} onPageSizeChange={view.setPageSize} />

      <Codebook.Table<Country>
        size='small'
        columns={[
          { title: t('countries.fields.name'), dataIndex: 'name', sorter: true },
          { title: t('countries.fields.code'), dataIndex: 'code' },
          { title: t('countries.fields.status'), dataIndex: 'status' },
        ]}
        actionsColumn={actionsColumn}
      />

      <Codebook.FormModal title={t('countries.entityName')}>
        <Codebook.Field name='name' label={t('countries.fields.name')}>
          <Input />
        </Codebook.Field>

        <Codebook.Field name='code' label={t('countries.fields.code')}>
          <Input maxLength={3} style={{ textTransform: 'uppercase' }} />
        </Codebook.Field>

        <Codebook.Field name='status' label={t('countries.fields.status')} rules={[]}>
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
