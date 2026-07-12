import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import { NavBar } from '@/features/navigation/NavBar';

export default function App() {
  return (
    <BrowserRouter>
      <NavBar />
      <Routes>
        <Route path="/" element={<Navigate to="/pets" replace />} />
        <Route path="/pets" element={<div>Pets page placeholder</div>} />
        <Route path="/pets/:id" element={<div>Pet detail placeholder</div>} />
        <Route path="/inventory" element={<div>Inventory page placeholder</div>} />
      </Routes>
    </BrowserRouter>
  );
}
