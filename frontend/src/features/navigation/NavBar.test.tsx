import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { NavBar } from './NavBar';

describe('NavBar', () => {
  it('renders Pets and Inventory links inside a navigation landmark', () => {
    render(
      <MemoryRouter>
        <NavBar />
      </MemoryRouter>,
    );

    const nav = screen.getByRole('navigation');
    expect(within(nav).getByRole('link', { name: 'Pets' })).toHaveAttribute('href', '/pets');
    expect(within(nav).getByRole('link', { name: 'Inventory' })).toHaveAttribute(
      'href',
      '/inventory',
    );
  });
});
