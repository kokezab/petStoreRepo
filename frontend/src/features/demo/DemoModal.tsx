import { Modal } from 'antd';

import { useModalStore } from '../../stores/useModalStore';

export function DemoModal() {
  const isOpen = useModalStore((state) => state.isOpen);
  const message = useModalStore((state) => state.message);
  const closeModal = useModalStore((state) => state.closeModal);

  return (
    <Modal title='Demo Modal' open={isOpen} onOk={closeModal} onCancel={closeModal}>
      <p>{message}</p>
    </Modal>
  );
}
