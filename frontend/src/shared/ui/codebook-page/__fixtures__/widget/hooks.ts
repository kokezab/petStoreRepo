import { useMutation, useQuery, useQueryClient, type UseQueryResult } from '@tanstack/react-query';

import type { CodebookHooks, ListParams, Paginated } from '../../core/types';
import type { WidgetFormValues } from './schema';
import type { WidgetStore } from './store';
import type { Widget } from './types';

export const WIDGET_LIST_KEY = ['fixture-widgets'] as const;

export interface WidgetHooksConfig {
  mode: 'client' | 'server';
  store: WidgetStore;
  /** Artificial delay before the list resolves — used by the Loading story. */
  latencyMs?: number;
  /** Make useList reject — used by the ListError story. */
  failList?: boolean;
}

const wait = (ms?: number) => (ms ? new Promise((r) => setTimeout(r, ms)) : Promise.resolve());

function applyServerParams(rows: Widget[], params: ListParams): Paginated<Widget> {
  const out = [...rows];
  if (params.sortField) {
    const dir = params.sortOrder === 'descend' ? -1 : 1;
    const key = params.sortField as keyof Widget;
    out.sort((a, b) => (a[key] < b[key] ? -1 : a[key] > b[key] ? 1 : 0) * dir);
  }
  const total = out.length;
  const start = (params.page - 1) * params.pageSize;
  return { items: out.slice(start, start + params.pageSize), total };
}

export function createWidgetHooks(config: WidgetHooksConfig): CodebookHooks<Widget> {
  const { store, latencyMs, failList } = config;

  const useCreate = () => {
    const qc = useQueryClient();
    return useMutation({
      // Matches the real consumer convention (see entities/company/api): the
      // Codebook's create input is Partial<T>; cast to the fixture's form shape
      // at the boundary, exactly as company casts to CompanyInsertCommand.
      mutationFn: async (data: Partial<Widget>) => {
        await wait(latencyMs);
        return store.create(data as WidgetFormValues);
      },
      onSuccess: () => qc.invalidateQueries({ queryKey: WIDGET_LIST_KEY }),
    });
  };

  const useUpdate = () => {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: async ({ id, data }: { id: string | number; data: Partial<Widget> }) => {
        await wait(latencyMs);
        return store.update(Number(id), data);
      },
      onSuccess: () => qc.invalidateQueries({ queryKey: WIDGET_LIST_KEY }),
    });
  };

  const useDelete = () => {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: async (id: string | number) => {
        await wait(latencyMs);
        store.remove(Number(id));
      },
      onSuccess: () => qc.invalidateQueries({ queryKey: WIDGET_LIST_KEY }),
    });
  };

  const runList = async () => {
    await wait(latencyMs);
    if (failList) throw new Error('fixture: forced list failure');
    return store.list();
  };

  if (config.mode === 'client') {
    return {
      mode: 'client',
      useList: () =>
        useQuery({ queryKey: WIDGET_LIST_KEY, queryFn: runList }) as UseQueryResult<Widget[]>,
      useCreate,
      useUpdate,
      useDelete,
    };
  }

  return {
    mode: 'server',
    useList: (params: ListParams) =>
      useQuery({
        queryKey: [...WIDGET_LIST_KEY, params],
        queryFn: async () => applyServerParams(await runList(), params),
      }) as UseQueryResult<Paginated<Widget>>,
    useCreate,
    useUpdate,
    useDelete,
  };
}
