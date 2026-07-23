import { Layout, Menu, Typography } from 'antd';
import { NavLink, useLocation } from 'react-router';

import { useFeatureFlag } from '@/lib/feature-flags';

const { Header } = Layout;
const { Text } = Typography;

const navItems = [
  { key: '/pets', label: <NavLink to='/pets'>Pets</NavLink> },
  { key: '/inventory', label: <NavLink to='/inventory'>Inventory</NavLink> },
  { key: '/settings', label: <NavLink to='/settings'>Settings</NavLink> },
  { key: '/login', label: <NavLink to='/login'>Login</NavLink> },
];

export function NavBar() {
  const location = useLocation();

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
    </Header>
  );
}
