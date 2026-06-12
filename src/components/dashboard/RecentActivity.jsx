import React from 'react';
import { Link } from 'react-router-dom';
import { 
  getEventIcon, 
  getEventBadgeStyle, 
  translateEventType 
} from '../events/EventTable';

export default function RecentActivity({ activities = [] }) {
  
  const formatTimeOnly = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="glass-panel" style={{ padding: '24px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '15.5px', fontWeight: '700', color: 'var(--color-text)', margin: 0 }}>
          📋 Actividades y Bitácora Reciente
        </h3>
        <Link 
          to="/events" 
          style={{ 
            fontSize: '12.5px', 
            fontWeight: '600', 
            color: 'var(--color-primary)', 
            textDecoration: 'none' 
          }}
        >
          Ver Bitácora Completa →
        </Link>
      </div>

      {(!activities || activities.length === 0) ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-secondary)', fontSize: '13px', padding: '40px' }}>
          Esperando eventos de transporte en tiempo real...
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, overflowY: 'auto', maxHeight: '380px' }}>
          {activities.slice(0, 6).map((activity, idx) => (
            <div 
              key={activity._id || idx}
              style={{
                display: 'flex',
                gap: '12px',
                alignItems: 'flex-start',
                paddingBottom: idx !== activities.length - 1 ? '12px' : 0,
                borderBottom: idx !== activities.length - 1 ? '1px solid rgba(255, 255, 255, 0.03)' : 'none'
              }}
            >
              {/* Icono temático circular */}
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--color-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                flexShrink: 0
              }}>
                {getEventIcon(activity.type)}
              </div>

              {/* Contenido */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                  <span style={{ 
                    fontSize: '11px', 
                    fontWeight: '700',
                    padding: '1px 6px',
                    borderRadius: '4px',
                    ...getEventBadgeStyle(activity.type) 
                  }}>
                    {translateEventType(activity.type)}
                  </span>
                  
                  <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                    {formatTimeOnly(activity.createdAt)}
                  </span>
                </div>
                
                <p style={{ fontSize: '13px', color: 'var(--color-text)', margin: '4px 0 0 0', lineHeight: '1.4' }}>
                  {activity.description}
                </p>
                
                <span style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)' }}>
                  Ruta: <strong>{activity.route?.nombre || 'N/A'}</strong>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
