import { expect } from 'playwright/test';
import { createBdd } from 'playwright-bdd';
const { Then } = createBdd();

Then(
  'the organizational unit list should include an organizational unit named {string}',
  async ({ page }, name: string) => {
    await expect(page.getByText(name)).toBeVisible();
  },
);
