import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaMapMarkerAlt, FaBars } from 'react-icons/fa';
import UserMenu from './UserMenu';
import NotificationBell from '../notifications/NotificationBell';

export default function Navbar({ onToggleSidebar }) {
  const location = useLocation();
  const navigate = useNavigate();

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/dashboard':
        return 'Panel Principal';
      case '/monitoreo':
        return 'Monitoreo en Tiempo Real';
      case '/estudiantes':
        return 'Gestión de Estudiantes';
      case '/padres':
        return 'Gestión de Padres / Tutores';
      case '/conductores':
        return 'Gestión de Conductores';
      case '/autobuses':
        return 'Gestión de Autobuses';
      case '/rutas':
        return 'Gestión de Rutas Escolares';
      case '/events':
        return 'Eventos de Transporte';
      case '/incidents':
        return 'Gestión de Incidencias';
      case '/reports':
        return 'Análisis y Reportes';
      case '/notifications':
        return 'Centro de Notificaciones';
      case '/usuarios':
        return 'Gestión de Usuarios';
      case '/settings':
        return 'Configuración del Sistema';
      default:
        return 'Dashboard';
    }
  };

  return (
    <header className="navbar-header">
      {/* Título Contextual con Botón de Hamburguesa */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button 
          onClick={onToggleSidebar}
          className="navbar-menu-btn"
          aria-label="Abrir menú lateral"
        >
          <FaBars />
        </button>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '24px', fontWeight: '800', margin: 0, color: 'var(--color-text)' }}>
          {getPageTitle()}
        </h1>
      </div>

      {/* Acciones de Cabecera */}
      <div className="navbar-actions">

        {/* Acceso Rápido a Mapa en Vivo */}
        <button 
          onClick={() => navigate('/monitoreo')}
          className="btn-primary navbar-map-btn"
        >
          <FaMapMarkerAlt />
          <span className="navbar-btn-text">Mapa en Vivo</span>
        </button>

        {/* Campana de Notificaciones en vivo */}
        <NotificationBell />

        {/* Separador */}
        <div style={{ width: '1px', height: '24px', background: 'var(--color-border)' }}></div>

        {/* Avatar y Menú del Usuario */}
        <UserMenu />
      </div>
    </header>
  );
}
