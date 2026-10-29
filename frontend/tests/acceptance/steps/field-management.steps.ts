import { expect, type Locator, type Page } from '@playwright/test';
import { createBdd, DataTable } from 'playwright-bdd';

import type { FieldDefinitionResponse } from '@/shared/api/generated/zerocode/models/fieldDefinitionResponse';
import type { FieldDefinitionResponseType } from '@/shared/api/generated/zerocode/models/fieldDefinitionResponseType';

import {
  getCreatedFields,
  mockCreateFieldError,
  mockDeleteFieldError,
  mockFieldApi,
  mockUpdateFieldNotFound,
} from '../support/mock-api';

const { Given, When, Then } = createBdd();

// Every constraint input the form can render, by label. AT-44 asserts that
// exactly the ones for the selected type are present and the rest are absent.
const CONSTRAINT_INPUTS = ['Max length', 'Minimum', 'Maximum'];

// Feature tables write constraints as "maxLength=40, min=0" — the same text
// the list's Constraints column is expected to render.
function parseConstraints(text: string): Record<string, number> {
  if (!text.trim()) return {};
  return Object.fromEntries(
    text.split(',').map((pair) => {
      const [key, value] = pair.split('=').map((part) => part.trim());
      return [key, Number(value)];
    }),
  );
}

function normalize(value: string | undefined): string {
  return (value ?? '').trim().toLowerCase();
}

// Reads the Antd table into one record per data row, keyed by column header,
// so assertions can name columns the way the feature tables do.
async function readFieldRows(page: Page): Promise<Record<string, string>[]> {
  const table = page.getByRole('table');
  const headers = (await table.getByRole('columnheader').allInnerTexts()).map((h) => h.trim());
  const rows = await table
    .getByRole('row')
    .filter({ has: page.getByRole('cell') })
    .all();
  const records: Record<string, string>[] = [];
  for (const row of rows) {
    const cells = await row.getByRole('cell').allInnerTexts();
    records.push(Object.fromEntries(headers.map((header, i) => [header, cells[i] ?? ''])));
  }
  return records;
}

// Projects actual rows onto the expected table's columns, so a scenario only
// asserts the columns it lists (e.g. AT-45 skips Constraints).
async function expectRows(page: Page, expected: Record<string, string>[], pick: 'all' | 'last') {
  const columns = Object.keys(expected[0] ?? {});
  const project = (rows: Record<string, string>[]) =>
    rows.map((row) => Object.fromEntries(columns.map((c) => [c, normalize(row[c])])));

  await expect(async () => {
    const actual = await readFieldRows(page);
    const subject = pick === 'last' ? actual.slice(-1) : actual;
    expect(project(subject)).toEqual(project(expected));
  }).toPass();
}

function fieldRow(page: Page, label: string): Locator {
  return page
    .getByRole('row')
    .filter({ has: page.getByRole('cell', { name: label, exact: true }) });
}

Given('the mocked API has the following fields:', async ({ page }, dataTable: DataTable) => {
  const seed: FieldDefinitionResponse[] = dataTable.hashes().map((row, index) => ({
    id: `00000000-0000-0000-0000-${String(index + 1).padStart(12, '0')}`,
    fieldKey: row['Field key'],
    label: row.Label,
    type: row.Type as FieldDefinitionResponseType,
    required: normalize(row.Required) === 'yes',
    constraints: parseConstraints(row.Constraints ?? ''),
    displayOrder: index,
    createdAt: '2026-10-24T15:24:05.688011Z',
  }));
  await mockFieldApi(page, seed);
});

Given('the mocked API returns an error for creating a field', async ({ page }) => {
  await mockCreateFieldError(page);
});

Given('the mocked API returns {string} for updating a field', async ({ page }, error: string) => {
  if (error !== 'not found') {
    throw new Error(`Unsupported update error "${error}" — only "not found" is mocked.`);
  }
  await mockUpdateFieldNotFound(page);
});

Given('the mocked API returns an error for deleting a field', async ({ page }) => {
  await mockDeleteFieldError(page);
});

Then('I should see the following fields in order:', async ({ page }, dataTable: DataTable) => {
  await expectRows(page, dataTable.hashes(), 'all');
});

Then('the last field in the list should be:', async ({ page }, dataTable: DataTable) => {
  await expectRows(page, dataTable.hashes(), 'last');
});

Then(
  'the field {string} should have constraints {string}',
  async ({ page }, label: string, constraints: string) => {
    await expect(async () => {
      const row = (await readFieldRows(page)).find((r) => r.Label?.trim() === label);
      expect(row, `no field labelled "${label}" in the list`).toBeDefined();
      expect(parseConstraints(row?.Constraints ?? '')).toEqual(parseConstraints(constraints));
    }).toPass();
  },
);

Then('the field list should include a field labelled {string}', async ({ page }, label: string) => {
  await expect(fieldRow(page, label)).toBeVisible();
});

Then(
  'I should not see {string} or {string} actions for the field {string}',
  async ({ page }, first: string, second: string, label: string) => {
    const row = fieldRow(page, label);
    await expect(row).toBeVisible();
    await expect(row.getByRole('button', { name: first })).toHaveCount(0);
    await expect(row.getByRole('button', { name: second })).toHaveCount(0);
  },
);

Then('I should see the constraint inputs {string}', async ({ page }, inputs: string) => {
  const form = page.getByRole('form', { name: 'Add field' });
  const expected = inputs
    .split(',')
    .map((input) => input.trim())
    .filter(Boolean);
  for (const input of CONSTRAINT_INPUTS) {
    const control = form.getByLabel(input, { exact: true });
    if (expected.includes(input)) {
      await expect(control).toBeVisible();
    } else {
      await expect(control).toHaveCount(0);
    }
  }
});

Then('no field should have been created', async ({ page }) => {
  expect(getCreatedFields(page)).toHaveLength(0);
});

When('I click {string} for the field {string}', async ({ page }, action: string, label: string) => {
  await fieldRow(page, label).getByRole('button', { name: action }).click();
});

Then(
  'the {string} select should show {string} and be disabled',
  async ({ page }, name: string, value: string) => {
    const combobox = page.getByRole('combobox', { name });
    await expect(combobox).toBeDisabled();
    await expect(page.locator('.ant-select', { has: combobox })).toContainText(value);
  },
);

// The delete confirmation is the only dialog on the page (the add/edit forms
// are inline `role="form"`), so it can be targeted without a name.
When('I confirm the deletion', async ({ page }) => {
  await page.getByRole('dialog').getByRole('button', { name: 'Delete' }).click();
});

When('I cancel the deletion', async ({ page }) => {
  await page.getByRole('dialog').getByRole('button', { name: 'Cancel' }).click();
});
