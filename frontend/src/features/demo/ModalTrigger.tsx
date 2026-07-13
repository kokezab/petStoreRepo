import { Button } from 'antd';

import { useModalStore } from '../../stores/useModalStore';

export function ModalTrigger() {
  const openModal = useModalStore((state) => state.openModal);

  return (
    <Button type='primary' onClick={() => openModal('Hello from zustand!')}>
      Open Demo Modal
    </Button>
  );
}
