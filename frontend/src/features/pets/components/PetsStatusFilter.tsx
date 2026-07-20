import type { FindPetsByStatusStatusItem } from '@/api/generated/models';
import { usePetsFilterActions, usePetsFilterStore } from '@/stores/usePetsFilterStore';
import { Select } from 'antd';

const STATUS_OPTIONS: FindPetsByStatusStatusItem[] = ['available', 'pending', 'sold'];

const options = STATUS_OPTIONS.map((option) => ({
  value: option,
  label: option,
}));

export function PetsStatusFilter() {
  const status = usePetsFilterStore((state) => state.status);
  const { setStatus } = usePetsFilterActions();

  return (
    <>
      <label>Status filter</label>
      <Select<FindPetsByStatusStatusItem>
        role='combobox'
        aria-label='Status filter'
        value={status}
        onChange={(value) => setStatus(value)}
        options={options}
      />
    </>
  );
}
