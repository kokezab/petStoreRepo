import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { vi } from 'vitest';

import type { Pet } from '@/api/generated/models';
import { useGetPetById } from '@/api/generated/pet/pet';

import { PetDetailsPage } from './PetDetailsPage';

vi.mock('@/api/generated/pet/pet', () => ({
  useGetPetById: vi.fn(),
}));

const mockedUseGetPetById = vi.mocked(useGetPetById);

const buddy: Pet = { id: 112233, name: 'Buddy', photoUrls: [], status: 'available' };

function renderPage(id: number) {
  const queryClient = new QueryClient();
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/pets/${id}`]}>
        <Routes>
          <Route path='/pets/:id' element={<PetDetailsPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('PetDetailsPage', () => {
  it('displays the pet name in uppercase', () => {
    mockedUseGetPetById.mockReturnValue({
      data: buddy,
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useGetPetById>);

    renderPage(buddy.id!);

    // The accessible name is preserved as the original text; CSS renders it uppercase.
    const heading = screen.getByRole('heading', { name: 'Buddy', level: 1 });
    expect(heading).toBeVisible();
    expect(heading).toHaveClass('uppercase');
  });
});
