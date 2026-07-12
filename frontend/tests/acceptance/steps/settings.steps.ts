import { expect } from "@playwright/test";
import { createBdd } from "playwright-bdd";

const { Then, When } = createBdd();

When('I click on dark mode toggle', async ({ page }) => {  
  await page.getByRole('button', { name: 'dark mode' }).click();  
});
