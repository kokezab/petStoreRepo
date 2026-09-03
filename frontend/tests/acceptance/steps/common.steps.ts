import { expect, type Locator, type Page } from '@playwright/test';
import { createBdd, DataTable } from 'playwright-bdd';

import { mockFeatureFlag, mockPetApi } from '../support/mock-api';
import { clearAntdDropdown, selectAntDesignOption, toLabel } from '../support/playwright-helpers';

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
  // instead (see lib/query-client.ts).

  const alert = page.getByRole('alert').or(page.getByText('Something went wrong')).first();
  await expect(alert).toBeVisible();
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
  await selectAntDesignOption(page, page, name, option);
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
  await expect(page.getByRole('dialog', { name })).toBeVisible();
});

Then('the {string} form should close', async ({ page }, name: string) => {
  await expect(page.getByRole('form', { name })).toHaveCount(0);
});

Then('the {string} form should still be open', async ({ page }, name: string) => {
  await expect(page.getByRole('form', { name })).toBeVisible();
});

Then('the {string} dialog should close', async ({ page }, name: string) => {
  await expect(page.getByRole('dialog', { name })).toHaveCount(0);
});

Then('the {string} dialog should still be open', async ({ page }, name: string) => {
  await expect(page.getByRole('dialog', { name })).toBeVisible();
});

Then('I should see a {string} validation message', async ({ page }, message: string) => {
  await expect(page.getByText(new RegExp(message, 'i'))).toBeVisible();
});

Then('I should not see the {string} dropdown', async ({ page }, name: string) => {
  await expect(page.getByRole('combobox', { name })).toHaveCount(0);
});

Then('I should see the {string} dropdown', async ({ page }, name: string) => {
  await expect(page.getByRole('combobox', { name })).toBeVisible();
});

When('I clear the {string} dropdown', async ({ page }, name: string) => {
  await clearAntdDropdown(page, name);
});

// Generic field fill: given a locator scoping to a single form (whether that's
// a plain `role="form"` or a modal `role="dialog"`), drive each field from a
// Field/Value table. Antd Selects can't be `.fill()`-ed — they portal their
// options to <body> — so a row opts into select handling via the optional
// Control column (default "text"). Sharing this lets both the form-scoped and
// dialog-scoped steps below reuse the same entry logic instead of a bespoke
// per-form step.
async function fillFields(scope: Locator, page: Page, dataTable: DataTable) {
  for (const row of dataTable.hashes()) {
    const label = toLabel(row.Field);
    const control = (row.Control ?? 'text').toLowerCase();

    switch (control) {
      case 'select':
        await selectAntDesignOption(scope, page, label, row.Value);
        break;
      case 'text':
      case 'date':
        await scope.getByLabel(label).fill(row.Value);
        break;
      default:
        throw new Error(
          `Unknown control "${row.Control}" for field "${row.Field}" — use text, select, or date.`,
        );
    }
  }
}

// Two scope families: "form" targets a plain `role="form"` page (order,
// org-unit, bulk); "dialog" targets a modal `role="dialog"` (pet), whose
// accessible name sits on the dialog rather than the inner form. Both submit
// via the shared "Save" button.
When('I fill in the {string} form with:', async ({ page }, name: string, dataTable: DataTable) => {
  await fillFields(page.getByRole('form', { name }), page, dataTable);
});

When(
  'I fill in the {string} dialog with:',
  async ({ page }, name: string, dataTable: DataTable) => {
    await fillFields(page.getByRole('dialog', { name }), page, dataTable);
  },
);

When('I submit the {string} form', async ({ page }, name: string) => {
  await page.getByRole('form', { name }).getByRole('button', { name: 'Save' }).click();
});

When('I submit the {string} form without filling it in', async ({ page }, name: string) => {
  await page.getByRole('form', { name }).getByRole('button', { name: 'Save' }).click();
});

When('I submit the {string} dialog', async ({ page }, name: string) => {
  await page.getByRole('dialog', { name }).getByRole('button', { name: 'Save' }).click();
});

When('I submit the {string} dialog without filling it in', async ({ page }, name: string) => {
  await page.getByRole('dialog', { name }).getByRole('button', { name: 'Save' }).click();
});
