import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';

import { mockAddPetError, mockFeatureFlag } from '../support/mock-api';

const { Given, When, Then } = createBdd();

Given('the {string} feature flag is enabled', async ({ page }, flagName: string) => {
  await mockFeatureFlag(page, { [flagName]: true });
});

Given('the {string} feature flag is disabled', async ({ page }, flagName: string) => {
  await mockFeatureFlag(page, { [flagName]: false });
});

Given('the mocked API returns an error for adding a pet', async ({ page }) => {
  await mockAddPetError(page);
});

Then('I should not see an {string} button', async ({ page }, name: string) => {
  await expect(page.getByRole('button', { name })).toHaveCount(0);
});

Then('I should see an {string} button', async ({ page }, name: string) => {
  await expect(page.getByRole('button', { name })).toBeVisible();
});

When('I click the {string} button', async ({ page }, name: string) => {
  await page.getByRole('button', { name }).click();
});

Then('I should see the {string} form', async ({ page }, name: string) => {
  await expect(page.getByRole('dialog', { name })).toBeVisible();
});

When(
  'I fill in the pet creation form with name {string}, category {string} and status {string}',
  async ({ page }, name: string, category: string, status: string) => {
    const dialog = page.getByRole('dialog', { name: 'Add pet' });
    await dialog.getByRole('textbox', { name: 'Name' }).fill(name);
    await dialog.getByRole('textbox', { name: 'Category' }).fill(category);
    await dialog.getByRole('combobox', { name: 'Status' }).selectOption(status);
  },
);

When('I submit the pet creation form', async ({ page }) => {
  await page.getByRole('dialog', { name: 'Add pet' }).getByRole('button', { name: 'Save' }).click();
});

When('I submit the pet creation form without filling it in', async ({ page }) => {
  await page.getByRole('dialog', { name: 'Add pet' }).getByRole('button', { name: 'Save' }).click();
});

When('I cancel the pet creation form', async ({ page }) => {
  await page.getByRole('dialog', { name: 'Add pet' }).getByRole('button', { name: 'Cancel' }).click();
});

Then('the {string} form should close', async ({ page }, name: string) => {
  await expect(page.getByRole('dialog', { name })).toHaveCount(0);
});

Then('the {string} form should still be open', async ({ page }, name: string) => {
  await expect(page.getByRole('dialog', { name })).toBeVisible();
});

Then('I should see a {string} validation message', async ({ page }, message: string) => {
  await expect(page.getByText(new RegExp(message, 'i'))).toBeVisible();
});

Then('the pet list should include a pet named {string}', async ({ page }, name: string) => {
  await expect(page.getByRole('list', { name: 'Pets' }).getByRole('link', { name })).toBeVisible();
});

Then('the pet list should not include a pet named {string}', async ({ page }, name: string) => {
  await expect(page.getByRole('list', { name: 'Pets' }).getByRole('link', { name })).toHaveCount(0);
});
