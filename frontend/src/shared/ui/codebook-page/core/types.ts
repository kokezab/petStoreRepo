import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';
import type { ColumnsType } from 'antd/es/table';
import type { ParseKeys } from 'i18next';
import type { ReactNode } from 'react';

export interface Paginated<T> {
  items: T[];
  total: number;
}

export interface ListParams {
  page: number;
  pageSize: number;
  sortField?: string;
  sortOrder?: 'ascend' | 'descend';
  filters?: Record<string, (string | number | boolean)[] | null>;
}

interface CodebookHooksBase<T, TCreate = Partial<T>, TUpdate = Partial<T>> {
  useCreate: () => UseMutationResult<T, unknown, TCreate>;
  useUpdate: () => UseMutationResult<T, unknown, { id: string | number; data: TUpdate }>;
  useDelete: () => UseMutationResult<unknown, unknown, string | number>;
}

/** Use when the API returns the full list in one call (no server-side paging/sort/filter). */
export interface CodebookHooksClient<T> extends CodebookHooksBase<T> {
  mode: 'client';
  useList: () => UseQueryResult<T[]>;
}

/** Use when paging/sort/filter are delegated to the API. */
export interface CodebookHooksServer<T> extends CodebookHooksBase<T> {
  mode: 'server';
  useList: (params: ListParams) => UseQueryResult<Paginated<T>>;
}

export type CodebookHooks<T> = CodebookHooksClient<T> | CodebookHooksServer<T>;

/**
 * visible  -> RBAC-level: should this control render at all
 * enabled  -> business-state-level: can it be clicked right now (record status, locks, etc.)
 * reason   -> translation key explaining why it's disabled, shown in a tooltip
 */
export interface PermissionResult {
  visible: boolean;
  enabled: boolean;
  reason?: ParseKeys<'translation'>;
}

export type PermissionValue<T> =
  boolean | ((record: T) => boolean) | ((record: T) => PermissionResult);

export interface CodebookPermissions<T> {
  create?: boolean | (() => boolean) | (() => PermissionResult);
  update?: PermissionValue<T>;
  delete?: PermissionValue<T>;
  view?: PermissionValue<T>;
}

export interface ResolvedPermissions<T> {
  canCreate: PermissionResult;
  canUpdate: (record: T) => PermissionResult;
  canDelete: (record: T) => PermissionResult;
  canView: (record: T) => PermissionResult;
}

export interface CodebookAction<T> {
  key: string;
  label?: string;
  icon?: ReactNode;
  danger?: boolean;
  /** If set, wraps the action in a Popconfirm with this title before firing onClick */
  confirm?: string;
  onClick: (record: T) => void;
  hidden?: (record: T) => boolean;
}

export type { ColumnsType };
