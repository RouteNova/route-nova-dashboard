import React from 'react';
import { 
  FaEye, 
  FaPlayCircle, 
  FaStopCircle, 
  FaUserCheck, 
  FaMapMarkerAlt, 
  FaExclamationTriangle, 
  FaClock, 
  FaRoute 
} from 'react-icons/fa';

// Helpers de traducción y formato
export const translateEventType = (type) => {
  switch (type) {
    case 'route_started': return 'Inicio de Ruta';
    case 'route_finished': return 'Fin de Ruta';
    case 'student_boarded': return 'Estudiante Abordó';
    case 'student_dropped': return 'Estudiante Descendió';
    case 'incident_reported': return 'Incidencia';
    case 'route_deviated': return 'Desvío de Ruta';
    case 'route_delayed': return 'Demora';
    default: return type || 'Evento';
  }
};

export const getEventBadgeStyle = (type) => {
  switch (type) {
    case 'route_started':
      return { background: 'rgba(34, 197, 94, 0.12)', color: '#34D399', border: '1px solid rgba(34, 197, 94, 0.2)' };
    case 'route_finished':
      return { background: 'rgba(239, 68, 68, 0.12)', color: '#F87171', border: '1px solid rgba(239, 68, 68, 0.2)' };
    case 'student_boarded':
      return { background: 'rgba(16, 185, 129, 0.12)', color: '#059669', border: '1px solid rgba(16, 185, 129, 0.2)' };
    case 'student_dropped':
      return { background: 'rgba(6, 182, 212, 0.12)', color: '#06B6D4', border: '1px solid rgba(6, 182, 212, 0.2)' };
    case 'incident_reported':
      return { background: 'rgba(239, 68, 68, 0.18)', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.3)', fontWeight: 'bold' };
    case 'route_deviated':
      return { background: 'rgba(245, 158, 11, 0.12)', color: '#F59E0B', border: '1px solid rgba(245, 158, 11, 0.2)' };
    case 'route_delayed':
    default:
      return { background: 'rgba(107, 114, 128, 0.12)', color: '#9CA3AF', border: '1px solid rgba(107, 114, 128, 0.2)' };
  }
};

export const getEventIcon = (type) => {
  switch (type) {
    case 'route_started':
      return <FaPlayCircle style={{ color: '#34D399' }} />;
    case 'route_finished':
      return <FaStopCircle style={{ color: '#F87171' }} />;
    case 'student_boarded':
      return <FaUserCheck style={{ color: '#059669' }} />;
    case 'student_dropped':
      return <FaMapMarkerAlt style={{ color: '#06B6D4' }} />;
    case 'incident_reported':
      return <FaExclamationTriangle style={{ color: '#EF4444' }} />;
    case 'route_deviated':
      return <FaRoute style={{ color: '#F59E0B' }} />;
    case 'route_delayed':
    default:
      return <FaClock style={{ color: '#9CA3AF' }} />;
  }
};

export default function EventTable({ events, onSelect }) {
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
          Alumno: <strong style={{ color: 'var(--color-text)' }}>{event.student?.nombre || 'Estudiante'}</strong>
        </span>
      );
    }
    return <span style={{ fontStyle: 'italic', fontSize: '12.5px' }}>{event.description}</span>;
  };

  return (
    <div className="glass-panel users-table-container animate-fade-in" style={{ overflow: 'hidden' }}>
      <table className="users-table">
        <thead>
          <tr>
            <th>Fecha / Hora</th>
            <th>Tipo de Evento</th>
            <th>Ruta Escolar</th>
            <th>Conductor</th>
            <th>Vehículo</th>
            <th>Detalles / Afectado</th>
            <th style={{ textAlign: 'right' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {events.map((event) => {
            return (
              <tr key={event._id || event.id}>
                <td style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                  {formatDate(event.createdAt)}
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '14px', display: 'flex', alignItems: 'center' }}>
                      {getEventIcon(event.type)}
                    </span>
                    <span 
                      style={{
                        display: 'inline-block',
                        padding: '3px 8px',
                        borderRadius: '100px',
                        fontSize: '11px',
                        fontWeight: '600',
                        ...getEventBadgeStyle(event.type)
                      }}
                    >
                      {translateEventType(event.type)}
                    </span>
                  </div>
                </td>
                <td style={{ fontWeight: '500' }}>
                  {event.route?.nombre || 'N/A'}
                </td>
                <td style={{ fontSize: '13px' }}>
                  {event.driver?.usuarioId?.nombre || 'N/A'}
                </td>
                <td style={{ fontSize: '13px', fontWeight: '600', letterSpacing: '0.5px' }}>
                  {event.route?.autobusId?.patente || 'N/A'}
                </td>
                <td style={{ color: 'var(--color-text-secondary)' }}>
                  {getEventDescription(event)}
                </td>
                <td style={{ textAlign: 'right' }}>
                  <div className="actions-cell" style={{ justifyContent: 'flex-end' }}>
                    <button 
                      onClick={() => onSelect(event)}
                      className="action-btn edit"
                      title="Ver detalle del evento"
                      style={{ color: 'var(--color-primary)', background: 'rgba(37, 99, 235, 0.1)' }}
                    >
                      <FaEye />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
