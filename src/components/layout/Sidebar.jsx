import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  FaChartPie, 
  FaBus, 
  FaRoute, 
  FaGraduationCap, 
  FaExclamationTriangle, 
  FaMapMarkerAlt,
  FaUsers,
  FaUserTie,
  FaClipboardList,
  FaChartBar,
  FaUserShield,
  FaCog,
  FaTimes
} from 'react-icons/fa';

export default function Sidebar({ isOpen, onClose }) {
  return (
    <aside className={`sidebar-container glass-panel ${isOpen ? 'open' : ''}`}>
      {/* Marca / Logotipo */}
      <div style={{ marginBottom: '32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingLeft: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '28px' }}>🚌</span>
          <span style={{ fontFamily: 'var(--font-heading)', fontWeight: '800', fontSize: '22px', color: 'var(--color-primary)' }}>RouteNova</span>
        </div>
        <button className="sidebar-close-btn" onClick={onClose} aria-label="Cerrar menú lateral">
          <FaTimes />
        </button>
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
            <NavLink to="/estudiantes" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
              <FaGraduationCap />
              <span>Estudiantes</span>
            </NavLink>
            <NavLink to="/padres" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
              <FaUsers />
              <span>Padres/Tutores</span>
            </NavLink>
            <NavLink to="/conductores" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
              <FaUserTie />
              <span>Conductores</span>
            </NavLink>
            <NavLink to="/autobuses" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
              <FaBus />
              <span>Autobuses</span>
            </NavLink>
            <NavLink to="/rutas" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
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

        <div>
          <div className="nav-group-header">SISTEMA</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <NavLink to="/usuarios" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
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
    </aside>
  );
}
