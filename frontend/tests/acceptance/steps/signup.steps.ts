import { expect } from '@playwright/test';
import { createBdd, DataTable } from 'playwright-bdd';
const { Then } = createBdd();

Then('I should see a {string} form', async ({ page }, name: string) => {
  await expect(page.getByRole('form', { name })).toBeVisible();
});

function toLabel(field: string): string {
  return field
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/^./, (c) => c.toUpperCase());
}

Then('the form should have the following fields:', async ({ page }, dataTable: DataTable) => {
  const form = page.getByRole('form', { name: 'Sign Up' });

  for (const { Field, Type } of dataTable.hashes()) {
    const field = form.getByLabel(toLabel(Field));

    await expect(field).toBeVisible();
    await expect(field).toHaveAttribute('type', Type);
  }
});
