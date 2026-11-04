import { expect } from '@playwright/test';
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
import { expectTableRows, readTableRows, rowWithCell } from '../support/table';

const { Given, When, Then } = createBdd();

// Every constraint input the form can render, by label. AT-44 asserts that
// exactly the ones for the selected type are present and the rest are absent.
const CONSTRAINT_INPUTS = [
  'Max length',
  'Minimum',
  'Maximum',
  'Earliest date',
  'Latest date',
  'Earliest date and time',
  'Latest date and time',
];

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
  await expectTableRows(page, dataTable.hashes(), 'all');
});

Then('the last field in the list should be:', async ({ page }, dataTable: DataTable) => {
  await expectTableRows(page, dataTable.hashes(), 'last');
});

Then(
  'the field {string} should have constraints {string}',
  async ({ page }, label: string, constraints: string) => {
    await expect(async () => {
      const row = (await readTableRows(page)).find((r) => r.Label?.trim() === label);
      expect(row, `no field labelled "${label}" in the list`).toBeDefined();
      expect(parseConstraints(row?.Constraints ?? '')).toEqual(parseConstraints(constraints));
    }).toPass();
  },
);

Then('the field list should include a field labelled {string}', async ({ page }, label: string) => {
  await expect(rowWithCell(page, label)).toBeVisible();
});

Then(
  'I should not see {string} or {string} actions for the field {string}',
  async ({ page }, first: string, second: string, label: string) => {
    const row = rowWithCell(page, label);
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
  await rowWithCell(page, label).getByRole('button', { name: action }).click();
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
