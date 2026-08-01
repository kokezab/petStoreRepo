import { Children, isValidElement, type ReactNode, useState } from 'react';

import type { TablePaginationConfig } from 'antd';
import { message } from 'antd';
import type { FilterValue, SorterResult } from 'antd/es/table/interface';
import type { ZodObject, ZodRawShape } from 'zod';

import { CodebookContext } from '../core/context';
import { resolvePermissions } from '../core/permissions';
import type { CodebookHooks, CodebookPermissions, ListParams, Paginated } from '../core/types';
import { Pager, type PagerProps } from './Pager';

interface RootProps<T> {
  rowKey: keyof T;
  hooks: CodebookHooks<T>;
  permissions?: CodebookPermissions<T>;
  /** Zod schema for the create/edit form. Optional — omit if you're not using Codebook.Field's auto-validation. */
  schema?: ZodObject<ZodRawShape>;
  children: ReactNode;
}

/**
 * Finds a direct <Codebook.Pager> child and returns its props, or null if absent.
 * Pagination is opt-in: no Pager means no pager (the Table renders all rows).
 */
function findPager(children: ReactNode): PagerProps | null {
  for (const child of Children.toArray(children)) {
    if (isValidElement(child) && child.type === Pager) {
      return child.props as PagerProps;
    }
  }
  return null;
}

export function Root<T extends object>({
  rowKey,
  hooks,
  permissions,
  schema,
  children,
}: RootProps<T>) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<T | null>(null);

  const pager = findPager(children);
  const onPageSizeChange = pager?.onPageSizeChange;

  const [internalPageSize, setInternalPageSize] = useState(pager?.pageSize ?? 10);
  const pageSize = onPageSizeChange ? (pager?.pageSize ?? 10) : internalPageSize;
  const setPageSize = onPageSizeChange ?? setInternalPageSize;

  const [listParams, setListParams] = useState<ListParams>({ page: 1, pageSize });

  const resolvedPermissions = resolvePermissions<T>(permissions);

  // The client/server branch: server mode feeds listParams into the query,
  // client mode fetches the full list once and lets antd's Table paginate locally.
  const listQuery = hooks.mode === 'server' ? hooks.useList(listParams) : hooks.useList();

  const data: T[] | undefined =
    hooks.mode === 'server'
      ? (listQuery.data as Paginated<T> | undefined)?.items
      : (listQuery.data as T[] | undefined);

  const total =
    hooks.mode === 'server'
      ? ((listQuery.data as Paginated<T> | undefined)?.total ?? 0)
      : undefined;

  const createMutation = hooks.useCreate();
  const updateMutation = hooks.useUpdate();
  const deleteMutation = hooks.useDelete();

  const openCreate = () => {
    if (!resolvedPermissions.canCreate.enabled) return;
    setEditingRecord(null);
    setModalOpen(true);
  };

  const openEdit = (record: T) => {
    if (!resolvedPermissions.canUpdate(record).enabled) return;
    setEditingRecord(record);
    setModalOpen(true);
  };

  const closeModal = () => setModalOpen(false);

  const submit = async (values: Partial<T>) => {
    if (editingRecord) {
      await updateMutation.mutateAsync({
        id: editingRecord[rowKey] as string | number,
        data: values,
      });
      message.success('Updated');
    } else {
      await createMutation.mutateAsync(values);
      message.success('Created');
    }
    setModalOpen(false);
  };

  const remove = async (record: T) => {
    if (!resolvedPermissions.canDelete(record).enabled) return;
    await deleteMutation.mutateAsync(record[rowKey] as string | number);
    message.success('Deleted');
  };

  const onTableChange = (
    paginationCfg: TablePaginationConfig,
    filters: Record<string, FilterValue | null>,
    sorter: SorterResult<T> | SorterResult<T>[],
  ) => {
    if (paginationCfg?.pageSize && paginationCfg.pageSize !== pageSize) {
      setPageSize(paginationCfg.pageSize);
    }
    if (hooks.mode !== 'server') return; // client mode: antd handles sort/filter/paging locally
    const s = Array.isArray(sorter) ? sorter[0] : sorter;
    setListParams({
      page: paginationCfg.current ?? 1,
      pageSize: paginationCfg.pageSize ?? pageSize,
      sortField: s?.field as string | undefined,
      sortOrder: s?.order ?? undefined,
      // antd's FilterValue widens to include bigint; ListParams intentionally stays
      // antd-agnostic (string | number | boolean), so narrow at this boundary.
      filters: filters as ListParams['filters'],
    });
  };

  return (
    <CodebookContext.Provider
      value={{
        mode: hooks.mode,
        data,
        isLoading: listQuery.isLoading,
        isFetching: listQuery.isFetching,
        rowKey,
        pagination: !pager
          ? false
          : {
              showSizeChanger: pager.showSizeChanger ?? false,
              pageSizeOptions: pager.pageSizeOptions,
              ...(hooks.mode === 'server'
                ? { current: listParams.page, pageSize: listParams.pageSize, total }
                : { pageSize }),
            },
        onTableChange,
        editingRecord,
        modalOpen,
        openCreate,
        openEdit,
        closeModal,
        remove,
        submit,
        isSubmitting: createMutation.isPending || updateMutation.isPending,
        permissions: resolvedPermissions,
        schema,
      }}
    >
      {children}
    </CodebookContext.Provider>
  );
}
