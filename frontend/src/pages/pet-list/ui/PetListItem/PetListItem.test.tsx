import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';

import { PetListItem } from './PetListItem';

describe('PetListItem', () => {
  it('shows pets status', async () => {
    render(
      <MemoryRouter>
        <PetListItem pet={{ id: 1, name: 'Bella', photoUrls: [], status: 'available' }} />
      </MemoryRouter>,
    );
    expect(screen.getByText('Bella')).toBeInTheDocument();
    expect(screen.getByText(/available/i)).toBeInTheDocument();
  });

  it('shows other pets status', async () => {
    render(
      <MemoryRouter>
        <PetListItem pet={{ id: 1, name: 'Bella', photoUrls: [], status: 'pending' }} />
      </MemoryRouter>,
    );
    expect(screen.getByText('Bella')).toBeInTheDocument();
    expect(screen.getByText(/pending/i)).toBeInTheDocument();
  });

  it('shows pet photo', async () => {
    render(
      <MemoryRouter>
        <PetListItem
          pet={{
            id: 1,
            name: 'Bella',
            photoUrls: ['https://via.placeholder.com/150'],
            status: 'available',
          }}
        />
      </MemoryRouter>,
    );
    expect(screen.getByRole('img')).toHaveAttribute('src', 'https://via.placeholder.com/150');
  });

  it('shows placeholder pet photo', async () => {
    render(
      <MemoryRouter>
        <PetListItem pet={{ id: 1, name: 'Bella', photoUrls: [], status: 'available' }} />
      </MemoryRouter>,
    );
    expect(screen.getByRole('img')).toHaveAttribute('src', 'pet_placeholder.png');
  });
});
