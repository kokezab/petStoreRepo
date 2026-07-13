import type { Locator, Page } from '@playwright/test';

export async function selectAntDesignOption(
  dialog: Locator,
  page: Page,
  selectName: string,
  optionValue: string,
): Promise<void> {
  const selectControl = dialog.getByRole('combobox', { name: selectName });
  await selectControl.click();
  await page.locator('.ant-select-item', { hasText: optionValue }).click();
}
