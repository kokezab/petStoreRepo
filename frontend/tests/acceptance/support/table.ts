import { expect, type Locator, type Page } from '@playwright/test';

function normalize(value: string | undefined): string {
  return (value ?? '').trim().toLowerCase();
}

// Reads the page's Antd table into one record per data row, keyed by column
// header, so assertions can name columns the way the feature tables do.
export async function readTableRows(page: Page): Promise<Record<string, string>[]> {
  const table = page.getByRole('table');
  const headers = (await table.getByRole('columnheader').allInnerTexts()).map((h) => h.trim());
  const rows = await table
    .getByRole('row')
    .filter({ has: page.getByRole('cell') })
    .all();
  const records: Record<string, string>[] = [];
  for (const row of rows) {
    const cells = await row.getByRole('cell').allInnerTexts();
    records.push(Object.fromEntries(headers.map((header, i) => [header, cells[i] ?? ''])));
  }
  return records;
}

// Projects actual rows onto the expected table's columns, so a scenario only
// asserts the columns it lists. Comparison is trimmed and case-insensitive.
export async function expectTableRows(
  page: Page,
  expected: Record<string, string>[],
  pick: 'all' | 'last',
): Promise<void> {
  const columns = Object.keys(expected[0] ?? {});
  const project = (rows: Record<string, string>[]) =>
    rows.map((row) => Object.fromEntries(columns.map((c) => [c, normalize(row[c])])));

  await expect(async () => {
    const actual = await readTableRows(page);
    const subject = pick === 'last' ? actual.slice(-1) : actual;
    expect(project(subject)).toEqual(project(expected));
  }).toPass();
}

/** The table row that has a cell whose text is exactly `text`. */
export function rowWithCell(page: Page, text: string): Locator {
  return page.getByRole('row').filter({ has: page.getByRole('cell', { name: text, exact: true }) });
}
