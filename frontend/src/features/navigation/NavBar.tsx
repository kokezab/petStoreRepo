import { Layout, Menu, Typography } from 'antd';
import { NavLink, useLocation } from 'react-router';

const { Header } = Layout;
const { Text } = Typography;

const navItems = [
  { key: '/pets', label: <NavLink to='/pets'>Pets</NavLink> },
  { key: '/inventory', label: <NavLink to='/inventory'>Inventory</NavLink> },
];

export function NavBar() {
  const location = useLocation();

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
          items={navItems}
          style={{ minWidth: 0 }}
        />
      </nav>
    </Header>
  );
}
