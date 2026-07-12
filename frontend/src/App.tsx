import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import { NavBar } from '@/features/navigation/NavBar';
import { PetListPage } from '@/features/pets/PetListPage';
import { SettingsPage } from './features/settings/SettingsPage';
import { PetDetailsPage } from './features/pet-details/PetDetailsPage';
import { InventoryPage } from './features/inventory/InventoryPage';

export default function App() {
  return (
    <BrowserRouter>
      <NavBar />
      <Routes>
        <Route path="/" element={<Navigate to="/pets" replace />} />
        <Route path="/pets" element={<PetListPage />} />
        <Route path="/pets/:id" element={<PetDetailsPage />} />
        <Route path="/inventory" element={<InventoryPage />} />
        <Route path='/settings' element={<SettingsPage />} />
      </Routes>
    </BrowserRouter>
  );
}
