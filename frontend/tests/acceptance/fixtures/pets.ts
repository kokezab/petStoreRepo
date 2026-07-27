import type { Order } from '@/entities/order';
import type { Pet, PetStatus } from '@/entities/pet';

export type { Order, Pet, PetStatus };

export const pets: Pet[] = [
  {
    id: 1,
    name: 'Bella',
    status: 'available',
    category: { id: 1, name: 'Dogs' },
    photoUrls: ['https://example.com/bella.jpg'],
    tags: [{ id: 1, name: 'friendly' }],
  },
  {
    id: 2,
    name: 'Max',
    status: 'available',
    category: { id: 1, name: 'Dogs' },
    photoUrls: ['https://example.com/max.jpg'],
    tags: [{ id: 2, name: 'playful' }],
  },
  {
    id: 3,
    name: 'Whiskers',
    status: 'pending',
    category: { id: 2, name: 'Cats' },
    photoUrls: ['https://example.com/whiskers.jpg'],
    tags: [{ id: 3, name: 'shy' }],
  },
  {
    id: 4,
    name: 'Tweety',
    status: 'pending',
    category: { id: 3, name: 'Birds' },
    photoUrls: ['https://example.com/tweety.jpg'],
    tags: [],
  },
  {
    id: 5,
    name: 'Rocky',
    status: 'sold',
    category: { id: 1, name: 'Dogs' },
    photoUrls: ['https://example.com/rocky.jpg'],
    tags: [{ id: 1, name: 'friendly' }],
  },
  {
    // id 6 is reserved: the mock POST /pet handler assigns it to created pets.
    id: 7,
    name: 'Buddy',
    status: 'pending',
    category: { id: 1, name: 'Dogs' },
    photoUrls: ['https://example.com/buddy.jpg'],
    tags: [{ id: 2, name: 'playful' }],
  },
];

export const inventoryCounts: Record<PetStatus, number> = {
  available: pets.filter((pet) => pet.status === 'available').length,
  pending: pets.filter((pet) => pet.status === 'pending').length,
  sold: pets.filter((pet) => pet.status === 'sold').length,
};
