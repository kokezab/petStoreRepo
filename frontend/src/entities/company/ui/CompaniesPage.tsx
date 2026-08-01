import { Input } from 'antd';

import { useLocalization } from '@/shared/lib/i18n';
import { usePermissions } from '@/shared/lib/rbac';
import { Codebook, useDefaultActionsColumn } from '@/shared/ui/codebook-page';

import { companyHooksServer } from '../api';
import { buildCompanyPermissions } from '../model/permissions';
import { companySchema } from '../model/schema';
import type { Company } from '../model/types';
import { useCompanyViewStore } from '../model/viewStore';

export function CompaniesPage() {
  const { t } = useLocalization();
  const { can } = usePermissions();
  const view = useCompanyViewStore();
  const actionsColumn = useDefaultActionsColumn<Company>();

  return (
    <Codebook.Root<Company>
      rowKey='id'
      hooks={companyHooksServer}
      permissions={buildCompanyPermissions({ can })}
      schema={companySchema}
    >
      <Codebook.Toolbar title={t('company.title')} />
      <Codebook.Pager pageSize={view.pageSize} onPageSizeChange={view.setPageSize} />

      <Codebook.Table<Company>
        columns={[
          { title: t('company.fields.name'), dataIndex: 'name', sorter: true },
          { title: t('company.fields.shortName'), dataIndex: 'shortName' },
          {
            title: t('company.fields.active'),
            dataIndex: 'active',
            render: (active: boolean) => (active ? t('company.active.yes') : t('company.active.no')),
          },
        ]}
        actionsColumn={actionsColumn}
      />

      <Codebook.FormModal title={t('company.entityName')}>
        <Codebook.Field name='name' label={t('company.fields.name')}>
          <Input maxLength={100} />
        </Codebook.Field>

        <Codebook.Field name='shortName' label={t('company.fields.shortName')}>
          <Input maxLength={30} />
        </Codebook.Field>

        <Codebook.Field name='additionalInfo' label={t('company.fields.additionalInfo')}>
          <Input.TextArea maxLength={1000} rows={3} />
        </Codebook.Field>
      </Codebook.FormModal>
    </Codebook.Root>
  );
}
