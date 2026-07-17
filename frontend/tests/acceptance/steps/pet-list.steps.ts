import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';

import { pets } from '../fixtures/pets';
import { mockPetListDelayed, mockPetListEmpty, mockPetListError } from '../support/mock-api';

const { Given, When, Then } = createBdd();

Given('the mocked pet list request is delayed', async ({ page }) => {
  await mockPetListDelayed(page, 2000);
});

Given('the mocked API returns no pets for status {string}', async ({ page }, status: string) => {
  await mockPetListEmpty(page, status);
});

Given('the mocked API returns an error for the pet list request', async ({ page }) => {
  await mockPetListError(page);
});

When('I select the {string} status filter', async ({ page }, status: string) => {
  await page.getByRole('combobox', { name: 'Status filter' }).selectOption(status);
});

Then(
  'the pet list should show only pets with status {string}',
  async ({ page }, status: string) => {
    const expected = pets.filter((pet) => pet.status === status);
    const list = page.getByRole('list', { name: 'Pets' });
    await expect(list.getByRole('listitem')).toHaveCount(expected.length);
    for (const pet of expected) {
      await expect(list.getByRole('link', { name: pet.name })).toBeVisible();
    }
  },
);

Then('each pet should be listed by name', async ({ page }) => {
  await expect(
    page.getByRole('list', { name: 'Pets' }).getByRole('listitem').first(),
  ).toBeVisible();
});

Then('each pet should have a photo', async ({ page }) => {
  await expect(page.getByRole('list', { name: 'Pets' }).getByRole('img').first()).toBeVisible();
});

Then('I should see an empty-state message', async ({ page }) => {
  await expect(page.getByText(/no pets found/i)).toBeVisible();
});

Then('I should see a loading indicator before the list appears', async ({ page }) => {
  await expect(page.getByRole('status', { name: 'Loading pets' })).toBeVisible();
});
