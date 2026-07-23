import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';

import App from './App';

vi.mock('@/app/AppRoutes/AppRoutes', () => ({
  AppRoutes: () => <div>Routed Page</div>,
}));

// NavBar (unmocked here, per this test's intent to verify the real navigation
// landmark) reads the build-time-injected __BUILD_TIME__ global, which vite defines
// via `define` at build time but vitest does not provide. Stub it locally so this
// test isn't coupled to the pre-existing, out-of-scope NavBar.test.tsx failure.
vi.stubGlobal('__BUILD_TIME__', 'test');

describe('App', () => {
  it('renders NavBar, routed page content inside a main landmark, and a footer', () => {
    render(
      <MemoryRouter initialEntries={['/pets']}>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByRole('navigation')).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByText('Routed Page')).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });
});
