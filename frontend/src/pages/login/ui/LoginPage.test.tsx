import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const signinRedirect = vi.fn();
const useAuthMock = vi.fn();
vi.mock('react-oidc-context', () => ({ useAuth: () => useAuthMock() }));

const navigate = vi.fn();
vi.mock('react-router', () => ({ useNavigate: () => navigate }));

vi.mock('@/shared/lib/i18n', () => ({
  useLocalization: () => ({ t: (k: string) => k }),
}));

const showErrorMessage = vi.fn();
vi.mock('@/lib/antd-message-bridge', () => ({
  showErrorMessage: (content: string) => showErrorMessage(content),
}));

import { LoginPage } from './LoginPage';

describe('LoginPage', () => {
  it('shows a sign-in button when unauthenticated', () => {
    useAuthMock.mockReturnValue({ isAuthenticated: false, signinRedirect });
    render(<LoginPage />);
    expect(screen.getByRole('button', { name: 'login.signIn' })).toBeInTheDocument();
  });

  it('redirects home when already authenticated', () => {
    useAuthMock.mockReturnValue({ isAuthenticated: true, signinRedirect });
    render(<LoginPage />);
    expect(navigate).toHaveBeenCalledWith('/', { replace: true });
  });

  it('surfaces an error when the redirect fails instead of silently swallowing it', async () => {
    showErrorMessage.mockClear();
    const failing = vi.fn().mockRejectedValue(new Error('A client_id is required'));
    useAuthMock.mockReturnValue({ isAuthenticated: false, signinRedirect: failing });
    render(<LoginPage />);

    fireEvent.click(screen.getByRole('button', { name: 'login.signIn' }));

    await waitFor(() => expect(showErrorMessage).toHaveBeenCalledWith('login.signInFailed'));
  });
});
