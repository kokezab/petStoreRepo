import { useMutation, useQueryClient, type UseQueryResult } from '@tanstack/react-query';

import {
  createCompany,
  deleteCompany,
  updateCompany,
} from '@/api/generated/tracer/company-command-controller/company-command-controller';
import {
  getGetCompaniesQueryKey,
  useGetCompanies,
} from '@/api/generated/tracer/company-query-controller/company-query-controller';
import type {
  CompanyInsertCommand,
  CompanyUpdateCommand,
  GetCompaniesParams,
} from '@/api/generated/tracer/models';
import { tracerRequest } from '@/shared/api';
import type { CodebookHooksServer, ListParams, Paginated } from '@/shared/ui/codebook-page';

import type { Company } from '../model/types';
import { normalizeCompany } from './normalizeCompany';

// `/v1/companies` pages/sorts/filters on the server, so this codebook runs in
// `server` mode. Two shape mismatches are adapted here — and nowhere else —
// per the convention (see entities/equipment/api):
//   - the Codebook's ListParams (1-based page, antd sort tokens) → Spring's
//     Pageable (0-based page, `field,dir` sort strings);
//   - PageableResponseCompanyResponse ({ data, totalElements }) → Paginated<Company>.
//   - create/update return void, delete is by id — the Codebook expects the
//     entity/void shapes below, so the wrappers reconstruct them.

// Invalidating the bare list key prefix-matches every `['/v1/companies', params]`
// cache entry, so any page/sort refetches after a mutation.
const LIST_KEY = getGetCompaniesQueryKey();

function toGetCompaniesParams(params: ListParams): GetCompaniesParams {
  // Spring's Pageable resolver binds FLAT query params (`page`/`size`/`sort`), but
  // the OpenAPI spec models Pageable as a nested object — so orval types it as
  // `{ pageable: Pageable }`. Passing it nested serializes to
  // `pageable[page]=0&pageable[sort]=name,asc`, which Spring silently ignores.
  // Emit the flat shape it actually reads: `?page=0&size=10&sort=name,asc`.
  const flat: Record<string, string | number> = {
    page: params.page - 1, // Codebook is 1-based; Spring Pageable is 0-based.
    size: params.pageSize,
  };
  if (params.sortField) {
    flat.sort = `${params.sortField},${params.sortOrder === 'descend' ? 'desc' : 'asc'}`;
  }
  return flat as unknown as GetCompaniesParams;
}

export const companyHooksServer: CodebookHooksServer<Company> = {
  mode: 'server',
  useList: (params) =>
    useGetCompanies(toGetCompaniesParams(params), {
      // Normalize at the boundary: the rest of the app trusts `Company`, never the
      // raw generated DTO. Drift is logged inside normalizeCompany.
      query: {
        select: (data): Paginated<Company> => ({
          items: (data.data ?? []).map(normalizeCompany),
          total: data.totalElements ?? 0,
        }),
      },
      // Route to the Tracer backend, not the shared default (petstore) base URL.
      request: tracerRequest,
    }) as UseQueryResult<Paginated<Company>>,
  useCreate: () => {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: async (data: Partial<Company>) => {
        await createCompany(data as CompanyInsertCommand, tracerRequest);
        // Server assigns the id; the list refetch below brings the real record.
        return data as Company;
      },
      onSuccess: () => qc.invalidateQueries({ queryKey: LIST_KEY }),
    });
  },
  useUpdate: () => {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: async ({ id, data }: { id: string | number; data: Partial<Company> }) => {
        await updateCompany(Number(id), data as CompanyUpdateCommand, tracerRequest);
        return { ...data, id: Number(id) } as Company;
      },
      onSuccess: () => qc.invalidateQueries({ queryKey: LIST_KEY }),
    });
  },
  useDelete: () => {
    const qc = useQueryClient();
    return useMutation({
      mutationFn: (id: string | number) => deleteCompany(Number(id), tracerRequest),
      onSuccess: () => qc.invalidateQueries({ queryKey: LIST_KEY }),
    });
  },
};
