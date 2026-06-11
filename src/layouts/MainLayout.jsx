import React from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  FaChartPie, 
  FaBus, 
  FaRoute, 
  FaGraduationCap, 
  FaExclamationTriangle, 
  FaSignOutAlt,
  FaServer
} from 'react-icons/fa';

export default function MainLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Determinar título de página según ruta actual
  const getPageTitle = () => {
    switch (location.pathname) {
      case '/dashboard':
        return 'Panel Principal';
      case '/autobuses':
        return 'Autobuses';
      case '/rutas':
        return 'Rutas Escolares';
      case '/estudiantes':
        return 'Estudiantes';
      case '/incidencias':
        return 'Incidencias';
      default:
        return 'Dashboard';
    }
  };

  return (
    <div className="dashboard-container animate-fade-in" style={{ display: 'flex', minHeight: '100vh', background: 'var(--color-background)' }}>
      {/* Sidebar Barra Lateral */}
      <aside className="sidebar glass-panel" style={{ 
        width: '280px', 
        borderRadius: 0, 
        borderTop: 'none', 
        borderBottom: 'none', 
        borderLeft: 'none',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px',
        position: 'fixed',
        height: '100vh',
        zIndex: 10
      }}>
        {/* Marca / Logotipo */}
        <div style={{ marginBottom: '40px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '28px' }}>🚌</span>
          <span style={{ fontFamily: 'var(--font-heading)', fontWeight: '800', fontSize: '22px', color: 'var(--color-primary)' }}>RouteNova</span>
        </div>
        
        {/* Navegación */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
          <NavLink 
            to="/dashboard" 
            className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}
          >
            <FaChartPie />
            <span>Panel Principal</span>
          </NavLink>
          <NavLink 
            to="/autobuses" 
            className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}
            onClick={(e) => { e.preventDefault(); }}
            style={{ opacity: 0.6, cursor: 'not-allowed' }}
          >
            <FaBus />
            <span>Autobuses</span>
          </NavLink>
          <NavLink 
            to="/rutas" 
            className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}
            onClick={(e) => { e.preventDefault(); }}
            style={{ opacity: 0.6, cursor: 'not-allowed' }}
          >
            <FaRoute />
            <span>Rutas</span>
          </NavLink>
          <NavLink 
            to="/estudiantes" 
            className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}
            onClick={(e) => { e.preventDefault(); }}
            style={{ opacity: 0.6, cursor: 'not-allowed' }}
          >
            <FaGraduationCap />
            <span>Estudiantes</span>
          </NavLink>
          <NavLink 
            to="/incidencias" 
            className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}
            onClick={(e) => { e.preventDefault(); }}
            style={{ opacity: 0.6, cursor: 'not-allowed' }}
          >
            <FaExclamationTriangle />
            <span>Incidencias</span>
          </NavLink>
        </nav>

        {/* Info Perfil y Cierre Sesión */}
        {user && (
          <div style={{ marginTop: 'auto', borderTop: '1px solid var(--color-border)', paddingTop: '20px' }}>
            <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '2px', color: 'var(--color-text)' }}>{user.nombre}</div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: '16px', textOverflow: 'ellipsis', overflow: 'hidden' }}>{user.correo}</div>
            <button 
              onClick={handleLogout}
              className="btn-primary" 
              style={{ 
                padding: '10px 16px', 
                fontSize: '14px', 
                background: 'transparent', 
                border: '1px solid var(--color-border)', 
                color: 'var(--color-text)', 
                boxShadow: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <FaSignOutAlt />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        )}
      </aside>

      {/* Contenido Principal */}
      <div className="main-layout-content" style={{ 
        flex: 1, 
        marginLeft: '280px', 
        padding: '40px',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh'
      }}>
        {/* Cabecera */}
        <header style={{ 
          marginBottom: '40px', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          borderBottom: '1px solid var(--color-border)',
          paddingBottom: '20px'
        }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '28px', fontWeight: '800', margin: 0, color: 'var(--color-text)' }}>
              {getPageTitle()}
            </h1>
            <p style={{ color: 'var(--color-text-secondary)', marginTop: '4px', fontSize: '14px' }}>
              Bienvenido de vuelta, {user?.nombre || 'Administrador'}.
            </p>
          </div>
          <div style={{ 
            padding: '8px 16px', 
            background: 'rgba(16, 185, 129, 0.1)', 
            color: 'var(--color-secondary)', 
            borderRadius: '100px', 
            fontSize: '13px', 
            fontWeight: '600', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px'
          }}>
            <FaServer style={{ fontSize: '12px' }} />
            <span>Servicios API Operativos</span>
          </div>
        </header>

        {/* Vista Anidada Dinámica */}
        <main style={{ flex: 1 }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
