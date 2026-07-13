import { useModalStore } from '@/stores/useModalStore';
import { useFlag } from '@unleash/proxy-client-react';
import { Button } from 'antd';

export function AddPetButton() {
  const isPetCreationEnabled = useFlag('pet-creation');
  const openModal = useModalStore((state) => state.openModal);

  if (!isPetCreationEnabled) {
    return null;
  }

  return <Button onClick={openModal}>Add pet</Button>;
}
