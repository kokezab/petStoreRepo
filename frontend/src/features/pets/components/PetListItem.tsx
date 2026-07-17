import type { Pet } from '@/api/generated/models';
import { List } from 'antd';
import { Link } from 'react-router';

interface PetListItemProps {
  pet: Pet;
}

export function PetListItem({ pet }: PetListItemProps) {
  return (
    <List.Item key={pet.id}>
      <Link to={`/pets/${pet.id}`}>{pet.name}</Link>
    </List.Item>
  );
}
