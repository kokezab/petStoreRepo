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
  // Locally-renderable errors (4xx) show an inline role="alert" message
  // (see QueryState/useApiError); 5xx/network failures escalate to the
  // nearest RouteErrorBoundary, which renders an antd `Result` heading
  // instead (see main.tsx / query-client.ts).
  const inlineAlert = page.getByRole('alert');
  const boundaryFallback = page.getByText('Something went wrong');
  await expect(inlineAlert.or(boundaryFallback)).toBeVisible();
});

Then('I should see {string} text', async ({ page }, text: string) => {
  await expect(page.getByText(new RegExp(text, 'i'))).toBeVisible();
});

Then('I should see {string} heading', async ({ page }, title: string) => {
  await expect(page.getByRole('heading', { name: title })).toBeVisible();
});

Then('I should see {string} placeholder', async ({ page }, placeholder: string) => {
  await expect(page.getByPlaceholder(placeholder)).toBeVisible();
});

When('I chose dropdown {string} value {string}', async ({ page }, name: string, option: string) => {
  await page.getByRole('combobox', { name }).click();
  await page.getByTitle(option).click();
});
