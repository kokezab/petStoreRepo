import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import { vi } from 'vitest';

import type { Pet } from '@/api/generated/models';
import { useFindPetsByStatus, useAddPet } from '@/api/generated/pet/pet';

import { PetListPage } from './PetListPage';

vi.mock('@/api/generated/pet/pet', () => ({
  useFindPetsByStatus: vi.fn(),
  useAddPet: vi.fn(),
  getFindPetsByStatusQueryKey: vi.fn(),
}));

const mockedUseFindPetsByStatus = vi.mocked(useFindPetsByStatus);
const mockedUseAddPet = vi.mocked(useAddPet);

mockedUseAddPet.mockReturnValue({
  mutate: vi.fn(),
  isPending: false,
} as unknown as ReturnType<typeof useAddPet>);

const bella: Pet = { id: 1, name: 'Bella', photoUrls: [], status: 'available' };
const max: Pet = { id: 2, name: 'Max', photoUrls: [], status: 'available' };
const whiskers: Pet = { id: 3, name: 'Whiskers', photoUrls: [], status: 'pending' };

const petsByStatus: Record<'available' | 'pending' | 'sold', Pet[]> = {
  available: [bella, max],
  pending: [whiskers],
  sold: [],
};

function mockStatus(
  status: keyof typeof petsByStatus,
  overrides: Partial<{ data: Pet[] | undefined; isLoading: boolean; error: Error | null }> = {},
) {
  mockedUseFindPetsByStatus.mockReturnValue({
    data: petsByStatus[status],
    isLoading: false,
    error: null,
    ...overrides,
  } as unknown as ReturnType<typeof useFindPetsByStatus>);
}

function renderPage() {
  const queryClient = new QueryClient();
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <PetListPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('PetListPage', () => {
  it('AT-1: shows only available pets by default, listed by name', () => {
    mockStatus('available');
    renderPage();

    expect(mockedUseFindPetsByStatus).toHaveBeenCalledWith({ status: ['available'] });
    const list = screen.getByRole('list', { name: 'Pets' });
    expect(within(list).getAllByRole('listitem')).toHaveLength(2);
    expect(within(list).getByRole('link', { name: 'Bella' })).toBeVisible();
    expect(within(list).getByRole('link', { name: 'Max' })).toBeVisible();
  });

  it('AT-2: selecting the pending filter re-queries and shows pending pets', async () => {
    mockStatus('available');
    renderPage();
    const user = userEvent.setup();

    mockStatus('pending');
    await user.selectOptions(screen.getByRole('combobox', { name: 'Status filter' }), 'pending');

    expect(mockedUseFindPetsByStatus).toHaveBeenCalledWith({ status: ['pending'] });
    const list = screen.getByRole('list', { name: 'Pets' });
    expect(within(list).getByRole('link', { name: 'Whiskers' })).toBeVisible();
  });

  it('AT-3: selecting the sold filter re-queries with sold status', async () => {
    mockStatus('available');
    renderPage();
    const user = userEvent.setup();

    mockStatus('sold');
    await user.selectOptions(screen.getByRole('combobox', { name: 'Status filter' }), 'sold');

    expect(mockedUseFindPetsByStatus).toHaveBeenCalledWith({ status: ['sold'] });
  });

  it('AT-4: shows a loading indicator while pets are loading', () => {
    mockStatus('available', { data: undefined, isLoading: true });
    renderPage();

    expect(screen.getByRole('status', { name: 'Loading pets' })).toBeVisible();
  });

  it('AT-5: shows an empty-state message when a filter has no matches', () => {
    mockStatus('sold');
    renderPage();

    expect(screen.getByText(/no pets found/i)).toBeVisible();
  });

  it('AT-6: shows an error message when the request fails', () => {
    mockStatus('available', { data: undefined, isLoading: false, error: new Error('boom') });
    renderPage();

    expect(screen.getByRole('alert')).toBeVisible();
  });
});
