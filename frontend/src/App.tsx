import { BrowserRouter, Navigate, Route, Routes } from 'react-router';

import { NavBar } from '@/features/navigation/NavBar';
import { PetListPage } from '@/features/pets/PetListPage';

import { DemoModal } from './features/demo/DemoModal';
import { ModalStatus } from './features/demo/ModalStatus';
import { ModalTrigger } from './features/demo/ModalTrigger';
import { InventoryPage } from './features/inventory/InventoryPage';
import { PetDetailsPage } from './features/pet-details/PetDetailsPage';
import { SettingsPage } from './features/settings/SettingsPage';

export default function App() {
  return (
    <BrowserRouter>
      <NavBar />
      <Routes>
        <Route path='/' element={<Navigate to='/pets' replace />} />
        <Route path='/pets' element={<PetListPage />} />
        <Route path='/pets/:id' element={<PetDetailsPage />} />
        <Route path='/inventory' element={<InventoryPage />} />
        <Route path='/settings' element={<SettingsPage />} />
      </Routes>
      {/* DEMO: Zustand modal state management - delete after testing */}
      <div style={{ padding: '16px', border: '1px solid #ccc', marginTop: '16px' }}>
        <h3>Zustand Demo</h3>
        <ModalStatus />
        <ModalTrigger />
        <DemoModal />
      </div>
    </BrowserRouter>
  );
}
