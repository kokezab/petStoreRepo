import type { Pet as PetDto, PetStatus } from '@/shared/api/generated/models';

export type { PetStatus };

export interface Pet extends Omit<PetDto, 'photoUrls'> {
  photoUrls: string[];
}
