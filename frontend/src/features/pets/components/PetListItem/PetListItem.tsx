import type { Pet } from '@/api/generated/models';
import { Card, List, Tag } from 'antd';
import { Link } from 'react-router';
import { PetStatusTag } from '../PetStatusTag/PetStatusTag';

interface PetListItemProps {
  pet: Pet;
}

export function PetListItem({ pet }: PetListItemProps) {
  return (
    <List.Item key={pet.id}>
      <Card>      
        <Link to={`/pets/${pet.id}`}>{pet.name}</Link>
        <PetStatusTag status={pet.status} />
      </Card>
    </List.Item>
  );
}
