import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Navbar from '../components/layout/Navbar';

export default function MainLayout() {
  return (
    <div className="dashboard-container" style={{ display: 'flex', minHeight: '100vh', background: 'var(--color-background)' }}>
      {/* Sidebar Barra Lateral */}
      <Sidebar />

      {/* Contenido Principal */}
      <div className="main-layout-content" style={{ 
        flex: 1, 
        marginLeft: '280px', 
        padding: '40px',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh'
      }}>
        {/* Barra Superior de Navegación */}
        <Navbar />

        {/* Vista Anidada Dinámica */}
        <main style={{ flex: 1 }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
