import { test } from '@e2e-dev/web';
import { expect } from 'e2e';

test('app opens', async ({ app, browser }) => {
  await app.open('/');
  await expect(browser.locator('body')).toBeVisible();
});

test('there is Add field button', async ({ app, agent, browser }) => {
  await app.open('/zerocode/fields');
  await expect(browser.locator('table')).toBeVisible();

  await agent.assert('there is Add field button');
});

test('adds a field', async ({ app, agent }) => {
  await app.open('/zerocode/fields');

  await agent.act('add field labeled "Water plants" with type "TEXT"');

  // await agent.assert('the table has "Water plants"');
  await expect(screen.getByText('Water plants')).toBeVisible();
});

test('deletes a field', async ({ app, agent }) => {
  await app.open('/zerocode/fields');

  await agent.act('delete field labeled "Water plants"');
  await agent.assert('the list does not show "Water plants"');
});
