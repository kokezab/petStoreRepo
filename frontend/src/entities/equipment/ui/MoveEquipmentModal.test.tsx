import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App as AntApp } from 'antd';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { Equipment } from '../model/types';
import { MoveEquipmentModal } from './MoveEquipmentModal';

const mutateAsync = vi.fn().mockResolvedValue(undefined);

// Move is a standalone hook (not part of the CodebookHooks contract); stub it so
// the test asserts the exact { id, parentId } payload the modal builds.
vi.mock('../api', () => ({
  useMoveEquipment: () => ({ mutateAsync, isPending: false }),
}));

// The parent options come from the cached equipment list query — stub it with a
// small fixture (the mock ignores query options, so pass already-normalized rows).
const listData: Equipment[] = [
  { id: 1, name: 'Router', code: 100, active: true },
  { id: 2, name: 'Switch', code: 200, active: true },
];
vi.mock('@/api/generated/tracer/equipment-query-controller/equipment-query-controller', () => ({
  useGetEquipment: () => ({ data: listData, isFetching: false }),
}));

function renderModal(record: Equipment | null, onClose = vi.fn()) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={qc}>
      <AntApp>
        <MoveEquipmentModal record={record} onClose={onClose} />
      </AntApp>
    </QueryClientProvider>,
  );
  return { onClose };
}

afterEach(() => {
  mutateAsync.mockClear();
});

describe('MoveEquipmentModal', () => {
  it('offers other equipment as parents but excludes the record itself', async () => {
    const user = userEvent.setup();
    renderModal({ id: 1, name: 'Router', code: 100, active: true });

    await user.click(screen.getByRole('combobox'));
    expect(await screen.findByTitle('Switch')).toBeInTheDocument();
    // The record being moved ("Router") must not be selectable as its own parent.
    expect(screen.queryByTitle('Router')).not.toBeInTheDocument();
  });

  it('moves to the root when "No parent" is chosen (sends parentId: undefined)', async () => {
    const user = userEvent.setup();
    const { onClose } = renderModal({
      id: 1,
      name: 'Router',
      code: 100,
      active: true,
      parentId: 2,
    });

    await user.click(screen.getByRole('combobox'));
    await user.click(await screen.findByTitle('No parent (root)'));
    await user.click(screen.getByRole('button', { name: 'OK' }));

    await waitFor(() => expect(mutateAsync).toHaveBeenCalledWith({ id: 1, parentId: undefined }));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it('sends the selected parent id when a parent is chosen', async () => {
    const user = userEvent.setup();
    renderModal({ id: 1, name: 'Router', code: 100, active: true });

    await user.click(screen.getByRole('combobox'));
    await user.click(await screen.findByTitle('Switch'));
    await user.click(screen.getByRole('button', { name: 'OK' }));

    await waitFor(() => expect(mutateAsync).toHaveBeenCalledWith({ id: 1, parentId: 2 }));
  });
});
