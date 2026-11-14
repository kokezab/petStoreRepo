import { expect, type Page } from '@playwright/test';
import { createBdd } from 'playwright-bdd';

const { Given, Then } = createBdd();

// Antd notifications are portalled to <body>, one `.ant-notification-notice`
// each, with the title and description as visible text.
function notifications(page: Page) {
  return page.locator('.ant-notification-notice');
}

// Freeze the browser's "today" so past/future dates in the feature never go
// stale. Noon local time keeps the date stable whatever the timezone offset.
// Timers keep running, so Antd animations and notification timeouts still work.
Given('today is {string}', async ({ page }, date: string) => {
  const [year, month, day] = date.split('-').map(Number);
  await page.clock.setFixedTime(new Date(year, month - 1, day, 12, 0, 0));
});

Then(
  'I should see a notification {string} with {string}',
  async ({ page }, title: string, description: string) => {
    const notice = notifications(page).filter({ hasText: title });
    await expect(notice).toBeVisible();
    await expect(notice).toContainText(description);
  },
);

// A notification would appear right after the save (or the page load) the
// previous step waited for. Give it a moment to render before asserting there
// is none, otherwise an absent check passes before it could have shown up.
Then('I should not see any notification', async ({ page }) => {
  await page.waitForTimeout(1000);
  await expect(notifications(page)).toHaveCount(0);
});
