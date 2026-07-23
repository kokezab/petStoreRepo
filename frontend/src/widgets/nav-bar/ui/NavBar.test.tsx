import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';

import { NavBar } from './NavBar';

// NavBar reads the build-time-injected __BUILD_TIME__ global, which vite defines
// at build time but is not present under vitest.
vi.stubGlobal('__BUILD_TIME__', 'test');

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
    expect(within(nav).getByRole('link', { name: 'Settings' })).toHaveAttribute(
      'href',
      '/settings',
    );
    expect(within(nav).getByRole('link', { name: 'Login' })).toHaveAttribute('href', '/login');
  });
});
