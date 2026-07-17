import { Layout } from 'antd';
import { Route, Routes } from 'react-router';

import { NavBar } from '@/features/navigation/NavBar';
import { PetListPage } from '@/features/pets/PetListPage';

import { InventoryPage } from './features/inventory/InventoryPage';
import { PetDetailsPage } from './features/pet-details/PetDetailsPage';
import { SettingsPage } from './features/settings/SettingsPage';
import { SignupPage } from './features/signup/SignupPage';

export default function App() {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <NavBar />
      <Layout.Content className='mx-auto w-full max-w-5xl px-6 py-8'>
        <Routes>
          {/* <Route path='/' element={<Navigate to='/pets' replace />} /> */}
          <Route path='/' element={<PetListPage />} />
          <Route path='/pets' element={<PetListPage />} />
          <Route path='/pets/:id' element={<PetDetailsPage />} />
          <Route path='/inventory' element={<InventoryPage />} />
          <Route path='/settings' element={<SettingsPage />} />
          <Route path='/signup' element={<SignupPage />} />
        </Routes>
      </Layout.Content>
      <Layout.Footer className='text-center text-sm' />
    </Layout>
  );
}
