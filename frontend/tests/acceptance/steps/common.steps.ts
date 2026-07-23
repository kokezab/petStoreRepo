import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';

import { mockFeatureFlag, mockPetApi } from '../support/mock-api';

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

Then('I should be redirected to {string}', async ({ page }, path: string) => {
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

Then('I should not see a {string} link', async ({ page }, name: string) => {
  await expect(page.getByRole('link', { name })).toHaveCount(0);
});

Then('I should see a {string} link', async ({ page }, name: string) => {
  await expect(page.getByRole('link', { name })).toBeVisible();
});

Given('the {string} feature flag is enabled', async ({ page }, flagName: string) => {
  await mockFeatureFlag(page, { [flagName]: true });
});

Given('the {string} feature flag is disabled', async ({ page }, flagName: string) => {
  await mockFeatureFlag(page, { [flagName]: false });
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
  await expect(page.getByRole('form', { name })).toBeVisible();
});

Then('I should see the {string} dialog', async ({ page }, name: string) => {
  await expect(page.getByRole('form', { name })).toBeVisible();
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
