import { Tag } from 'antd';

import type { Pet, PetStatus } from '@/api/generated/models';

interface PetStatusTagProps {
  status: Pet['status'];
}

const STATUS_COLORS: Record<PetStatus, string> = {
  available: '#52c41a',
  pending: '#faad14',
  sold: '#f5222d',
};

export function PetStatusTag({ status }: PetStatusTagProps) {
  if (!status) {
    return null;
  }

  return <Tag color={STATUS_COLORS[status]}>{status}</Tag>;
}
