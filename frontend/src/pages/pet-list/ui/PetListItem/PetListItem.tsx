import { Card, List, Typography } from 'antd';
import { Link } from 'react-router';

import { ImageWithFallback } from '@/components/ImageWithFallback/ImageWithFallback';
import type { Pet } from '@/entities/pet';
import { PetStatusTag } from '@/entities/pet';

const { Title } = Typography;

const PET_PLACEHOLDER_IMAGE = 'pet_placeholder.png';

interface PetListItemProps {
  pet: Pet;
}

export function PetListItem({ pet }: PetListItemProps) {
  const src = pet.photoUrls?.[0] || PET_PLACEHOLDER_IMAGE;

  return (
    <List.Item key={pet.id}>
      <Card
        title={
          <ImageWithFallback
            width={150}
            src={src}
            alt={pet.name}
            fallbackSrc={PET_PLACEHOLDER_IMAGE}
          />
        }
      >
        <Link to={`/pets/${pet.id}`}>
          <Title level={2}>{pet.name}</Title>
        </Link>
        <PetStatusTag status={pet.status} />
      </Card>
    </List.Item>
  );
}
