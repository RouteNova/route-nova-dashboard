import React from 'react';
import NotificationItem from './NotificationItem';

export default function NotificationList({ 
  notifications = [], 
  onRead, 
  loading 
}) {
  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px' }}>
        <div className="spinner" style={{ marginBottom: '16px' }}></div>
        <span style={{ color: 'var(--color-text-secondary)', fontSize: '13.5px' }}>
          Cargando notificaciones...
        </span>
      </div>
    );
  }

  if (!notifications || notifications.length === 0) {
    return (
      <div style={{ 
        padding: '40px 20px', 
        textAlign: 'center', 
        color: 'var(--color-text-secondary)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px'
      }}>
        <div style={{ fontSize: '32px' }}>🔔</div>
        <h3 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--color-text)', margin: 0 }}>
          Sin notificaciones
        </h3>
        <p style={{ fontSize: '13px', margin: 0, opacity: 0.8 }}>
          No tienes notificaciones en este momento. ¡Todo marcha en orden!
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
      {notifications.map((notification) => (
        <NotificationItem 
          key={notification._id || notification.id}
          notification={notification}
          onRead={onRead}
        />
      ))}
    </div>
  );
}
