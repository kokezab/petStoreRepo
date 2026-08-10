import { Select, Space } from 'antd';

import type { PetStatus } from '@/entities/pet';
import { useLocalization } from '@/shared/lib/i18n';

import { usePetsFilterActions, usePetsFilterStore } from '../model/usePetsFilterStore';

const STATUS_OPTIONS: PetStatus[] = ['available', 'pending', 'sold'];

const options = STATUS_OPTIONS.map((option) => ({
  value: option,
  label: option,
}));

export function PetsStatusFilter() {
  const { t } = useLocalization();
  const status = usePetsFilterStore((state) => state.status);
  const { setStatus } = usePetsFilterActions();

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
