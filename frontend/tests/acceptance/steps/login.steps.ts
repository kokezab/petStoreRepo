import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';

import { mockLoginError } from '../support/mock-api';

const { Given, When, Then } = createBdd();

Then(
  'validation errors are displayed next to the empty required fields \\(username, password)',
  async ({ page }) => {
    const form = page.getByRole('form', { name: 'Log in' });
    await expect(form.getByText('Username is required')).toBeVisible();
    await expect(form.getByText('Password is required')).toBeVisible();
  },
);

When('I submit the login form with valid credentials', async ({ page }) => {
  const form = page.getByRole('form', { name: 'Log in' });
  await form.getByRole('textbox', { name: 'Username' }).fill('username');
  await form.getByRole('textbox', { name: 'Password' }).fill('password');
  await form.getByRole('button', { name: 'Log in' }).click();
});

Given('the mocked API returns an authentication error for the login request', async ({ page }) => {
  await mockLoginError(page);
});

When('I submit the login form with invalid credentials', async ({ page }) => {
  const form = page.getByRole('form', { name: 'Log in' });
  await form.getByRole('textbox', { name: 'Username' }).fill('invalid-username');
  await form.getByRole('textbox', { name: 'Password' }).fill('invalid-password');
  await form.getByRole('button', { name: 'Log in' }).click();
});

Then('I should see an error message', async ({ page }) => {
  await expect(page.getByRole('alert')).toBeVisible();
});
