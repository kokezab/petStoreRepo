import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';

import { NavBar } from './NavBar';

// NavBar reads the build-time-injected __BUILD_TIME__ global, which vite defines
// at build time but is not present under vitest.
vi.stubGlobal('__BUILD_TIME__', 'test');

const useAuthMock = vi.fn();
vi.mock('react-oidc-context', () => ({ useAuth: () => useAuthMock() }));

describe('NavBar', () => {
  it('renders Pets and Inventory links inside a navigation landmark', () => {
    useAuthMock.mockReturnValue({ isAuthenticated: false, signinRedirect: vi.fn() });
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
    expect(within(nav).getByRole('link', { name: 'Users' })).toHaveAttribute('href', '/users/bulk');
  });

  it('shows a Sign in control when unauthenticated', () => {
    useAuthMock.mockReturnValue({ isAuthenticated: false, signinRedirect: vi.fn() });
    render(
      <MemoryRouter>
        <NavBar />
      </MemoryRouter>,
    );
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
  });

  it('shows the username and a Sign out control when authenticated', () => {
    useAuthMock.mockReturnValue({
      isAuthenticated: true,
      signoutRedirect: vi.fn(),
      user: { profile: { preferred_username: 'jdoe' } },
    });
    render(
      <MemoryRouter>
        <NavBar />
      </MemoryRouter>,
    );
    expect(screen.getByText('jdoe')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign out' })).toBeInTheDocument();
  });
});
