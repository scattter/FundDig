import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import PlanDetail from './pages/PlanDetail';

const root = createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/plan/:id" element={<PlanDetail />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);