import { expect } from '@playwright/test';
import { createBdd } from 'playwright-bdd';

const { Given, Then } = createBdd();

Given('the operating system prefers a dark color scheme', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
});

Given('the operating system prefers a light color scheme', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
});

Given('no theme preference has been saved', async ({ page }) => {
  await page.addInitScript(() => window.localStorage.removeItem('theme-storage'));
});

Given('a {string} theme preference has been saved', async ({ page }, theme: string) => {
  // Seed the persisted Zustand store before any app script runs, so the store
  // hydrates to this value and the bootstrap OS-preference check is skipped.
  await page.addInitScript((persisted: string) => {
    window.localStorage.setItem(
      'theme-storage',
      JSON.stringify({ state: { theme: persisted }, version: 0 }),
    );
  }, theme);
});

// Reads the background of an AntD Card (colorBgContainer), which the dark and
// light algorithms drive to opposite ends of the luminance range. Asserting on
// this - rather than a full-page screenshot - keeps the check deterministic and
// free of environment-specific snapshot baselines.
Then('the app should use the {string} theme', async ({ page }, theme: string) => {
  const card = page.locator('.ant-card').first();
  await expect(card).toBeVisible();

  const backgroundColor = await card.evaluate((el) => getComputedStyle(el).backgroundColor);
  const [r, g, b] = backgroundColor.match(/\d+(\.\d+)?/g)!.map(Number);
  const luminance = (r + g + b) / 3;

  if (theme === 'dark') {
    expect(luminance, `expected a dark card background, got ${backgroundColor}`).toBeLessThan(128);
  } else {
    expect(luminance, `expected a light card background, got ${backgroundColor}`).toBeGreaterThan(
      128,
    );
  }
});
