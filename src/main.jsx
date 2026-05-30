import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Admin from './pages/Admin.jsx';
import Presenter from './pages/Presenter.jsx';
import Participant from './pages/Participant.jsx';
import './styles.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Admin />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/present/:sessionId" element={<Presenter />} />
        <Route path="/join/:sessionId" element={<Participant />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
);
