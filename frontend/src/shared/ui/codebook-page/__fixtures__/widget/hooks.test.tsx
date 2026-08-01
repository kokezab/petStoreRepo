import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';

import { createWidgetHooks } from './hooks';
import { createWidgetStore } from './store';
import type { Widget } from './types';

const rows: Widget[] = [
  { id: 1, name: 'Alpha', category: 'gadget', quantity: 2, active: true, status: 'active' },
];

function wrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

describe('createWidgetHooks (client mode)', () => {
  it('useList resolves the store rows', async () => {
    const hooks = createWidgetHooks({ mode: 'client', store: createWidgetStore(rows) });
    if (hooks.mode !== 'client') throw new Error('expected client mode');
    const { result } = renderHook(() => hooks.useList(), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.data).toHaveLength(1));
    expect(result.current.data?.[0].name).toBe('Alpha');
  });

  it('useList surfaces an error when failList is set', async () => {
    const hooks = createWidgetHooks({
      mode: 'client',
      store: createWidgetStore(rows),
      failList: true,
    });
    if (hooks.mode !== 'client') throw new Error('expected client mode');
    const { result } = renderHook(() => hooks.useList(), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it('useCreate invalidates the list so useList refetches with the new row', async () => {
    const hooks = createWidgetHooks({ mode: 'client', store: createWidgetStore(rows) });
    if (hooks.mode !== 'client') throw new Error('expected client mode');
    const { result } = renderHook(() => ({ list: hooks.useList(), create: hooks.useCreate() }), {
      wrapper: wrapper(),
    });
    await waitFor(() => expect(result.current.list.data).toHaveLength(1));
    await act(async () => {
      await result.current.create.mutateAsync({
        name: 'New',
        category: 'gadget',
        quantity: 1,
        active: true,
      });
    });
    await waitFor(() => expect(result.current.list.data).toHaveLength(2));
  });
});

describe('createWidgetHooks (server mode)', () => {
  it('useList paginates in-memory', async () => {
    const many: Widget[] = Array.from({ length: 15 }, (_, i) => ({
      id: i + 1,
      name: `W${i}`,
      category: 'gadget',
      quantity: i,
      active: true,
      status: 'active',
    }));
    const hooks = createWidgetHooks({ mode: 'server', store: createWidgetStore(many) });
    if (hooks.mode !== 'server') throw new Error('expected server mode');
    const { result } = renderHook(() => hooks.useList({ page: 1, pageSize: 10 }), {
      wrapper: wrapper(),
    });
    await waitFor(() => expect(result.current.data?.total).toBe(15));
    expect(result.current.data?.items).toHaveLength(10);
  });
});
