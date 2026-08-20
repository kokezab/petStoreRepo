import { Button, Space, Typography } from 'antd';
import { useAuth } from 'react-oidc-context';
import { useNavigate } from 'react-router';

import { showErrorMessage } from '@/lib/antd-message-bridge';
import { useLocalization } from '@/shared/lib/i18n';

/**
 * Keycloak sign-in screen. There is no local credential form — auth is a redirect
 * to the IdP. If a session already exists, bounce straight home.
 */
export function LoginPage() {
  const { t } = useLocalization();
  const auth = useAuth();
  const navigate = useNavigate();

  if (auth.isAuthenticated) {
    navigate('/', { replace: true });
    return null;
  }

  const signIn = () => {
    sessionStorage.setItem('auth_return_path', window.location.pathname);
    // signinRedirect() rejects (rather than navigating) when the OIDC client is
    // misconfigured — e.g. an empty client_id makes oidc-client-ts throw
    // "A client_id is required". Surface it instead of swallowing, otherwise the
    // button appears to do nothing.
    auth.signinRedirect().catch((err) => {
      console.error('Keycloak sign-in redirect failed', err);
      showErrorMessage(t('login.signInFailed'));
    });
  };

  return (
    <Space orientation='vertical' align='center' size='large' style={{ width: '100%' }}>
      <Typography.Title level={2}>{t('login.title')}</Typography.Title>
      <Button type='primary' size='large' onClick={signIn} aria-label={t('login.signIn')}>
        {t('login.signIn')}
      </Button>
    </Space>
  );
}
