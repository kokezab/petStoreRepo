import type { Pet as PetDto, PetStatus } from '@/api/generated/models';

export type { PetStatus };

export interface Pet extends Omit<PetDto, 'photoUrls'> {
  photoUrls: string[];
}
