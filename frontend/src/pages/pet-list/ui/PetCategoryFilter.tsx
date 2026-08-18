import { Select, Space } from 'antd';

import { FEATURE_FLAGS, useFeatureFlag } from '@/lib/feature-flags';
import { useLocalization } from '@/shared/lib/i18n';

import { type PetCategory, usePetsFilter } from '../model/usePetsFilter';

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
  const { t } = useLocalization();
  const isPetCategoryFilterEnabled = useFeatureFlag(FEATURE_FLAGS.petCategoryFilter);

  const { category, setCategory } = usePetsFilter();

  if (!isPetCategoryFilterEnabled) {
    return null;
  }

  return (
    <Space>
      <label htmlFor='pets-category-filter'>Category filter</label>
      <Select<PetCategory>
        allowClear
        id='pets-category-filter'
        role='combobox'
        aria-label={t('petList.categoryFilterLabel')}
        placeholder='All categories'
        style={{ width: 160 }}
        options={petCategoryOptions}
        value={category}
        onChange={(value) => setCategory(value ?? null)}
      />
    </Space>
  );
}
