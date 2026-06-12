import React from 'react';
import { Link } from 'react-router-dom';
import { FaCheckDouble, FaTimes } from 'react-icons/fa';
import NotificationList from './NotificationList';

export default function NotificationPanel({ 
  notifications = [], 
  onRead, 
  onMarkAllAsRead, 
  onClose,
  loading 
}) {
  // Mostrar sólo las últimas 5 notificaciones en el panel de navegación
  const recentNotifications = notifications.slice(0, 5);
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div 
      className="glass-panel"
      style={{
        position: 'absolute',
        top: '60px',
        right: '0',
        width: '360px',
        maxHeight: '500px',
        zIndex: 1000,
        boxShadow: 'var(--shadow-lg)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        background: 'var(--color-card)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        animation: 'fade-in 0.2s ease'
      }}
      onClick={(e) => e.stopPropagation()} // Prevenir que se cierre el panel al hacer clic dentro
    >
      {/* Cabecera */}
      <div style={{
        padding: '16px',
        borderBottom: '1px solid var(--color-border)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'rgba(255, 255, 255, 0.01)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h3 style={{ 
            fontSize: '15px', 
            fontWeight: '700', 
            color: 'var(--color-text)', 
            margin: 0 
          }}>
            Notificaciones
          </h3>
          {unreadCount > 0 && (
            <span style={{
              background: 'var(--color-danger)',
              color: '#ffffff',
              fontSize: '11px',
              fontWeight: '700',
              padding: '2px 8px',
              borderRadius: '10px'
            }}>
              {unreadCount} nuevas
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {unreadCount > 0 && (
            <button
              onClick={onMarkAllAsRead}
              title="Marcar todas como leídas"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-primary)',
                cursor: 'pointer',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontWeight: '600',
                padding: '4px'
              }}
            >
              <FaCheckDouble />
            </button>
          )}
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-text-secondary)',
              cursor: 'pointer',
              fontSize: '14px',
              padding: '4px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <FaTimes />
          </button>
        </div>
      </div>

      {/* Listado con scroll */}
      <div style={{
        padding: '12px',
        overflowY: 'auto',
        flex: 1,
        maxHeight: '340px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        <NotificationList 
          notifications={recentNotifications}
          onRead={onRead}
          loading={loading}
        />
      </div>

      {/* Enlace footer */}
      <Link
        to="/notifications"
        onClick={onClose}
        style={{
          padding: '14px',
          textAlign: 'center',
          fontSize: '13px',
          fontWeight: '600',
          color: 'var(--color-primary)',
          borderTop: '1px solid var(--color-border)',
          background: 'rgba(255, 255, 255, 0.02)',
          display: 'block',
          textDecoration: 'none',
          transition: 'background 0.2s'
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)'; }}
      >
        Ver todas las notificaciones
      </Link>
    </div>
  );
}
