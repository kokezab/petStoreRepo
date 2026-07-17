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

});
