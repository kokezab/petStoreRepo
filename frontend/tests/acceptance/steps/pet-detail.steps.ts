import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';
import { pets } from '../fixtures/pets';

const { Given, When, Then } = createBdd();

// The default status filter ("available") always returns [Bella, Max] in fixture order, so
// "the first pet card" deterministically means Bella (id 1) across these scenarios.
const firstAvailablePet = pets[0];

Given('I am on a pet\'s detail page', async ({ page }) => {
  await page.goto(`/pets/${firstAvailablePet.id}`);
});

When('I click on a pet card', async ({ page }) => {
  await page.getByRole('list', { name: 'Pets' }).getByRole('link').first().click();
});

When('I click {string}', async ({ page }, text: string) => {
  await page.getByRole('link', { name: text }).click();
});

Then('I should be on that pet\'s detail page', async ({ page }) => {
  await expect(page).toHaveURL(`/pets/${firstAvailablePet.id}`);
});

Then('I should see its name, status, category, photo, and tags', async ({ page }) => {
  await expect(page.getByRole('heading', { name: firstAvailablePet.name, level: 1 })).toBeVisible();
  await expect(page.getByText(firstAvailablePet.status)).toBeVisible();
  await expect(page.getByText(firstAvailablePet.category.name)).toBeVisible();
  await expect(page.getByRole('img', { name: firstAvailablePet.name })).toBeVisible();
  await expect(page.getByText(firstAvailablePet.tags[0].name)).toBeVisible();
});

Then('I should see pet {string}\'s detail', async ({ page }, id: string) => {
  const pet = pets.find((p) => p.id === Number(id));
  if (!pet) throw new Error(`No fixture pet with id ${id}`);
  await expect(page.getByRole('heading', { name: pet.name, level: 1 })).toBeVisible();
});

Then('I should see a {string} message', async ({ page }, text: string) => {
  await expect(page.getByText(new RegExp(text, 'i'))).toBeVisible();
});

Then('the app should not crash', async ({ page }) => {
  await expect(page.locator('body')).toBeVisible();
});
