import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';

import { mockAddPetError, mockFeatureFlag } from '../support/mock-api';
import { selectAntDesignOption } from '../support/playwright-helpers';

const { Given, When, Then } = createBdd();

Given('the mocked API returns an error for adding a pet', async ({ page }) => {
  await mockAddPetError(page);
});

Given('the pet-creation common flow', async ({ page }) => {
  await mockFeatureFlag(page, { 'pet-creation': true });
  await page.goto('/pets');
  await expect(page.getByRole('button', { name: 'Add pet' })).toBeVisible();
  await page.getByRole('button', { name: 'Add pet' }).click();
});

When(
  'I fill in the pet creation form with name {string}, category {string} and status {string}',
  async ({ page }, name: string, category: string, status: string) => {
    const dialog = page.getByRole('dialog', { name: 'Add pet' });
    await dialog.getByRole('textbox', { name: 'Name' }).fill(name);
    await dialog.getByRole('textbox', { name: 'Category' }).fill(category);
    await selectAntDesignOption(dialog, page, 'Status', status);
  },
);

When('I submit the pet creation form', async ({ page }) => {
  await page.getByRole('dialog', { name: 'Add pet' }).getByRole('button', { name: 'Save' }).click();
});

When('I submit the pet creation form without filling it in', async ({ page }) => {
  await page.getByRole('dialog', { name: 'Add pet' }).getByRole('button', { name: 'Save' }).click();
});

When('I cancel the pet creation form', async ({ page }) => {
  await page
    .getByRole('dialog', { name: 'Add pet' })
    .getByRole('button', { name: 'Cancel' })
    .click();
});

Then('the pet list should include a pet named {string}', async ({ page }, name: string) => {
  await expect(page.getByRole('list', { name: 'Pets' }).getByRole('link', { name })).toBeVisible();
});

Then('the pet list should not include a pet named {string}', async ({ page }, name: string) => {
  await expect(page.getByRole('list', { name: 'Pets' }).getByRole('link', { name })).toHaveCount(0);
});
