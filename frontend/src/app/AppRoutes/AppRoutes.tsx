import type { ReactNode } from 'react';
import { Route, Routes } from 'react-router';

import { RouteErrorBoundary } from '@/app/RouteErrorBoundary/RouteErrorBoundary';
import { CountriesPage } from '@/entities/country';
import { EquipmentPage } from '@/entities/equipment';
import { FEATURE_FLAGS, useFeatureFlag } from '@/lib/feature-flags';
import { BulkUserCreationPage } from '@/pages/bulk-user-creation';
import { InventoryPage } from '@/pages/inventory';
import { LoginPage } from '@/pages/login';
import { OrdersPage } from '@/pages/order';
import { PetDetailsPage } from '@/pages/pet-details';
import { PetListPage } from '@/pages/pet-list';
import { SettingsPage } from '@/pages/settings';
import { SignupPage } from '@/pages/signup';

function withRouteErrorBoundary(element: ReactNode) {
  return <RouteErrorBoundary>{element}</RouteErrorBoundary>;
}

export function AppRoutes() {
  const isOrderCreationFlagEnabled = useFeatureFlag(FEATURE_FLAGS.orderCreation);

  return (
    <Routes>
      <Route path='/' element={withRouteErrorBoundary(<PetListPage />)} />
      <Route path='/pets' element={withRouteErrorBoundary(<PetListPage />)} />
      <Route path='/pets/:id' element={withRouteErrorBoundary(<PetDetailsPage />)} />
      <Route path='/inventory' element={withRouteErrorBoundary(<InventoryPage />)} />
      <Route path='/settings' element={withRouteErrorBoundary(<SettingsPage />)} />
      <Route path='/signup' element={withRouteErrorBoundary(<SignupPage />)} />
      <Route path='/users/bulk' element={withRouteErrorBoundary(<BulkUserCreationPage />)} />
      <Route path='/login' element={withRouteErrorBoundary(<LoginPage />)} />
      <Route path='/countries' element={withRouteErrorBoundary(<CountriesPage />)} />
      <Route path='/equipment' element={withRouteErrorBoundary(<EquipmentPage />)} />
      {isOrderCreationFlagEnabled && (
        <Route path='/orders' element={withRouteErrorBoundary(<OrdersPage />)} />
      )}
    </Routes>
  );
}
