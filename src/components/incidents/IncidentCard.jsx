import React from 'react';
import { FaEye, FaTrashAlt, FaCalendarAlt, FaRoute } from 'react-icons/fa';
import { 
  translateType, 
  translateSeverity, 
  translateStatus, 
  getSeverityStyle, 
  getStatusStyle 
} from './IncidentTable';

export default function IncidentCard({ incidents, onSelect, onDelete, isAdmin }) {
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' + 
           date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="users-cards-grid animate-fade-in" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
      {incidents.map((incident) => {
        const shortId = `INC-${(incident._id || incident.id || '').slice(-4).toUpperCase()}`;
        return (
          <div key={incident._id || incident.id} className="glass-panel user-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px' }}>
            {/* Header de la tarjeta */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: '8px' }}>
              <span style={{ fontWeight: '800', color: 'var(--color-primary)', fontSize: '14px' }}>
                {shortId}
              </span>
              <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <FaCalendarAlt /> {formatDate(incident.createdAt)}
              </span>
            </div>

            {/* Cuerpo de la tarjeta */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: '700', color: 'var(--color-text)', fontSize: '15px' }}>
                  {translateType(incident.type)}
                </span>
                <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FaRoute /> {incident.route?.nombre || 'Sin Ruta'}
                </span>
              </div>

              {incident.title && (
                <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-text)' }}>
                  {incident.title}
                </div>
              )}

              {incident.description && (
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', fontStyle: 'italic', background: 'rgba(0, 0, 0, 0.02)', padding: '6px', borderRadius: '4px' }}>
                  "{incident.description}"
                </div>
              )}

              {/* Badges de Estado y Gravedad */}
              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                <span 
                  style={{
                    display: 'inline-block',
                    padding: '3px 8px',
                    borderRadius: '10px',
                    fontSize: '10px',
                    ...getSeverityStyle(incident.severity)
                  }}
                >
                  Gravedad: {translateSeverity(incident.severity)}
                </span>
                <span 
                  style={{
                    display: 'inline-block',
                    padding: '3px 8px',
                    borderRadius: '10px',
                    fontSize: '10px',
                    ...getStatusStyle(incident.status)
                  }}
                >
                  Estado: {translateStatus(incident.status)}
                </span>
              </div>
            </div>

            {/* Acciones de la tarjeta */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid var(--color-border)', paddingTop: '8px', marginTop: '4px' }}>
              <button 
                onClick={() => onSelect(incident)}
                className="action-btn edit"
                title="Ver detalle"
                style={{ color: 'var(--color-primary)', background: 'rgba(37, 99, 235, 0.1)', padding: '6px 12px', borderRadius: '4px', width: 'auto', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}
              >
                <FaEye /> Ver Detalle
              </button>
              {isAdmin && (
                <button 
                  onClick={() => onDelete(incident)}
                  className="action-btn delete"
                  title="Eliminar"
                  style={{ padding: '6px 12px', borderRadius: '4px', width: 'auto' }}
                >
                  <FaTrashAlt />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
