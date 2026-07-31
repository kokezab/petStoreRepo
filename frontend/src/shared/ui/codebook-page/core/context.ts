import { createContext, useContext } from 'react';

import type { TablePaginationConfig, TableProps } from 'antd';
import type { ZodObject, ZodRawShape } from 'zod';

import type { ResolvedPermissions } from './types';

export interface CodebookContextValue<T> {
  mode: 'client' | 'server';
  data: T[] | undefined;
  isLoading: boolean;
  rowKey: keyof T;
  pagination: TablePaginationConfig | false;
  onTableChange: TableProps<T>['onChange'];
  editingRecord: T | null;
  modalOpen: boolean;
  openCreate: () => void;
  openEdit: (record: T) => void;
  closeModal: () => void;
  remove: (record: T) => Promise<void>;
  submit: (values: Partial<T>) => Promise<void>;
  isSubmitting: boolean;
  permissions: ResolvedPermissions<T>;
  /** Optional zod schema for the create/edit form — drives Codebook.Field validation automatically */
  schema?: ZodObject<ZodRawShape>;
}

// The default is null; <Root> always supplies a concrete CodebookContextValue<T>.
// `any` is required here: the value's function fields (openEdit, onTableChange) are
// invariant in T, so a concrete CodebookContextValue<T> won't assign to the context
// type under `unknown`/`object`.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const CodebookContext = createContext<CodebookContextValue<any> | null>(null);

export function useCodebookContext<T>() {
  const ctx = useContext(CodebookContext);
  if (!ctx) {
    throw new Error('Codebook.* components must be rendered within <Codebook.Root>');
  }
  return ctx as CodebookContextValue<T>;
}
