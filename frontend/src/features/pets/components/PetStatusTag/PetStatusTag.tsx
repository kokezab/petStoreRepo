import type { Pet, PetStatus } from '@/api/generated/models';
import { Tag } from 'antd';

interface PetStatusTagProps {
  status: Pet['status'];
}

const STATUS_COLORS: Record<PetStatus, string> = {
  available: 'green',
  pending: 'orange',
  sold: 'red',  
};

export function PetStatusTag({ status }: PetStatusTagProps) {
  if (!status) {
    return null;
  }

  return <Tag color={STATUS_COLORS[status]}>{status}</Tag>;
}
