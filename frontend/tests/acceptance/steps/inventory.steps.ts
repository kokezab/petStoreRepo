import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';

import { inventoryCounts, type PetStatus } from '../fixtures/pets';
import { mockInventoryDelayed, mockInventoryError } from '../support/mock-api';

const { Given, Then } = createBdd();

Given('the mocked inventory request is delayed', async ({ page }) => {
  await mockInventoryDelayed(page, 2000);
});

Given('the mocked API returns an error for the inventory request', async ({ page }) => {
  await mockInventoryError(page);
});

Then(
  'I should see pet counts grouped by {string}, {string}, and {string}',
  async ({ page }, status1: string, status2: string, status3: string) => {
    for (const status of [status1, status2, status3] as PetStatus[]) {
      await expect(
        page.getByText(new RegExp(`${status}.*${inventoryCounts[status]}`, 'i')),
      ).toBeVisible();
    }
  },
);

Then('I should see a loading indicator before the counts appear', async ({ page }) => {
  await expect(page.getByRole('status', { name: 'Loading inventory' })).toBeVisible();
});
