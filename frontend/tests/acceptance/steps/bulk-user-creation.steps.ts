import { expect, type Locator } from '@playwright/test';
import { createBdd, DataTable } from 'playwright-bdd';

import { mockCreateUsersError } from '../support/mock-api';
import { toLabel } from '../support/playwright-helpers';

const { Given, When, Then } = createBdd();

const FORM_NAME = 'Add users';

function form(page: import('@playwright/test').Page): Locator {
  return page.getByRole('form', { name: FORM_NAME });
}

function userEntries(page: import('@playwright/test').Page): Locator {
  // Each user entry is a <fieldset aria-label="User N"> → role "group".
  return form(page).getByRole('group');
}

async function fillEntry(
  entry: Locator,
  values: {
    username: string;
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone: string;
  },
): Promise<void> {
  await entry.getByLabel('Username').fill(values.username);
  await entry.getByLabel('First Name').fill(values.firstName);
  await entry.getByLabel('Last Name').fill(values.lastName);
  await entry.getByLabel('Email').fill(values.email);
  await entry.getByLabel('Password').fill(values.password);
  await entry.getByLabel('Phone').fill(values.phone);
}

Given('the mocked API returns an error for creating users', async ({ page }) => {
  await mockCreateUsersError(page);
});

Then('the form should start with exactly one user entry', async ({ page }) => {
  await expect(userEntries(page)).toHaveCount(1);
});

Then('a user entry should have the following fields:', async ({ page }, dataTable: DataTable) => {
  const entry = userEntries(page).first();

  for (const { Field, Type, Required } of dataTable.hashes()) {
    const field = entry.getByLabel(toLabel(Field));
    await expect(field).toBeVisible();
    await expect(field).toHaveAttribute('type', Type);
    // All fields are optional — no `required` attribute is set on any input.
    if (Required === 'no') {
      await expect(field).not.toHaveAttribute('required', '');
    }
  }
});

When('I click the {string} button to add a user entry', async ({ page }, symbol: string) => {
  await form(page).getByRole('button', { name: symbol }).click();
});

Then('the form should have {int} user entries', async ({ page }, count: number) => {
  await expect(userEntries(page)).toHaveCount(count);
});

Then('the form should have {int} user entry', async ({ page }, count: number) => {
  await expect(userEntries(page)).toHaveCount(count);
});

Given('the form has {int} user entries', async ({ page }, count: number) => {
  const addButton = form(page).getByRole('button', { name: '+' });
  while ((await userEntries(page).count()) < count) {
    await addButton.click();
  }
  await expect(userEntries(page)).toHaveCount(count);
});

Given('the form has exactly one user entry', async ({ page }) => {
  await expect(userEntries(page)).toHaveCount(1);
});

When('I click the {string} button on the second user entry', async ({ page }, symbol: string) => {
  await form(page).getByRole('button', { name: symbol }).nth(1).click();
});

Then(
  'the {string} remove button on the last user entry should be disabled',
  async ({ page }, symbol: string) => {
    await expect(form(page).getByRole('button', { name: symbol }).last()).toBeDisabled();
  },
);

Then('I should not be able to remove the last user entry', async ({ page }) => {
  await expect(form(page).getByRole('button', { name: '-' }).last()).toBeDisabled();
  await expect(userEntries(page)).toHaveCount(1);
});

Given(
  'I fill in the first user entry with username {string}, firstName {string}, lastName {string}, email {string}, password {string}, phone {string}',
  async ({ page }, username, firstName, lastName, email, password, phone) => {
    await fillEntry(userEntries(page).nth(0), {
      username,
      firstName,
      lastName,
      email,
      password,
      phone,
    });
  },
);

Given(
  'I fill in the second user entry with username {string}, firstName {string}, lastName {string}, email {string}, password {string}, phone {string}',
  async ({ page }, username, firstName, lastName, email, password, phone) => {
    await fillEntry(userEntries(page).nth(1), {
      username,
      firstName,
      lastName,
      email,
      password,
      phone,
    });
  },
);

When('I submit the bulk user creation form', async ({ page }) => {
  await form(page).getByRole('button', { name: 'Create users' }).click();
});

Then('the user list should include a user named {string}', async ({ page }, name: string) => {
  await expect(
    page.getByRole('list', { name: 'Users' }).getByText(name, { exact: true }),
  ).toBeVisible();
});

Then('the {string} form should still be visible', async ({ page }, name: string) => {
  await expect(page.getByRole('form', { name })).toBeVisible();
});

Then('the form should have exactly one user entry', async ({ page }) => {
  await expect(userEntries(page)).toHaveCount(1);
});

Then('the first user entry fields should all be empty', async ({ page }) => {
  const entry = userEntries(page).first();
  await expect(entry.getByLabel('Username')).toHaveValue('');
  await expect(entry.getByLabel('First Name')).toHaveValue('');
  await expect(entry.getByLabel('Last Name')).toHaveValue('');
  await expect(entry.getByLabel('Email')).toHaveValue('');
  await expect(entry.getByLabel('Password')).toHaveValue('');
  await expect(entry.getByLabel('Phone')).toHaveValue('');
});

Then(
  'the first user entry should still contain username {string}, firstName {string}, lastName {string}, email {string}, password {string}, phone {string}',
  async ({ page }, username, firstName, lastName, email, password, phone) => {
    const entry = userEntries(page).first();
    await expect(entry.getByLabel('Username')).toHaveValue(username);
    await expect(entry.getByLabel('First Name')).toHaveValue(firstName);
    await expect(entry.getByLabel('Last Name')).toHaveValue(lastName);
    await expect(entry.getByLabel('Email')).toHaveValue(email);
    await expect(entry.getByLabel('Password')).toHaveValue(password);
    await expect(entry.getByLabel('Phone')).toHaveValue(phone);
  },
);
