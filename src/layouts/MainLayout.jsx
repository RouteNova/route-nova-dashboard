import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Navbar from '../components/layout/Navbar';

export default function MainLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className="dashboard-layout">
      {/* Backdrop overlay for tablets/mobiles */}
      <div 
        className={`sidebar-overlay ${isSidebarOpen ? 'active' : ''}`} 
        onClick={closeSidebar}
      />

      {/* Sidebar Barra Lateral */}
      <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />

      {/* Contenido Principal */}
      <div className="main-content-container">
        {/* Barra Superior de Navegación */}
        <Navbar onToggleSidebar={toggleSidebar} />

        {/* Vista Anidada Dinámica */}
        <main style={{ flex: 1 }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
