import { expect, type Page } from '@playwright/test';
import { createBdd, DataTable } from 'playwright-bdd';

import { type MockField, mockFieldApi, mockFieldApiError } from '../support/mock-api';

const { Given, When, Then } = createBdd();

function fieldList(page: Page) {
  return page.getByRole('table', { name: 'Fields' });
}

function fieldRow(page: Page, label: string) {
  return fieldList(page)
    .getByRole('row')
    .filter({ has: page.getByRole('cell', { name: label, exact: true }) });
}

function deleteDialog(page: Page) {
  return page.getByRole('dialog', { name: 'Delete field' });
}

Given('the following fields exist:', async ({ page }, dataTable: DataTable) => {
  await mockFieldApi(
    page,
    dataTable.hashes().map((row) => ({
      label: row.Label,
      type: row.Type as MockField['type'],
      required: row.Required === 'yes',
    })),
  );
});

Given('the mocked API returns an error for creating a field', async ({ page }) => {
  await mockFieldApiError(page, 'POST');
});

Given('the mocked API returns an error for deleting a field', async ({ page }) => {
  await mockFieldApiError(page, 'DELETE');
});

Then(
  'the field list should include a field labelled {string} of type {string}',
  async ({ page }, label: string, type: string) => {
    const row = fieldRow(page, label);
    await expect(row).toHaveCount(1);
    await expect(row.getByRole('cell', { name: type, exact: true })).toBeVisible();
  },
);

Then(
  'the field list should include a field labelled {string} of type {string} that is required',
  async ({ page }, label: string, type: string) => {
    const row = fieldRow(page, label);
    await expect(row).toHaveCount(1);
    await expect(row.getByRole('cell', { name: type, exact: true })).toBeVisible();
    await expect(row.getByRole('cell', { name: 'Yes', exact: true })).toBeVisible();
  },
);

Then(
  'the field list should include a field labelled {string} of type {string} that is optional',
  async ({ page }, label: string, type: string) => {
    const row = fieldRow(page, label);
    await expect(row).toHaveCount(1);
    await expect(row.getByRole('cell', { name: type, exact: true })).toBeVisible();
    await expect(row.getByRole('cell', { name: 'No', exact: true })).toBeVisible();
  },
);

Then(
  'the field list should not include a field labelled {string}',
  async ({ page }, label: string) => {
    await expect(fieldList(page)).toBeVisible();
    await expect(fieldRow(page, label)).toHaveCount(0);
  },
);

Then(
  'I should not see {string} or {string} actions for the field {string}',
  async ({ page }, first: string, second: string, label: string) => {
    const row = fieldRow(page, label);
    await expect(row).toHaveCount(1);
    await expect(row.getByRole('button', { name: first })).toHaveCount(0);
    await expect(row.getByRole('button', { name: second })).toHaveCount(0);
  },
);

When('I click {string} for the field {string}', async ({ page }, action: string, label: string) => {
  await fieldRow(page, label).getByRole('button', { name: action }).click();
});

When('I cancel the {string} form', async ({ page }, name: string) => {
  await page.getByRole('form', { name }).getByRole('button', { name: 'Cancel' }).click();
});

When('I clear the {string} input', async ({ page }, label: string) => {
  await page.getByLabel(label).clear();
});

Then(
  'the {string} input should contain {string}',
  async ({ page }, label: string, value: string) => {
    await expect(page.getByRole('textbox', { name: label })).toHaveValue(value);
  },
);

Then(
  'the {string} select should have {string} selected',
  async ({ page }, label: string, value: string) => {
    // Antd renders the selected option's label as the Select's only visible text.
    const select = page.locator('.ant-select', {
      has: page.getByRole('combobox', { name: label }),
    });
    await expect(select).toHaveText(value);
  },
);

Then('the {string} checkbox should be unchecked', async ({ page }, label: string) => {
  await expect(page.getByRole('checkbox', { name: label })).not.toBeChecked();
});

When('I confirm the deletion', async ({ page }) => {
  await deleteDialog(page).getByRole('button', { name: 'Delete' }).click();
});

When('I cancel the deletion', async ({ page }) => {
  await deleteDialog(page).getByRole('button', { name: 'Cancel' }).click();
  await expect(deleteDialog(page)).toHaveCount(0);
});
