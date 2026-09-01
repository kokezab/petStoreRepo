import { expect, type Locator, type Page } from '@playwright/test';

export async function selectAntDesignOption(
  scope: Locator | Page,
  page: Page,
  selectName: string,
  optionValue: string,
): Promise<void> {
  const combobox = scope.getByRole('combobox', { name: selectName });
  await combobox.click();
  await expect(combobox).toHaveAttribute('aria-expanded', 'true');
  // Antd portals the dropdown to <body> and its role="option" nodes are in a
  // visually-hidden a11y list, so we must target the visible option items,
  // scoped to the currently open dropdown to disambiguate between Selects.
  const openDropdown = page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden)');
  await openDropdown.getByTitle(optionValue, { exact: true }).click();
  // Guard against Antd's open-animation swallowing the click: selecting an
  // option closes the dropdown, so still-expanded means the click missed.
  await expect(combobox).toHaveAttribute('aria-expanded', 'false');
}

export async function clearAntdDropdown(page: Page, name: string) {
  const select = page.locator('.ant-select', { has: page.getByRole('combobox', { name }) });
  await select.hover();
  await select.locator('.ant-select-clear').click();
}

// Feature tables name fields the way a person would ("First Name") or the way
// a DTO does ("firstName"). Antd's Form.Item label is the accessible name, so
// getByLabel needs the human form — normalize camelCase to spaced Title Case
// so either spelling in a .feature table resolves to the same control.
export function toLabel(field: string): string {
  return field.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, (c) => c.toUpperCase());
}
