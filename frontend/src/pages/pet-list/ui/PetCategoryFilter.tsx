import { Select } from 'antd';

import { FEATURE_FLAGS, useFeatureFlag } from '@/lib/feature-flags';

import {
  type PetCategory,
  usePetsFilterActions,
  usePetsFilterStore,
} from '../model/usePetsFilterStore';

const petCategoryOptions: { value: PetCategory; label: string }[] = [
  {
    value: 'Dogs',
    label: 'Dogs',
  },
  {
    value: 'Cats',
    label: 'Cats',
  },
];

export function PetCategoryFilter() {
  const isPetCategoryFilterEnabled = useFeatureFlag(FEATURE_FLAGS.petCategoryFilter);

  const category = usePetsFilterStore((state) => state.category);
  const { setCategory } = usePetsFilterActions();

  if (!isPetCategoryFilterEnabled) {
    return null;
  }

  return (
    <>
      <label htmlFor='pets-category-filter'>Category filter</label>
      <Select<PetCategory>
        allowClear
        id='pets-category-filter'
        role='combobox'
        aria-label='Category filter'
        placeholder='All categories'
        style={{ width: 160 }}
        options={petCategoryOptions}
        value={category}
        onChange={(value) => setCategory(value ?? null)}
      />
    </>
  );
}
