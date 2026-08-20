import { Button, Layout, Menu, Space, Typography } from 'antd';
import { useAuth } from 'react-oidc-context';
import { NavLink, useLocation } from 'react-router';

import { useFeatureFlag } from '@/lib/feature-flags';

const { Header } = Layout;
const { Text } = Typography;

const navItems = [
  { key: '/pets', label: <NavLink to='/pets'>Pets</NavLink> },
  { key: '/inventory', label: <NavLink to='/inventory'>Inventory</NavLink> },
  { key: '/settings', label: <NavLink to='/settings'>Settings</NavLink> },
  { key: '/users/bulk', label: <NavLink to='/users/bulk'>Users</NavLink> },
  { key: '/countries', label: <NavLink to='/countries'>Countries</NavLink> },
  { key: '/equipment', label: <NavLink to='/equipment'>Equipment</NavLink> },
  { key: '/companies', label: <NavLink to='/companies'>Companies</NavLink> },
];

export function NavBar() {
  const location = useLocation();
  const auth = useAuth();

  const isOrderCreationFlagEnabled = useFeatureFlag('order-creation');

  const items = isOrderCreationFlagEnabled
    ? [...navItems, { key: '/orders', label: <NavLink to='/orders'>Orders</NavLink> }]
    : navItems;

  return (
    <Header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        gap: 24,
        paddingInline: 24,
      }}
    >
      <Text strong style={{ color: 'rgba(255, 255, 255, 0.88)', whiteSpace: 'nowrap' }}>
        Build: {__BUILD_TIME__}
      </Text>
      <nav style={{ flex: 1, minWidth: 0 }}>
        <Menu
          theme='dark'
          mode='horizontal'
          selectedKeys={[location.pathname]}
          items={items}
          style={{ minWidth: 0 }}
        />
      </nav>
      {auth.isAuthenticated ? (
        <Space>
          <Text style={{ color: 'rgba(255, 255, 255, 0.88)', whiteSpace: 'nowrap' }}>
            {auth.user?.profile?.preferred_username ?? auth.user?.profile?.email}
          </Text>
          <Button
            type='text'
            style={{ color: 'rgba(255, 255, 255, 0.88)' }}
            onClick={() => {
              auth.signoutRedirect().catch((err) => console.error('Sign-out redirect failed', err));
            }}
          >
            Sign out
          </Button>
        </Space>
      ) : (
        <Button
          type='text'
          style={{ color: 'rgba(255, 255, 255, 0.88)' }}
          onClick={() => {
            auth.signinRedirect().catch((err) => console.error('Sign-in redirect failed', err));
          }}
        >
          Sign in
        </Button>
      )}
    </Header>
  );
}
