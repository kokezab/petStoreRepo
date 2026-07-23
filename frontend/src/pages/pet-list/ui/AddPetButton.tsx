import { Button } from 'antd';

import { FEATURE_FLAGS, useFeatureFlag } from '@/lib/feature-flags';
import { useModalStore } from '@/stores/useModalStore';

export function AddPetButton() {
  const isPetCreationEnabled = useFeatureFlag(FEATURE_FLAGS.petCreation);
  const openModal = useModalStore((state) => state.openModal);

  if (!isPetCreationEnabled) {
    return null;
  }

  return <Button onClick={openModal}>Add pet</Button>;
}
