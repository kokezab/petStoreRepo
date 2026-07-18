import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';

const { When, Then } = createBdd();

When('I click on dark mode toggle', async ({ page }) => {
  await page.getByRole('switch').click();
});

Then('the page should visually match the {string} theme', async ({ page }, theme: string) => {
  // Wait for AntD's ConfigProvider to finish re-rendering with the new
  // algorithm (darkAlgorithm/defaultAlgorithm) before snapshotting, otherwise
  // this can race and capture a stale frame mid-transition.
  await page.waitForTimeout(100);
  await expect(page).toHaveScreenshot(`settings-${theme}-theme.png`, {
    fullPage: true,
  });
});
