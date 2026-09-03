import { useState } from 'react';

import { Button } from 'antd';

import { FEATURE_FLAGS, useFeatureFlag } from '@/lib/feature-flags';
import { useOrganizationalUnits } from '@/pages/organizational-unit-creation/model/useOrganizationalUnits';
import { CreateOrganizationalUnitForm } from '@/pages/organizational-unit-creation/ui/CreateOrganizationalUnitForm';
import { OrganizationalUnitList } from '@/pages/organizational-unit-creation/ui/OrganizationalUnitList';
import { useLocalization } from '@/shared/lib/i18n';

export function CreateOrganizationalUnitPage() {
  const { t } = useLocalization();
  const isCreationEnabled = useFeatureFlag(FEATURE_FLAGS.organizationalUnitCreation);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { units, addUnit } = useOrganizationalUnits();

  const handleCreate = (name: string) => {
    addUnit(name);
    setIsFormOpen(false);
  };

  return (
    <div>
      {isCreationEnabled && (
        <Button type='primary' onClick={() => setIsFormOpen(true)}>
          {t('organizationalUnit.createForm.addButton')}
        </Button>
      )}

      {isFormOpen && <CreateOrganizationalUnitForm onCreate={handleCreate} />}

      <OrganizationalUnitList units={units} />
    </div>
  );
}
