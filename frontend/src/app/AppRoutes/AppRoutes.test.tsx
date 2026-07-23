import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';

import { AppRoutes } from './AppRoutes';

vi.mock('@/pages/pet-list', () => ({
  PetListPage: () => <div>Pets Page</div>,
}));
vi.mock('@/pages/inventory', () => ({
  InventoryPage: () => <div>Inventory Page</div>,
}));
vi.mock('@/pages/pet-details', () => ({
  PetDetailsPage: () => <div>Pet Details</div>,
}));
vi.mock('@/pages/settings', () => ({
  SettingsPage: () => <div>Settings Page</div>,
}));
vi.mock('@/pages/signup', () => ({ SignupPage: () => <div>Signup Page</div> }));
vi.mock('@/pages/login', () => ({ LoginPage: () => <div>Login Page</div> }));
vi.mock('@/pages/orders', () => ({ OrdersPage: () => <div>Orders Page</div> }));

const { useFeatureFlagMock } = vi.hoisted(() => ({ useFeatureFlagMock: vi.fn() }));
vi.mock('@/lib/feature-flags', () => ({ useFeatureFlag: useFeatureFlagMock }));

describe('AppRoutes', () => {
  beforeEach(() => {
    useFeatureFlagMock.mockReturnValue(false);
  });

  it('renders the page matching the current route', () => {
    render(
      <MemoryRouter initialEntries={['/pets']}>
        <AppRoutes />
      </MemoryRouter>,
    );

    expect(screen.getByText('Pets Page')).toBeInTheDocument();
  });

  it('renders the inventory page for /inventory', () => {
    render(
      <MemoryRouter initialEntries={['/inventory']}>
        <AppRoutes />
      </MemoryRouter>,
    );

    expect(screen.getByText('Inventory Page')).toBeInTheDocument();
  });

  it('renders the orders page for /orders when the order-creation flag is enabled', () => {
    useFeatureFlagMock.mockReturnValue(true);

    render(
      <MemoryRouter initialEntries={['/orders']}>
        <AppRoutes />
      </MemoryRouter>,
    );

    expect(screen.getByText('Orders Page')).toBeInTheDocument();
  });

  it('does not render the orders page for /orders when the order-creation flag is disabled', () => {
    useFeatureFlagMock.mockReturnValue(false);

    render(
      <MemoryRouter initialEntries={['/orders']}>
        <AppRoutes />
      </MemoryRouter>,
    );

    expect(screen.queryByText('Orders Page')).not.toBeInTheDocument();
  });
});
