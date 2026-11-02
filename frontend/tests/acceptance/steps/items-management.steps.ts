import { expect } from '@playwright/test';
import { createBdd, DataTable } from 'playwright-bdd';

import type { FieldDefinitionResponse } from '@/shared/api/generated/zerocode/models/fieldDefinitionResponse';
import type { FieldDefinitionResponseType } from '@/shared/api/generated/zerocode/models/fieldDefinitionResponseType';
import type { ItemResponse } from '@/shared/api/generated/zerocode/models/itemResponse';

import {
  addMockField,
  getActiveMockFields,
  getCreatedItems,
  mockCreateItemError,
  mockCreateItemFieldErrors,
  mockDeleteItemError,
  mockItemApi,
  mockUpdateItemNotFound,
  setMockItemValue,
} from '../support/mock-api';
import { expectTableRows, rowWithCell } from '../support/table';

const { Given, When, Then } = createBdd();

// Feature tables write custom values as text, under the field's label. Turn
// one into the JSON value the backend stores for that field's type.
function toCustomValue(field: FieldDefinitionResponse, text: string): unknown {
  switch (field.type) {
    case 'NUMBER':
      return Number(text);
    case 'BOOLEAN':
      return text.trim().toLowerCase() === 'yes';
    default:
      return text;
  }
}

Given('the mocked API has the following items:', async ({ page }, dataTable: DataTable) => {
  // Columns other than Name/Description are custom fields, named by label, so
  // "the mocked API has the following fields:" must run first.
  const fields = getActiveMockFields(page);
  const seed: ItemResponse[] = dataTable.hashes().map((row, index) => {
    const { Name: name, Description: description, ...values } = row;
    const customValues: Record<string, unknown> = {};
    for (const [label, text] of Object.entries(values)) {
      if (!text.trim()) continue;
      const field = fields.find((f) => f.label === label);
      if (!field?.fieldKey) {
        throw new Error(`Item column "${label}" doesn't match a mocked field label.`);
      }
      customValues[field.fieldKey] = toCustomValue(field, text);
    }
    return {
      id: `10000000-0000-0000-0000-${String(index + 1).padStart(12, '0')}`,
      name,
      description: description || undefined,
      customValues,
      createdAt: '2026-10-24T15:24:05.688011Z',
      updatedAt: '2026-10-24T15:24:05.688011Z',
    };
  });
  await mockItemApi(page, seed);
});

Given(
  'the mocked API also has an optional {string} field labelled {string}',
  async ({ page }, type: string, label: string) => {
    addMockField(page, {
      fieldKey: label.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
      label,
      type: type as FieldDefinitionResponseType,
      required: false,
      constraints: {},
    });
  },
);

Given(
  'the item {string} also has the value {string} for the deleted field {string}',
  async ({ page }, name: string, value: string, fieldKey: string) => {
    if (getActiveMockFields(page).some((field) => field.fieldKey === fieldKey)) {
      throw new Error(`"${fieldKey}" is an active mocked field, not a deleted one.`);
    }
    setMockItemValue(page, name, fieldKey, value);
  },
);

Given('the mocked API returns an error for creating an item', async ({ page }) => {
  await mockCreateItemError(page);
});

Given(
  'the mocked API rejects creating an item with the field errors:',
  async ({ page }, dataTable: DataTable) => {
    const errors = Object.fromEntries(
      dataTable.hashes().map((row) => [row['Field key'], row.Message]),
    );
    await mockCreateItemFieldErrors(page, errors);
  },
);

Given('the mocked API returns {string} for updating an item', async ({ page }, error: string) => {
  if (error !== 'not found') {
    throw new Error(`Unsupported update error "${error}": only "not found" is mocked.`);
  }
  await mockUpdateItemNotFound(page);
});

Given('the mocked API returns an error for deleting an item', async ({ page }) => {
  await mockDeleteItemError(page);
});

When('I click {string} for the item {string}', async ({ page }, action: string, name: string) => {
  await rowWithCell(page, name).getByRole('button', { name: action }).click();
});

Then('I should see the following items in order:', async ({ page }, dataTable: DataTable) => {
  await expectTableRows(page, dataTable.hashes(), 'all');
});

Then('the last item in the list should be:', async ({ page }, dataTable: DataTable) => {
  await expectTableRows(page, dataTable.hashes(), 'last');
});

Then('the item list should include an item named {string}', async ({ page }, name: string) => {
  await expect(rowWithCell(page, name)).toBeVisible();
});

Then(
  'I should not see {string} or {string} actions for the item {string}',
  async ({ page }, first: string, second: string, name: string) => {
    const row = rowWithCell(page, name);
    await expect(row).toBeVisible();
    await expect(row.getByRole('button', { name: first })).toHaveCount(0);
    await expect(row.getByRole('button', { name: second })).toHaveCount(0);
  },
);

// Asserts the form's labelled inputs, in order. Antd draws the required "*"
// with CSS, so it isn't part of the label text.
Then(
  'the {string} form should have the inputs {string}',
  async ({ page }, name: string, inputs: string) => {
    const expected = inputs
      .split(',')
      .map((input) => input.trim())
      .filter(Boolean);
    const labels = page.getByRole('form', { name }).locator('.ant-form-item-label label');
    await expect(labels).toHaveText(expected);
  },
);

// The error Antd Form renders under the Form.Item that holds this input,
// whether it came from a client-side rule or from the API's `errors` map.
Then(
  'the {string} input should show the error {string}',
  async ({ page }, label: string, message: string) => {
    const input = page.getByLabel(label, { exact: true });
    const formItem = page.locator('.ant-form-item', { has: input });
    await expect(formItem.locator('.ant-form-item-explain-error')).toHaveText(message);
  },
);

Then('no item should have been created', async ({ page }) => {
  expect(getCreatedItems(page)).toHaveLength(0);
});
