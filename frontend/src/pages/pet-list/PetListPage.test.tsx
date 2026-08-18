import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router';
import { vi } from 'vitest';

import type { Pet } from '@/api/generated/models';
import { useAddPet, useFindPetsByStatus } from '@/api/generated/pet/pet';

import { PetListPage } from './PetListPage';

vi.mock('@/api/generated/pet/pet', () => ({
  useFindPetsByStatus: vi.fn(),
  useAddPet: vi.fn(),
  getFindPetsByStatusQueryKey: vi.fn(),
}));

vi.mock('@/lib/feature-flags', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/feature-flags')>()),
  useFeatureFlag: vi.fn().mockReturnValue(true),
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

// Surfaces the current query string so tests can assert on the URL the filters
// write to.
function LocationProbe() {
  const { search } = useLocation();
  return <div data-testid='location-search'>{search}</div>;
}

function renderPage(initialUrl = '/pets') {
  const queryClient = new QueryClient();
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialUrl]}>
        <PetListPage />
        <LocationProbe />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function locationSearch() {
  return screen.getByTestId('location-search').textContent;
}

describe('PetListPage', () => {
  it('AT-1: shows only available pets by default, listed by name', () => {
    mockStatus('available');
    renderPage();

    expect(mockedUseFindPetsByStatus).toHaveBeenCalledWith(
      { status: ['available'] },
      expect.anything(),
    );
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
    await user.click(screen.getByRole('combobox', { name: 'Status filter' }));
    // @ts-expect-error Selecting "pending"
    await user.click(await screen.findByTitle('pending', { selector: 'div.ant-select-item' }));

    expect(mockedUseFindPetsByStatus).toHaveBeenCalledWith(
      { status: ['pending'] },
      expect.anything(),
    );
    const list = screen.getByRole('list', { name: 'Pets' });
    expect(within(list).getByRole('link', { name: 'Whiskers' })).toBeVisible();
  });

  it('AT-3: selecting the sold filter re-queries with sold status', async () => {
    mockStatus('available');
    renderPage();
    const user = userEvent.setup();

    mockStatus('sold');
    await user.click(screen.getByRole('combobox', { name: 'Status filter' }));
    // @ts-expect-error Selecting "sold"
    await user.click(await screen.findByTitle('sold', { selector: 'div.ant-select-item' }));

    expect(mockedUseFindPetsByStatus).toHaveBeenCalledWith({ status: ['sold'] }, expect.anything());
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

  it('AT-7: a bookmarked status param loads that filter and queries it', () => {
    mockStatus('pending');
    renderPage('/pets?status=pending');

    expect(mockedUseFindPetsByStatus).toHaveBeenCalledWith(
      { status: ['pending'] },
      expect.anything(),
    );
    const list = screen.getByRole('list', { name: 'Pets' });
    expect(within(list).getByRole('link', { name: 'Whiskers' })).toBeVisible();
  });

  it('AT-8: a bookmarked category param filters the list to that category', () => {
    const felix: Pet = {
      id: 4,
      name: 'Felix',
      photoUrls: [],
      status: 'pending',
      category: { id: 1, name: 'Cats' },
    };
    const rex: Pet = {
      id: 5,
      name: 'Rex',
      photoUrls: [],
      status: 'pending',
      category: { id: 2, name: 'Dogs' },
    };
    mockedUseFindPetsByStatus.mockReturnValue({
      data: [felix, rex],
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useFindPetsByStatus>);

    renderPage('/pets?status=pending&category=Cats');

    const list = screen.getByRole('list', { name: 'Pets' });
    expect(within(list).getByRole('link', { name: 'Felix' })).toBeVisible();
    expect(within(list).queryByRole('link', { name: 'Rex' })).not.toBeInTheDocument();
  });

  it('AT-9: changing a filter writes it to the URL, omitting the default status', async () => {
    mockStatus('available');
    renderPage();
    const user = userEvent.setup();

    expect(locationSearch()).toBe('');

    mockStatus('pending');
    await user.click(screen.getByRole('combobox', { name: 'Status filter' }));
    // @ts-expect-error Selecting "pending"
    await user.click(await screen.findByTitle('pending', { selector: 'div.ant-select-item' }));

    expect(locationSearch()).toBe('?status=pending');
  });

  it('AT-10: an unknown status param falls back to the available default', () => {
    mockStatus('available');
    renderPage('/pets?status=banana');

    expect(mockedUseFindPetsByStatus).toHaveBeenCalledWith(
      { status: ['available'] },
      expect.anything(),
    );
    const list = screen.getByRole('list', { name: 'Pets' });
    expect(within(list).getByRole('link', { name: 'Bella' })).toBeVisible();
  });
});
