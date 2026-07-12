import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';
import { mockPetApi } from '../support/mock-api';

export const { Given, When, Then } = createBdd();

Given('the pet store app is running with mocked API data', async ({ page }) => {
  await mockPetApi(page);
});

Given('I am on the {string} page', async ({ page }, path: string) => {
  await page.goto(path);
});

When('I navigate to {string}', async ({ page }, path: string) => {
  await page.goto(path);
});

When('I navigate directly to {string}', async ({ page }, path: string) => {
  await page.goto(path);
});

Then('I should be on the {string} page', async ({ page }, path: string) => {
  await expect(page).toHaveURL(path);
});

Then('I should be back on the {string} page', async ({ page }, path: string) => {
  await expect(page).toHaveURL(path);
});

Then('I should see an error message instead of a blank page', async ({ page }) => {
  await expect(page.getByRole('alert')).toBeVisible();
});

Then('I should see {string} text', async ({ page }, text: string) => {
  await expect(page.getByText(new RegExp(text, 'i'))).toBeVisible();
});

Then('I should see {string} heading', async ({ page }, title: string) => {
  await expect(page.getByRole('heading', { name: title })).toBeVisible();
});
