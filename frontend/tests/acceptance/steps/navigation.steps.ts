import { createBdd } from 'playwright-bdd';

const { When } = createBdd();

When('I click the {string} nav link', async ({ page }, name: string) => {
  await page.getByRole('navigation').getByRole('link', { name }).click();
});
