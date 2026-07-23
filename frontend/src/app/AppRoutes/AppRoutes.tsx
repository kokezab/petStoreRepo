import type { ReactNode } from 'react';
import { Route, Routes } from 'react-router';

import { RouteErrorBoundary } from '@/app/RouteErrorBoundary/RouteErrorBoundary';
import { InventoryPage } from '@/features/inventory/InventoryPage';
import { LoginPage } from '@/features/login/LoginPage';
import { PetDetailsPage } from '@/features/pet-details/PetDetailsPage';
import { PetListPage } from '@/features/pets/PetListPage/PetListPage';
import { SettingsPage } from '@/features/settings/SettingsPage';
import { SignupPage } from '@/features/signup/SignupPage';
import { OrdersPage } from '@/features/oders/OrdersPage';
import { useFeatureFlag } from '@/lib/feature-flags';

function withRouteErrorBoundary(element: ReactNode) {
  return <RouteErrorBoundary>{element}</RouteErrorBoundary>;
}

export function AppRoutes() {
  const isOrderCreationFlagEnabled = useFeatureFlag('order-creation');
  
  return (
    <Routes>
      <Route path='/' element={withRouteErrorBoundary(<PetListPage />)} />
      <Route path='/pets' element={withRouteErrorBoundary(<PetListPage />)} />
      <Route path='/pets/:id' element={withRouteErrorBoundary(<PetDetailsPage />)} />
      <Route path='/inventory' element={withRouteErrorBoundary(<InventoryPage />)} />
      <Route path='/settings' element={withRouteErrorBoundary(<SettingsPage />)} />
      <Route path='/signup' element={withRouteErrorBoundary(<SignupPage />)} />
      <Route path='/login' element={withRouteErrorBoundary(<LoginPage />)} />
      {isOrderCreationFlagEnabled && <Route path='/orders' element={withRouteErrorBoundary(<OrdersPage />)} />}
      
    </Routes>
  );
}
