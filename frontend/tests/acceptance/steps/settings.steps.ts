import { expect } from "@playwright/test";
import { createBdd } from "playwright-bdd";

const { Then, When } = createBdd();

Then('I should see {string} and {string} labels', async ({ page }, darkModeLabel: string, languageLabel: string) => {
  await expect(page.getByText(darkModeLabel)).toBeVisible();
  await expect(page.getByText(languageLabel)).toBeVisible();
});

When('I click on dark mode toggle', async ({ page }) => {  
  await page.getByRole('button', { name: 'dark mode' }).click();  
});
