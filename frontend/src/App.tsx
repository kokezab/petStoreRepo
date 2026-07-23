import { Layout } from 'antd';

import { AppRoutes } from '@/app/AppRoutes/AppRoutes';
import { NavBar } from '@/features/navigation/NavBar/NavBar';

export default function App() {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <NavBar />
      <Layout.Content className='mx-auto w-full max-w-5xl px-6 py-8'>
        <AppRoutes />
      </Layout.Content>
      <Layout.Footer className='text-center text-sm' />
    </Layout>
  );
}
