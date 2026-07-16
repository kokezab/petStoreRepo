import { expect } from '@playwright/test';
import { createBdd, DataTable } from 'playwright-bdd';
const { When, Then } = createBdd();

Then('I should see a {string} form', async ({ page }, name: string) => {
  await expect(page.getByRole('form', { name })).toBeVisible();
});

function toLabel(field: string): string {
  return field
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/^./, (c) => c.toUpperCase());
}

Then('the form should have the following fields:', async ({ page }, dataTable: DataTable) => {
  const form = page.getByRole('form', { name: 'Sign Up' });

  for (const { Field, Type } of dataTable.hashes()) {
    const field = form.getByLabel(toLabel(Field));

    await expect(field).toBeVisible();
    await expect(field).toHaveAttribute('type', Type);
  }
});

let userCreateRequestSent = false;

When('the user attempts to submit the form with one or more required fields empty', async ({ page }) => {
  userCreateRequestSent = false;
  await page.route('**/user', (route) => {
    if (route.request().method() === 'POST') {
      userCreateRequestSent = true;
    }
    return route.fallback();
  });

  const form = page.getByRole('form', { name: 'Sign Up' });
  await form.getByRole('button', { name: 'Sign Up' }).click();
});

Then(
  'validation errors are displayed next to the empty required fields \\(username, password, email)',
  async ({ page }) => {
    const form = page.getByRole('form', { name: 'Sign Up' });
    await expect(form.getByText('Username is requiredddd')).toBeVisible();
    await expect(form.getByText('Password is required')).toBeVisible();
    await expect(form.getByText('Email is required')).toBeVisible();
  },
);

Then('the form is not submitted to the API', async () => {
  expect(userCreateRequestSent).toBe(false);
});

Then('the user remains on the {string} page', async ({ page }, path: string) => {
  await expect(page).toHaveURL(path);
});
