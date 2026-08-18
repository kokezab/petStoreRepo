import { useCallback } from 'react';

import { useSearchParams } from 'react-router';

import type { PetStatus } from '@/entities/pet';

export type PetCategory = 'Dogs' | 'Cats';

const STATUS_PARAM = 'status';
const CATEGORY_PARAM = 'category';

const DEFAULT_STATUS: PetStatus = 'available';

// Allowlists for parsing untrusted URL input. This is navigation input the
// user can type or bookmark, not an API-contract boundary — so it gets a plain
// membership check and a safe fallback, not the DTO-normalization machinery
// (zod/Sentry) reserved for server responses.
const PET_STATUSES: PetStatus[] = ['available', 'pending', 'sold'];
const PET_CATEGORIES: PetCategory[] = ['Dogs', 'Cats'];

function parseStatus(raw: string | null): PetStatus {
  return raw !== null && (PET_STATUSES as string[]).includes(raw)
    ? (raw as PetStatus)
    : DEFAULT_STATUS;
}

function parseCategory(raw: string | null): PetCategory | null {
  return raw !== null && (PET_CATEGORIES as string[]).includes(raw) ? (raw as PetCategory) : null;
}

interface PetsFilter {
  status: PetStatus;
  category: PetCategory | null;
  setStatus: (status: PetStatus) => void;
  setCategory: (category: PetCategory | null) => void;
}

/**
 * Reads and writes the pet-list filters (`status`, `category`) from the URL
 * query string, making the filtered view bookmarkable and shareable. The URL
 * is the single source of truth — there is no separate client store.
 *
 * Defaults are omitted from the URL for clean links: `status=available` and an
 * absent category serialize to a bare `/pets`. Filter changes replace the
 * current history entry so the back button leaves the page rather than stepping
 * through every filter tweak.
 */
export function usePetsFilter(): PetsFilter {
  const [searchParams, setSearchParams] = useSearchParams();

  const status = parseStatus(searchParams.get(STATUS_PARAM));
  const category = parseCategory(searchParams.get(CATEGORY_PARAM));

  const setStatus = useCallback(
    (next: PetStatus) => {
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev);
          if (next === DEFAULT_STATUS) {
            params.delete(STATUS_PARAM);
          } else {
            params.set(STATUS_PARAM, next);
          }
          return params;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const setCategory = useCallback(
    (next: PetCategory | null) => {
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev);
          if (next === null) {
            params.delete(CATEGORY_PARAM);
          } else {
            params.set(CATEGORY_PARAM, next);
          }
          return params;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  return { status, category, setStatus, setCategory };
}
