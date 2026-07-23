import type { ReactNode } from 'react';
import { Route, Routes } from 'react-router';

import { RouteErrorBoundary } from '@/app/RouteErrorBoundary/RouteErrorBoundary';
import { useFeatureFlag } from '@/lib/feature-flags';
import { InventoryPage } from '@/pages/inventory';
import { LoginPage } from '@/pages/login';
import { OrdersPage } from '@/pages/orders';
import { PetDetailsPage } from '@/pages/pet-details';
import { PetListPage } from '@/pages/pet-list';
import { SettingsPage } from '@/pages/settings';
import { SignupPage } from '@/pages/signup';

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
      {isOrderCreationFlagEnabled && (
        <Route path='/orders' element={withRouteErrorBoundary(<OrdersPage />)} />
      )}
    </Routes>
  );
}
