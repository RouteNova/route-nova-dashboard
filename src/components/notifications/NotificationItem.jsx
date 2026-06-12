import React, { useState } from 'react';
import { 
  FaPlayCircle, 
  FaStopCircle, 
  FaExclamationTriangle, 
  FaClock, 
  FaRoute,
  FaCheck
} from 'react-icons/fa';

export default function NotificationItem({ notification, onRead }) {
  const [marking, setMarking] = useState(false);

  const getIcon = () => {
    switch (notification.type) {
      case 'NEW_INCIDENT':
        return <FaExclamationTriangle style={{ color: '#EF4444' }} />;
      case 'ROUTE_DELAYED':
        return <FaClock style={{ color: '#FBBF24' }} />;
      case 'ROUTE_DEVIATED':
        return <FaRoute style={{ color: '#F59E0B' }} />;
      case 'ROUTE_STARTED':
        return <FaPlayCircle style={{ color: '#34D399' }} />;
      case 'ROUTE_FINISHED':
        return <FaStopCircle style={{ color: '#EF4444' }} />;
      default:
        return <FaClock style={{ color: '#9CA3AF' }} />;
    }
  };

  const getBgColor = () => {
    switch (notification.type) {
      case 'NEW_INCIDENT': return 'rgba(239, 68, 68, 0.08)';
      case 'ROUTE_DELAYED': return 'rgba(251, 191, 36, 0.08)';
      case 'ROUTE_DEVIATED': return 'rgba(245, 158, 11, 0.08)';
      case 'ROUTE_STARTED': return 'rgba(52, 211, 153, 0.08)';
      case 'ROUTE_FINISHED': return 'rgba(239, 68, 68, 0.08)';
      default: return 'rgba(255, 255, 255, 0.02)';
    }
  };

  const getBorderColor = () => {
    if (!notification.read) {
      switch (notification.type) {
        case 'NEW_INCIDENT': return 'rgba(239, 68, 68, 0.2)';
        case 'ROUTE_DELAYED': return 'rgba(251, 191, 36, 0.2)';
        case 'ROUTE_DEVIATED': return 'rgba(245, 158, 11, 0.2)';
        case 'ROUTE_STARTED': return 'rgba(52, 211, 153, 0.2)';
        case 'ROUTE_FINISHED': return 'rgba(239, 68, 68, 0.2)';
        default: return 'var(--color-border)';
      }
    }
    return 'rgba(255, 255, 255, 0.05)';
  };

  const formatRelativeTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.max(0, Math.floor(diffMs / 60000));
    
    if (diffMins < 1) return 'Hace unos instantes';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
    
    return date.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' + 
           date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleReadClick = async (e) => {
    e.stopPropagation();
    if (notification.read || marking) return;
    setMarking(true);
    try {
      await onRead(notification._id || notification.id);
    } catch (err) {
      console.error('Error al marcar notificación como leída:', err);
    } finally {
      setMarking(false);
    }
  };

  return (
    <div
      style={{
        padding: '16px',
        borderRadius: 'var(--radius-md)',
        background: getBgColor(),
        border: `1px solid ${getBorderColor()}`,
        display: 'flex',
        gap: '14px',
        alignItems: 'flex-start',
        position: 'relative',
        opacity: notification.read ? 0.75 : 1,
        transition: 'all 0.2s ease',
        width: '100%'
      }}
    >
      {/* Icono temático */}
      <div style={{
        fontSize: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: '2px'
      }}>
        {getIcon()}
      </div>

      {/* Cuerpo */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px', paddingRight: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h4 style={{ 
            fontSize: '14.5px', 
            fontWeight: notification.read ? '600' : '700', 
            color: 'var(--color-text)', 
            margin: 0 
          }}>
            {notification.title}
          </h4>
          
          {/* Indicador no leído */}
          {!notification.read && (
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#EF4444',
              display: 'inline-block',
              boxShadow: '0 0 8px #EF4444'
            }} />
          )}
        </div>

        <p style={{ 
          fontSize: '13px', 
          color: 'var(--color-text-secondary)', 
          lineHeight: '1.4', 
          margin: 0 
        }}>
          {notification.message}
        </p>

        <span style={{ 
          fontSize: '11px', 
          color: 'rgba(255, 255, 255, 0.4)', 
          marginTop: '4px' 
        }}>
          {formatRelativeTime(notification.createdAt)}
        </span>
      </div>

      {/* Acción de marcar como leído */}
      {!notification.read && (
        <button
          onClick={handleReadClick}
          disabled={marking}
          title="Marcar como leída"
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: '10px',
            transition: 'all 0.2s',
            padding: 0
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(52, 211, 153, 0.15)';
            e.currentTarget.style.color = '#34D399';
            e.currentTarget.style.borderColor = 'rgba(52, 211, 153, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
            e.currentTarget.style.color = 'var(--color-text-secondary)';
            e.currentTarget.style.borderColor = 'var(--color-border)';
          }}
        >
          <FaCheck />
        </button>
      )}
    </div>
  );
}
