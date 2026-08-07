import { Select } from 'antd';

import type { PetStatus } from '@/entities/pet';

import { usePetsFilterActions, usePetsFilterStore } from '../model/usePetsFilterStore';

const STATUS_OPTIONS: PetStatus[] = ['available', 'pending', 'sold'];

const options = STATUS_OPTIONS.map((option) => ({
  value: option,
  label: option,
}));

export function PetsStatusFilter() {
  const status = usePetsFilterStore((state) => state.status);
  const { setStatus } = usePetsFilterActions();

  return (
    <div>
      <label htmlFor='pets-status-filter'>Status filter</label>
      <Select<PetStatus>
        id='pets-status-filter'
        role='combobox'
        aria-label='Status filter'
        style={{ width: 160 }}
        value={status}
        onChange={setStatus}
        options={options}
      />
    </div>
  );
}
