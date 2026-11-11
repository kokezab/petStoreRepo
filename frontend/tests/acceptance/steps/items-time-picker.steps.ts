import { expect, type Page } from '@playwright/test';
import { createBdd } from 'playwright-bdd';

import { getCreatedItems, mockItemApi } from '../support/mock-api';
import { pickAntdTime } from '../support/playwright-helpers';

const { Before, When, Then } = createBdd();

const FEATURE_TITLE = 'Time picker for TIME fields';

// This feature's Background seeds fields only, so the items API has to be
// mocked (with no items) before the page loads. The tag is shared with
// items-management.feature, which mocks items itself, hence the title check.
Before({ tags: '@items-management' }, async ({ page, $testInfo }) => {
  if (!$testInfo.titlePath.includes(FEATURE_TITLE)) return;
  await mockItemApi(page, []);
});

// The Antd picker's wrapper (`.ant-picker`) around the labelled input. It
// holds the clear button.
function pickerFor(page: Page, label: string) {
  return page.locator('.ant-picker', { has: page.getByLabel(label, { exact: true }) });
}

// The picker dropdown is portalled to <body>, and only the open one is visible.
function openDropdown(page: Page) {
  return page.locator('.ant-picker-dropdown:visible');
}

// Antd renders footer options like "Now" as an <a> without href, so they have
// no link or button role. Find them by text inside the open dropdown.
function dropdownOption(page: Page, name: string) {
  return openDropdown(page).locator('.ant-picker-footer').getByText(name, { exact: true });
}

function secondsOfDay(time: string): number {
  const [hours, minutes, seconds] = time.split(':').map(Number);
  return hours * 3600 + minutes * 60 + seconds;
}

When('I open the {string} time picker', async ({ page }, label: string) => {
  await page.getByLabel(label, { exact: true }).click();
  await expect(openDropdown(page)).toBeVisible();
});

Then('I should see hour, minute and second columns', async ({ page }) => {
  const columns = openDropdown(page).locator('.ant-picker-time-panel-column');
  await expect(columns).toHaveCount(3);
  for (const type of ['hour', 'minute', 'second']) {
    await expect(columns.and(page.locator(`[data-type="${type}"]`))).toHaveCount(1);
  }
});

Then('the time picker should offer a {string} option', async ({ page }, name: string) => {
  await expect(dropdownOption(page, name)).toBeVisible();
});

When('I choose {string} in the time picker', async ({ page }, name: string) => {
  await dropdownOption(page, name).click();
});

Then(
  'the {string} field should contain the current time as {string}',
  async ({ page }, label: string, format: string) => {
    if (format !== 'HH:mm:ss') {
      throw new Error(`Unsupported time format "${format}": only "HH:mm:ss" is checked.`);
    }
    const input = page.getByLabel(label, { exact: true });
    await expect(input).toHaveValue(/^\d{2}:\d{2}:\d{2}$/);

    const value = await input.inputValue();
    const now = new Date();
    const nowSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
    // Allow for the time the steps took, and for the clock passing midnight.
    const diff = Math.abs(nowSeconds - secondsOfDay(value));
    expect(Math.min(diff, 86400 - diff)).toBeLessThanOrEqual(60);
  },
);

When(
  'I pick {string} in the {string} time picker',
  async ({ page }, time: string, label: string) => {
    await pickAntdTime(page.locator('body'), page, label, time);
  },
);

// Antd renders the clear button only when `allowClear` is on and there is a
// value. It stays transparent until hovered, so check that it exists rather
// than that it is visible.
Then('the {string} field should offer a clear button', async ({ page }, label: string) => {
  await expect(pickerFor(page, label).locator('.ant-picker-clear')).toHaveCount(1);
});

Then('the {string} field should not offer a clear button', async ({ page }, label: string) => {
  await expect(pickerFor(page, label)).toBeVisible();
  await expect(pickerFor(page, label).locator('.ant-picker-clear')).toHaveCount(0);
});

When('I fill in {string} with {string}', async ({ page }, label: string, value: string) => {
  await page.getByLabel(label, { exact: true }).fill(value);
});

Then(
  'the item {string} should be created with {string} set to {string}',
  async ({ page }, name: string, fieldKey: string, value: string) => {
    await expect
      .poll(() => getCreatedItems(page).find((item) => item.name === name)?.customValues)
      .toMatchObject({ [fieldKey]: value });
  },
);
