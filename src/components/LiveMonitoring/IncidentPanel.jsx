import React from 'react';
import { FaExclamationTriangle, FaTimesCircle, FaClock } from 'react-icons/fa';

export default function IncidentPanel({ incidents }) {
  
  const getSeverityBadgeClass = (severity) => {
    switch (severity) {
      case 'high':
      case 'critical':
      case 'critico':
        return 'status-badge inactive'; // Fondo rojo
      case 'medium':
      case 'moderada':
      case 'moderado':
        return 'role-badge admin'; // Fondo azul/celeste
      case 'low':
      case 'leve':
      default:
        return 'role-badge conductor'; // Fondo violeta
    }
  };

  const getSeverityLabel = (severity) => {
    switch (severity) {
      case 'high':
      case 'critical':
      case 'critico':
        return 'Crítico';
      case 'medium':
      case 'moderada':
      case 'moderado':
        return 'Moderado';
      case 'low':
      case 'leve':
      default:
        return 'Leve';
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="glass-panel animate-slide-up" style={{
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      height: '100%',
      minHeight: '350px'
    }}>
      <h3 style={{ 
        fontFamily: 'var(--font-heading)', 
        fontWeight: '800', 
        fontSize: '17px', 
        color: 'var(--color-text)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        margin: 0
      }}>
        <FaExclamationTriangle style={{ color: 'var(--color-danger)' }} /> ALERTAS E INCIDENCIAS EN VIVO
      </h3>

      {incidents.length === 0 ? (
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px',
          textAlign: 'center',
          color: 'var(--color-text-secondary)'
        }}>
          <div style={{ fontSize: '32px', marginBottom: '8px', color: 'var(--color-success)' }}>🛡️</div>
          <h4 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--color-text)', marginBottom: '4px' }}>Sin incidencias activas</h4>
          <p style={{ fontSize: '12px' }}>Todo funciona correctamente en las rutas actualmente en curso.</p>
        </div>
      ) : (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          overflowY: 'auto',
          flex: 1
        }}>
          {incidents.map((incident) => (
            <div 
              key={incident.id || incident._id}
              className="glass-panel"
              style={{
                padding: '14px',
                borderLeft: '4px solid ' + (incident.severity === 'high' || incident.severity === 'critical' ? 'var(--color-danger)' : incident.severity === 'medium' ? 'var(--color-primary)' : 'var(--color-warning)'),
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}
            >
              {/* Encabezado Alerta */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className={getSeverityBadgeClass(incident.severity)} style={{ fontSize: '10px', padding: '2px 8px' }}>
                  {getSeverityLabel(incident.severity)}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <FaClock /> {formatTime(incident.createdAt)}
                </span>
              </div>

              {/* Título de la Incidencia */}
              <div style={{ fontWeight: '700', fontSize: '13px', color: 'var(--color-text)' }}>
                {incident.title || incident.descripcion || 'Incidencia Reportada'}
              </div>

              {/* Afecta a ruta */}
              <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                Ruta afectada: <b style={{ color: 'var(--color-text)' }}>{incident.routeName || incident.route?.nombre || 'Desconocida'}</b>
              </div>

              {/* Detalles si existen */}
              {incident.descripcion && incident.title && (
                <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', fontStyle: 'italic', background: 'rgba(0,0,0,0.01)', padding: '4px 6px', borderRadius: '4px' }}>
                  "{incident.descripcion}"
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
