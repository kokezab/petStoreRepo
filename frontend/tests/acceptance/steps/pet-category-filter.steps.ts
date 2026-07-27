import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';

import { pets } from '../fixtures/pets';

const { Then } = createBdd();

Then(
  'the pet list should show only pets with status {string} and category {string}',
  async ({ page }, status: string, category: string) => {
    const expected = pets.filter((pet) => pet.status === status && pet.category?.name === category);
    expect(expected.length).toBeGreaterThan(0);
    const list = page.getByRole('list', { name: 'Pets' });
    await expect(list.getByRole('listitem')).toHaveCount(expected.length);
    for (const pet of expected) {
      await expect(list.getByRole('link', { name: pet.name })).toBeVisible();
    }
  },
);
