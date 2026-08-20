import { useEffect } from 'react';

import { Spin } from 'antd';
import { useAuth } from 'react-oidc-context';
import { useNavigate } from 'react-router';

/**
 * Redirect landing page (the OIDC `redirect_uri`). react-oidc-context processes
 * the `?code=...` exchange automatically; this component just waits for the
 * result and forwards the user to where they started (or `/`).
 */
export function AuthCallbackPage() {
  const auth = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (auth.error) {
      navigate('/login', { replace: true });
      return;
    }
    if (auth.isAuthenticated) {
      const returnPath = sessionStorage.getItem('auth_return_path') || '/';
      sessionStorage.removeItem('auth_return_path');
      navigate(returnPath, { replace: true });
    }
  }, [auth.isAuthenticated, auth.error, navigate]);

  return (
    <div className='flex min-h-[50vh] items-center justify-center'>
      <Spin size='large' />
    </div>
  );
}
