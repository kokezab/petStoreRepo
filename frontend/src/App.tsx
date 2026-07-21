import { Layout } from 'antd';
import type { ReactNode } from 'react';
import { Route, Routes } from 'react-router';

import { RouteErrorBoundary } from '@/app/RouteErrorBoundary/RouteErrorBoundary';
import { NavBar } from '@/features/navigation/NavBar/NavBar';
import { PetListPage } from '@/features/pets/PetListPage/PetListPage';

import { InventoryPage } from './features/inventory/InventoryPage';
import { PetDetailsPage } from './features/pet-details/PetDetailsPage';
import { SettingsPage } from './features/settings/SettingsPage';
import { SignupPage } from './features/signup/SignupPage';
import { LoginPage } from './features/login/LoginPage';

function withRouteErrorBoundary(element: ReactNode) {
  return <RouteErrorBoundary>{element}</RouteErrorBoundary>;
}

export default function App() {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <NavBar />
      <Layout.Content className='mx-auto w-full max-w-5xl px-6 py-8'>
        <Routes>
          <Route path='/' element={withRouteErrorBoundary(<PetListPage />)} />
          <Route path='/pets' element={withRouteErrorBoundary(<PetListPage />)} />
          <Route path='/pets/:id' element={withRouteErrorBoundary(<PetDetailsPage />)} />
          <Route path='/inventory' element={withRouteErrorBoundary(<InventoryPage />)} />
          <Route path='/settings' element={withRouteErrorBoundary(<SettingsPage />)} />
          <Route path='/signup' element={withRouteErrorBoundary(<SignupPage />)} />
          <Route path='/login' element={withRouteErrorBoundary(<LoginPage />)} />
        </Routes>
      </Layout.Content>
      <Layout.Footer className='text-center text-sm' />
    </Layout>
  );
}
