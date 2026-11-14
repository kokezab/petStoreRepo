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

/**
 * Types a time into an Antd TimePicker and confirms it with the dropdown's OK
 * button. Enter would also confirm, but it submits the surrounding form too.
 */
export async function pickAntdTime(scope: Locator, page: Page, label: string, time: string) {
  const input = scope.getByLabel(label, { exact: true });
  await input.click();
  await input.fill(time);
  const dropdown = page.locator('.ant-picker-dropdown:visible');
  await dropdown.getByRole('button', { name: 'OK' }).click();
  await expect(input).toHaveValue(time);
  // Wait out the close animation, or the next picker opened finds two
  // visible dropdowns.
  await expect(dropdown).toHaveCount(0);
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Typing into a picker that already holds a date (an edit form) leaves the
// calendar on that date's month, so the typed day may not be shown. Step the
// calendar with the month arrows until it shows the month of `value`.
async function showMonthOf(dropdown: Locator, value: string) {
  const [year, month] = value.split('-').map(Number);
  const target = year * 12 + (month - 1);
  const header = dropdown.locator('.ant-picker-header-view');
  for (let step = 0; step < 240; step++) {
    const shownYear = Number(
      await header.getByRole('button', { name: 'Choose a year' }).innerText(),
    );
    const shownMonth = MONTHS.indexOf(
      (await header.getByRole('button', { name: 'Choose a month' }).innerText()).trim(),
    );
    const shown = shownYear * 12 + shownMonth;
    if (shown === target) return;
    await dropdown
      .getByRole('button', { name: shown > target ? 'Previous month' : 'Next month' })
      .click();
    await expect(header).not.toHaveText(new RegExp(`${MONTHS[shownMonth]}\\s*${shownYear}`));
  }
  throw new Error(`Could not move the date picker to ${value}.`);
}

/**
 * Types a date (or date-time) into an Antd DatePicker and confirms it. Typed
 * text is not committed until confirmed: a DatePicker with showTime has an OK
 * button; a plain one commits by clicking the day cell, whose title is the
 * formatted date. Enter would also confirm, but it submits the form too.
 */
export async function pickAntdDate(scope: Locator, page: Page, label: string, value: string) {
  const input = scope.getByLabel(label, { exact: true });
  // An Antd Modal focuses itself when its opening animation ends, which blurs
  // the input and closes a picker opened before then. Wait for it to finish.
  await expect(page.locator('.ant-modal.ant-zoom-appear, .ant-modal.ant-zoom-enter')).toHaveCount(
    0,
  );
  await input.click();
  const dropdown = page.locator('.ant-picker-dropdown:visible');
  await expect(dropdown).toBeVisible();
  const ok = dropdown.getByRole('button', { name: 'OK' });
  // A plain picker that already holds a date (an edit form) doesn't follow
  // typed text: its calendar stays on (and snaps back to) the held date's
  // month. Leave the text alone and step the calendar to the day instead.
  const prefilled = (await ok.count()) === 0 && (await input.inputValue()) !== '';
  if (!prefilled) await input.fill(value);
  if ((await ok.count()) > 0) {
    await ok.click();
  } else {
    if (prefilled) await showMonthOf(dropdown, value);
    await dropdown.locator(`td[title="${value}"]`).click();
  }
  await expect(input).toHaveValue(value);
  // Wait out the close animation, as in pickAntdTime.
  await expect(dropdown).toHaveCount(0);
}
