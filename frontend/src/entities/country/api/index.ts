import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { CodebookHooksServer, ListParams, Paginated } from '@/shared/ui/codebook-page';

import type { Country } from '../model/types';

// ============================================================================
// FAKE IN-MEMORY BACKEND — for demo purposes only.
// Delete this block and replace the hooks below with your orval-generated
// hooks (useGetCountries / useCreateCountry / useUpdateCountry / useDeleteCountry).
// If orval's mutation param shape differs (e.g. { countryId, updateCountryDto }
// instead of { id, data }), adapt it inside the hook wrappers below — that's
// the ONLY place the mismatch needs to be handled.
// ============================================================================
let db: Country[] = [
  { id: '1', name: 'Bosnia and Herzegovina', code: 'BIH', status: 'active' },
  { id: '2', name: 'Serbia', code: 'SRB', status: 'active' },
  { id: '3', name: 'Croatia', code: 'HRV', status: 'done' },
  { id: '4', name: 'Slovenia', code: 'SVN', status: 'draft' },
];

function delay<T>(value: T, ms = 300): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

async function fetchCountries(params: ListParams): Promise<Paginated<Country>> {
  let items = [...db];

  if (params.sortField) {
    const key = params.sortField as keyof Country;
    items.sort((a, b) => {
      const dir = params.sortOrder === 'descend' ? -1 : 1;
      return a[key] > b[key] ? dir : -dir;
    });
  }

  const total = items.length;
  const start = (params.page - 1) * params.pageSize;
  items = items.slice(start, start + params.pageSize);

  return delay({ items, total });
}

async function createCountry(data: Partial<Country>): Promise<Country> {
  const record: Country = {
    id: String(Date.now()),
    status: 'draft',
    name: '',
    code: '',
    ...data,
  } as Country;
  db.push(record);
  return delay(record);
}

async function updateCountry(id: string | number, data: Partial<Country>): Promise<Country> {
  db = db.map((c) => (c.id === id ? { ...c, ...data } : c));
  return delay(db.find((c) => c.id === id)!);
}

async function deleteCountry(id: string | number): Promise<void> {
  db = db.filter((c) => c.id !== id);
  return delay(undefined);
}
// ============================================================================
// END FAKE BACKEND
// ============================================================================

const QUERY_KEY = ['countries'];

export const countryHooksServer: CodebookHooksServer<Country> = {
  mode: 'server',
  useList: (params) =>
    useQuery({
      queryKey: [...QUERY_KEY, params],
      queryFn: () => fetchCountries(params),
    }),
  useCreate: () => {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: createCountry,
      onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
    });
  },
  useUpdate: () => {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: ({ id, data }: { id: string | number; data: Partial<Country> }) =>
        updateCountry(id, data),
      onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
    });
  },
  useDelete: () => {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: deleteCountry,
      onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
    });
  },
};
