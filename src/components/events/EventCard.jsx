import React from 'react';
import { FaEye, FaCalendarAlt, FaRoute, FaBus, FaUserTie } from 'react-icons/fa';
import { 
  translateEventType, 
  getEventBadgeStyle, 
  getEventIcon 
} from './EventTable';

export default function EventCard({ events, onSelect }) {
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' + 
           date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const getEventDescription = (event) => {
    if (event.type === 'student_boarded' || event.type === 'student_dropped') {
      return (
        <span>
          Estudiante: <strong style={{ color: 'var(--color-text)' }}>{event.student?.nombre || 'Alumno'}</strong>
        </span>
      );
    }
    return <span>{event.description}</span>;
  };

  return (
    <div className="users-cards-grid animate-fade-in" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
      {events.map((event) => {
        return (
          <div key={event._id || event.id} className="glass-panel user-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '13px', display: 'flex', alignItems: 'center' }}>
                  {getEventIcon(event.type)}
                </span>
                <span 
                  style={{
                    display: 'inline-block',
                    padding: '2px 8px',
                    borderRadius: '100px',
                    fontSize: '10px',
                    fontWeight: '600',
                    ...getEventBadgeStyle(event.type)
                  }}
                >
                  {translateEventType(event.type)}
                </span>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <FaCalendarAlt /> {formatDate(event.createdAt)}
              </span>
            </div>

            {/* Body */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
              {/* Ruta */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--color-text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <FaRoute /> Ruta afectada:
                </span>
                <span style={{ fontWeight: '600', color: 'var(--color-text)' }}>
                  {event.route?.nombre || 'N/A'}
                </span>
              </div>

              {/* Conductor y Bus */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '2px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-text-secondary)', fontSize: '12px' }}>
                  <FaUserTie /> {event.driver?.usuarioId?.nombre || 'Chofer'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-text-secondary)', fontSize: '12px', justifyContent: 'flex-end' }}>
                  <FaBus /> {event.route?.autobusId?.patente || 'Bus'}
                </div>
              </div>

              {/* Detalles / Descripción */}
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', background: 'rgba(0, 0, 0, 0.02)', padding: '8px', borderRadius: '4px', marginTop: '4px', minHeight: '32px', display: 'flex', alignItems: 'center' }}>
                {getEventDescription(event)}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--color-border)', paddingTop: '8px', marginTop: '4px' }}>
              <button 
                onClick={() => onSelect(event)}
                className="action-btn edit"
                title="Ver detalle"
                style={{ color: 'var(--color-primary)', background: 'rgba(37, 99, 235, 0.1)', padding: '6px 12px', borderRadius: '4px', width: 'auto', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}
              >
                <FaEye /> Ver Auditoría
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
