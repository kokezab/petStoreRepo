import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';

import { getOrdersInMemory, mockAddOrderError, mockFeatureFlag } from '../support/mock-api';
import { selectAntDesignOption } from '../support/playwright-helpers';

const { Given, When, Then } = createBdd();

Given('the mocked API returns an error for creating an order', async ({ page }) => {
  await mockAddOrderError(page);
});

Given('the order-creation common flow', async ({ page }) => {
  await mockFeatureFlag(page, { 'order-creation': true });
  await page.goto('/orders');
  await expect(page.getByRole('button', { name: 'Create order' })).toBeVisible();
  await page.getByRole('button', { name: 'Create order' }).click();
});

Then('I should not see a {string} button', async ({ page }, name: string) => {
  await expect(page.getByRole('button', { name })).toHaveCount(0);
});

Then('I should see a {string} button', async ({ page }, name: string) => {
  await expect(page.getByRole('button', { name })).toBeVisible();
});

When(
  'I fill in the order form with pet id {string}, quantity {string}, ship date {string} and status {string}',
  async ({ page }, petId: string, quantity: string, shipDate: string, status: string) => {
    const dialog = page.getByRole('dialog', { name: 'Create order' });
    await dialog.getByRole('spinbutton', { name: 'Pet' }).fill(petId);
    await dialog.getByRole('spinbutton', { name: 'Quantity' }).fill(quantity);
    await dialog.getByLabel('Ship date').fill(shipDate);
    await selectAntDesignOption(dialog, page, 'Status', status);
  },
);

When('I submit the order form', async ({ page }) => {
  await page
    .getByRole('dialog', { name: 'Create order' })
    .getByRole('button', { name: 'Save' })
    .click();
});

Then('I should see a confirmation for the created order', async ({ page }) => {
  await expect(page.getByText(/order.*created|order.*#\d+/i)).toBeVisible();
});

Given('I submit the order form without filling it in', async ({ page }) => {
  await page
    .getByRole('dialog', { name: 'Create order' })
    .getByRole('button', { name: 'Save' })
    .click();
});

When('I cancel the order form', async ({ page }) => {
  await page
    .getByRole('dialog', { name: 'Create order' })
    .getByRole('button', { name: 'Cancel' })
    .click();
});

Then('no new order should have been created', async ({ page }) => {
  expect(getOrdersInMemory(page)).toHaveLength(0);
});
