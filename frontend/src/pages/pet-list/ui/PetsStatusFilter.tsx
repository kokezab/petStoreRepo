import { Select, Space } from 'antd';

import type { PetStatus } from '@/entities/pet';
import { useLocalization } from '@/shared/lib/i18n';

import { usePetsFilter } from '../model/usePetsFilter';

const STATUS_OPTIONS: PetStatus[] = ['available', 'pending', 'sold'];

const options = STATUS_OPTIONS.map((option) => ({
  value: option,
  label: option,
}));

export function PetsStatusFilter() {
  const { t } = useLocalization();
  const { status, setStatus } = usePetsFilter();

  return (
    <Space>
      <label htmlFor='pets-status-filter'>Status filter</label>
      <Select<PetStatus>
        id='pets-status-filter'
        role='combobox'
        aria-label={t('petList.statusFilterLabel')}
        value={status}
        onChange={setStatus}
        options={options}
      />
    </Space>
  );
}
