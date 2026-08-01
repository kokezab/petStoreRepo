import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App as AntApp } from 'antd';
import { afterEach, describe, expect, it } from 'vitest';

import { useAbilityStore } from '@/shared/lib/rbac';

import type { CodebookHooks, CodebookPermissions } from '../../core/types';
import { createWidgetHooks } from './hooks';
import { buildWidgetPermissions } from './permissions';
import { createWidgetStore, seedWidgets } from './store';
import type { Widget } from './types';
import { WidgetsCodebook } from './WidgetsCodebook';

function renderWidgets(hooks: CodebookHooks<Widget>, permissions: CodebookPermissions<Widget>) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <AntApp>
        <WidgetsCodebook hooks={hooks} permissions={permissions} />
      </AntApp>
    </QueryClientProvider>,
  );
}

const allowAll = buildWidgetPermissions({ can: () => true });

afterEach(() => {
  useAbilityStore.setState({ rules: {} });
});

describe('WidgetsCodebook fixture (test bed for codebook-page)', () => {
  it('client mode renders the list', async () => {
    renderWidgets(
      createWidgetHooks({ mode: 'client', store: createWidgetStore(seedWidgets) }),
      allowAll,
    );
    expect(await screen.findByText('Widget 01')).toBeInTheDocument();
  });

  it('server mode renders the list', async () => {
    renderWidgets(
      createWidgetHooks({ mode: 'server', store: createWidgetStore(seedWidgets) }),
      allowAll,
    );
    expect(await screen.findByText('Widget 01')).toBeInTheDocument();
  });

  it('shows a spinner while loading', async () => {
    const { container } = renderWidgets(
      createWidgetHooks({
        mode: 'client',
        store: createWidgetStore(seedWidgets),
        latencyMs: 100000,
      }),
      allowAll,
    );
    await waitFor(() => expect(container.querySelector('.ant-spin')).toBeTruthy());
  });

  it('renders the empty state for no rows', async () => {
    renderWidgets(createWidgetHooks({ mode: 'client', store: createWidgetStore([]) }), allowAll);
    // antd's Empty icon includes an SVG <title>No data</title> alongside the visible
    // description text, so a plain findByText('No data') is ambiguous — scope to the
    // description element.
    expect(
      await screen.findByText('No data', { selector: '.ant-empty-description' }),
    ).toBeInTheDocument();
  });

  // Documents current behavior: Root does not surface listQuery.isError, so a failed
  // list renders as the empty state, not an error UI. (Tracked follow-up.)
  it('a failed list renders as empty (Root does not surface isError)', async () => {
    renderWidgets(
      createWidgetHooks({ mode: 'client', store: createWidgetStore(seedWidgets), failList: true }),
      allowAll,
    );
    expect(
      await screen.findByText('No data', { selector: '.ant-empty-description' }),
    ).toBeInTheDocument();
  });

  it('create flow adds a row', async () => {
    const user = userEvent.setup();
    // Small seed so the appended row lands on page 1 (pageSize 10).
    renderWidgets(
      createWidgetHooks({ mode: 'client', store: createWidgetStore(seedWidgets.slice(0, 3)) }),
      allowAll,
    );
    await screen.findByText('Widget 01');

    await user.click(screen.getByRole('button', { name: /add/i }));
    // Plain getByLabelText('Name') is ambiguous: the sortable "Name" table column
    // header also carries aria-label="Name" (for keyboard sort affordance), and
    // getByLabelText's aria-label strategy matches that th too. Scoping to role
    // disambiguates against the table header (role="columnheader").
    await user.type(await screen.findByRole('textbox', { name: 'Name' }), 'Fresh Widget');
    await user.click(screen.getByRole('combobox', { name: 'Category' }));
    await user.click(await screen.findByTitle('Gadget'));
    // Same ambiguity as Name: the sortable "Quantity" column header has aria-label="Quantity".
    await user.type(screen.getByRole('spinbutton', { name: 'Quantity' }), '5');
    await user.click(screen.getByRole('switch'));
    await user.click(screen.getByRole('button', { name: 'OK' }));

    expect(await screen.findByText('Fresh Widget')).toBeInTheDocument();
  });

  it('edit flow updates a row', async () => {
    const user = userEvent.setup();
    renderWidgets(
      createWidgetHooks({ mode: 'client', store: createWidgetStore(seedWidgets) }),
      allowAll,
    );
    await screen.findByText('Widget 01');

    const editBtn = document.querySelector('.anticon-edit')?.closest('button');
    await user.click(editBtn as HTMLElement);
    const name = await screen.findByRole('textbox', { name: 'Name' });
    await user.clear(name);
    await user.type(name, 'Renamed 01');
    await user.click(screen.getByRole('button', { name: 'OK' }));

    expect(await screen.findByText('Renamed 01')).toBeInTheDocument();
  });

  it('delete flow removes a row', async () => {
    const user = userEvent.setup();
    renderWidgets(
      createWidgetHooks({ mode: 'client', store: createWidgetStore(seedWidgets) }),
      allowAll,
    );
    await screen.findByText('Widget 01');

    const delBtn = document.querySelector('.anticon-delete')?.closest('button');
    await user.click(delBtn as HTMLElement);
    // antd Popconfirm confirm button (default okText "OK") renders in a portal.
    const confirm = await screen.findByRole('button', { name: 'OK' });
    await user.click(confirm);

    await waitFor(() => expect(screen.queryByText('Widget 01')).not.toBeInTheDocument());
  });

  it('permission gating hides create and disables locked-row actions', async () => {
    renderWidgets(
      createWidgetHooks({ mode: 'client', store: createWidgetStore(seedWidgets) }),
      // create denied; update/delete allowed then status-locked for 'done' rows
      buildWidgetPermissions({ can: (action) => action !== 'create' }),
    );
    await screen.findByText('Widget 01');

    expect(screen.queryByRole('button', { name: /add/i })).not.toBeInTheDocument();
    const editButtons = Array.from(document.querySelectorAll('.anticon-edit')).map(
      (i) => i.closest('button') as HTMLButtonElement,
    );
    expect(editButtons.some((b) => b.disabled)).toBe(true);
  });
});
