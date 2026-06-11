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
  FaServer,
  FaMapMarkerAlt,
  FaUsers,
  FaUserTie,
  FaClipboardList,
  FaChartBar,
  FaUserShield,
  FaCog
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
      case '/eventos':
        return 'Eventos de Transporte';
      case '/incidencias':
        return 'Gestión de Incidencias';
      case '/reportes':
        return 'Análisis y Reportes';
      case '/usuarios':
        return 'Gestión de Usuarios';
      case '/configuracion':
        return 'Configuración del Sistema';
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
        padding: '24px 20px',
        position: 'fixed',
        height: '100vh',
        zIndex: 10
      }}>
        {/* Marca / Logotipo */}
        <div style={{ marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '12px', paddingLeft: '8px' }}>
          <span style={{ fontSize: '28px' }}>🚌</span>
          <span style={{ fontFamily: 'var(--font-heading)', fontWeight: '800', fontSize: '22px', color: 'var(--color-primary)' }}>RouteNova</span>
        </div>
        
        {/* Navegación Agrupada con Scroll */}
        <nav style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '20px', 
          flex: 1, 
          overflowY: 'auto',
          paddingRight: '4px',
          marginBottom: '20px'
        }}>
          {/* OPERACIONES */}
          <div>
            <div className="nav-group-header">OPERACIONES</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                <FaChartPie />
                <span>Dashboard</span>
              </NavLink>
              <NavLink to="/monitoreo" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}
                onClick={(e) => { e.preventDefault(); }}
                style={{ opacity: 0.6, cursor: 'not-allowed' }}>
                <FaMapMarkerAlt />
                <span>Monitoreo en Vivo</span>
              </NavLink>
            </div>
          </div>

          {/* GESTIÓN */}
          <div>
            <div className="nav-group-header">GESTIÓN</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <NavLink to="/estudiantes" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}
                onClick={(e) => { e.preventDefault(); }}
                style={{ opacity: 0.6, cursor: 'not-allowed' }}>
                <FaGraduationCap />
                <span>Estudiantes</span>
              </NavLink>
              <NavLink to="/padres" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}
                onClick={(e) => { e.preventDefault(); }}
                style={{ opacity: 0.6, cursor: 'not-allowed' }}>
                <FaUsers />
                <span>Padres/Tutores</span>
              </NavLink>
              <NavLink to="/conductores" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}
                onClick={(e) => { e.preventDefault(); }}
                style={{ opacity: 0.6, cursor: 'not-allowed' }}>
                <FaUserTie />
                <span>Conductores</span>
              </NavLink>
              <NavLink to="/autobuses" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}
                onClick={(e) => { e.preventDefault(); }}
                style={{ opacity: 0.6, cursor: 'not-allowed' }}>
                <FaBus />
                <span>Autobuses</span>
              </NavLink>
              <NavLink to="/rutas" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}
                onClick={(e) => { e.preventDefault(); }}
                style={{ opacity: 0.6, cursor: 'not-allowed' }}>
                <FaRoute />
                <span>Rutas</span>
              </NavLink>
            </div>
          </div>

          {/* CONTROL */}
          <div>
            <div className="nav-group-header">CONTROL</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <NavLink to="/eventos" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}
                onClick={(e) => { e.preventDefault(); }}
                style={{ opacity: 0.6, cursor: 'not-allowed' }}>
                <FaClipboardList />
                <span>Eventos de Ruta</span>
              </NavLink>
              <NavLink to="/incidencias" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}
                onClick={(e) => { e.preventDefault(); }}
                style={{ opacity: 0.6, cursor: 'not-allowed' }}>
                <FaExclamationTriangle />
                <span>Incidencias</span>
              </NavLink>
            </div>
          </div>

          {/* ANÁLISIS */}
          <div>
            <div className="nav-group-header">ANÁLISIS</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <NavLink to="/reportes" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}
                onClick={(e) => { e.preventDefault(); }}
                style={{ opacity: 0.6, cursor: 'not-allowed' }}>
                <FaChartBar />
                <span>Reportes</span>
              </NavLink>
            </div>
          </div>

          {/* SISTEMA */}
          <div>
            <div className="nav-group-header">SISTEMA</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <NavLink to="/usuarios" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}
                onClick={(e) => { e.preventDefault(); }}
                style={{ opacity: 0.6, cursor: 'not-allowed' }}>
                <FaUserShield />
                <span>Usuarios</span>
              </NavLink>
              <NavLink to="/configuracion" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}
                onClick={(e) => { e.preventDefault(); }}
                style={{ opacity: 0.6, cursor: 'not-allowed' }}>
                <FaCog />
                <span>Configuración</span>
              </NavLink>
            </div>
          </div>
        </nav>

        {/* Info Perfil y Cierre Sesión */}
        {user && (
          <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
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
