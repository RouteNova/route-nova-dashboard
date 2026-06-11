import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaSearch, FaBell, FaMapMarkerAlt, FaServer } from 'react-icons/fa';
import UserMenu from './UserMenu';

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef(null);

  // Mock de notificaciones iniciales del sistema
  const [notifications, setNotifications] = useState([
    { id: 1, type: 'alert', text: 'Desvío de ruta detectado en Autobús 2', time: 'Hace 5 min', unread: true },
    { id: 2, type: 'info', text: 'Ruta Especial 1 finalizada con éxito', time: 'Hace 15 min', unread: true },
    { id: 3, type: 'warning', text: 'Tráfico pesado reportado en Ruta Norte', time: 'Hace 1 hora', unread: false }
  ]);

  const unreadCount = notifications.filter(n => n.unread).length;

  useEffect(() => {
    function handleClickOutside(event) {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, unread: false })));
  };

  return (
    <header 
      style={{ 
        marginBottom: '32px', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        background: 'var(--color-card)',
        backdropFilter: 'blur(20px)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        padding: '16px 24px',
        boxShadow: 'var(--shadow-sm)',
        position: 'relative',
        zIndex: 50
      }}
    >
      {/* Título Contextual */}
      <div>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '24px', fontWeight: '800', margin: 0, color: 'var(--color-text)' }}>
          {getPageTitle()}
        </h1>
      </div>

      {/* Buscador Global (Mock) */}
      <div className="search-bar-container" style={{ position: 'relative', width: '320px', display: 'flex', alignItems: 'center' }}>
        <FaSearch style={{ position: 'absolute', left: '14px', color: 'var(--color-text-secondary)', fontSize: '14px' }} />
        <input 
          type="text" 
          placeholder="Buscar estudiante, conductor o ruta..." 
          style={{
            width: '100%',
            padding: '10px 16px 10px 38px',
            borderRadius: '100px',
            border: '1px solid var(--color-border)',
            background: 'var(--color-background)',
            color: 'var(--color-text)',
            fontFamily: 'var(--font-family)',
            fontSize: '14px',
            outline: 'none',
            transition: 'var(--transition)'
          }}
          className="search-bar-input"
        />
      </div>

      {/* Acciones de Cabecera */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        {/* Indicador de Estado de API */}
        <div style={{ 
          padding: '8px 16px', 
          background: 'rgba(16, 185, 129, 0.08)', 
          color: 'var(--color-secondary)', 
          borderRadius: '100px', 
          fontSize: '13px', 
          fontWeight: '600', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px'
        }}>
          <span style={{ width: '8px', height: '8px', background: 'var(--color-secondary)', borderRadius: '50%', display: 'inline-block' }}></span>
          <span>API Conectada</span>
        </div>

        {/* Acceso Rápido a Mapa en Vivo */}
        <button 
          onClick={() => navigate('/monitoreo')}
          className="btn-primary"
          style={{
            width: 'auto',
            padding: '8px 16px',
            fontSize: '13px',
            borderRadius: '100px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: 'none'
          }}
        >
          <FaMapMarkerAlt />
          <span>Mapa en Vivo</span>
        </button>

        {/* Campana de Notificaciones con Dropdown */}
        <div className="notifications-container" ref={notificationRef} style={{ position: 'relative' }}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-text)',
              cursor: 'pointer',
              fontSize: '20px',
              display: 'flex',
              alignItems: 'center',
              position: 'relative',
              padding: '6px',
              borderRadius: '50%',
              transition: 'var(--transition)'
            }}
            className="navbar-icon-btn"
          >
            <FaBell style={{ opacity: 0.8 }} />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '2px',
                right: '2px',
                background: 'var(--color-danger)',
                color: 'white',
                fontSize: '10px',
                fontWeight: '700',
                borderRadius: '50%',
                width: '16px',
                height: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid var(--color-card)'
              }}>
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="glass-panel dropdown-menu animate-fade-in" style={{
              position: 'absolute',
              top: 'calc(100% + 12px)',
              right: 0,
              width: '320px',
              padding: '12px',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-lg)',
              zIndex: 100
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>
                <span style={{ fontWeight: '700', fontSize: '14px', color: 'var(--color-text)' }}>Notificaciones</span>
                {unreadCount > 0 && (
                  <button 
                    onClick={markAllAsRead}
                    style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
                  >
                    Marcar leídas
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '240px', overflowY: 'auto' }}>
                {notifications.map(n => (
                  <div key={n.id} style={{
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-sm)',
                    background: n.unread ? 'rgba(37, 99, 235, 0.04)' : 'transparent',
                    borderLeft: n.unread ? '3px solid var(--color-primary)' : '3px solid transparent',
                    fontSize: '13px'
                  }}>
                    <div style={{ color: 'var(--color-text)', fontWeight: n.unread ? '600' : '400', marginBottom: '4px' }}>{n.text}</div>
                    <div style={{ color: 'var(--color-text-secondary)', fontSize: '11px' }}>{n.time}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Separador */}
        <div style={{ width: '1px', height: '24px', background: 'var(--color-border)' }}></div>

        {/* Avatar y Menú del Usuario */}
        <UserMenu />
      </div>
    </header>
  );
}
