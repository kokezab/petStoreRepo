import { Tag } from 'antd';

import { useModalStore } from '../../stores/useModalStore';

export function ModalStatus() {
  const isOpen = useModalStore((state) => state.isOpen);

  return (
    <div>
      <p>
        Modal is <Tag color={isOpen ? 'green' : 'red'}>{isOpen ? 'open' : 'closed'}</Tag>
      </p>
    </div>
  );
}
