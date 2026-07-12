import { createBdd } from "playwright-bdd";

const { When } = createBdd();

When('I click on dark mode toggle', async ({ page }) => {  
  await page.getByRole('button', { name: 'dark mode' }).click();  
});
