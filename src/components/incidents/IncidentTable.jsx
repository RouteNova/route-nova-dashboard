import React from 'react';
import { 
  FaEye, 
  FaTrashAlt, 
  FaExclamationTriangle,
  FaCheckCircle,
  FaUndo,
  FaSyncAlt
} from 'react-icons/fa';

// Helpers de traducción y formato
export const translateType = (type) => {
  switch (type) {
    case 'delay': return 'Retraso';
    case 'route_deviation': return 'Desvío de Ruta';
    case 'vehicle_breakdown': return 'Avería de Vehículo';
    case 'medical_emergency': return 'Emergencia Médica';
    case 'technical_issue': return 'Problema Técnico';
    case 'weather_condition': return 'Clima Adverso';
    case 'other': return 'Otro';
    default: return type || 'Desconocido';
  }
};

export const translateSeverity = (severity) => {
  switch (severity) {
    case 'low': return 'Leve';
    case 'medium': return 'Moderada';
    case 'high': return 'Alta';
    case 'critical': return 'Crítica';
    default: return severity || 'Leve';
  }
};

export const translateStatus = (status) => {
  switch (status) {
    case 'open': return 'Pendiente';
    case 'in_progress': return 'En revisión';
    case 'resolved': return 'Resuelta';
    case 'closed': return 'Cerrada';
    default: return status || 'Pendiente';
  }
};

export const getSeverityStyle = (severity) => {
  switch (severity) {
    case 'critical':
      return { background: 'rgba(153, 27, 27, 0.15)', color: '#EF4444', border: '1px solid rgba(153, 27, 27, 0.3)', fontWeight: '700' };
    case 'high':
      return { background: 'rgba(239, 68, 68, 0.1)', color: '#F87171', border: '1px solid rgba(239, 68, 68, 0.2)' };
    case 'medium':
      return { background: 'rgba(245, 158, 11, 0.1)', color: '#FBBF24', border: '1px solid rgba(245, 158, 11, 0.2)' };
    case 'low':
    default:
      return { background: 'rgba(139, 92, 246, 0.1)', color: '#A78BFA', border: '1px solid rgba(139, 92, 246, 0.2)' };
  }
};

export const getStatusStyle = (status) => {
  switch (status) {
    case 'closed':
      return { background: 'rgba(156, 163, 175, 0.15)', color: '#9CA3AF', border: '1px solid rgba(156, 163, 175, 0.3)' };
    case 'resolved':
      return { background: 'rgba(16, 185, 129, 0.15)', color: '#10B981', border: '1px solid rgba(16, 185, 129, 0.3)' };
    case 'in_progress':
      return { background: 'rgba(59, 130, 246, 0.15)', color: '#3B82F6', border: '1px solid rgba(59, 130, 246, 0.3)' };
    case 'open':
    default:
      return { background: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B', border: '1px solid rgba(245, 158, 11, 0.3)' };
  }
};

export default function IncidentTable({ 
  incidents, 
  onSelect, 
  onDelete, 
  onChangeStatus,
  updatingStatusId,
  isAdmin 
}) {
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' + 
           date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="glass-panel users-table-container animate-fade-in" style={{ display: 'block', overflowX: 'auto' }}>
      <table className="users-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Fecha/Hora</th>
            <th>Tipo</th>
            <th>Ruta Afectada</th>
            <th style={{ textAlign: 'center' }}>Gravedad</th>
            <th style={{ textAlign: 'center' }}>Estado</th>
            <th style={{ textAlign: 'right' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {incidents.map((incident) => {
            const incId = incident._id || incident.id;
            const shortId = `INC-${(incId || '').slice(-4).toUpperCase()}`;
            const isRowUpdating = updatingStatusId === incId;
            const isResolvedOrClosed = incident.status === 'resolved' || incident.status === 'closed';

            return (
              <tr key={incId}>
                <td style={{ fontWeight: '700', color: 'var(--color-primary)' }}>
                  {shortId}
                </td>
                <td style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                  {formatDate(incident.createdAt)}
                </td>
                <td style={{ fontWeight: '600', color: 'var(--color-text)' }}>
                  {translateType(incident.type)}
                </td>
                <td>
                  <span style={{ fontWeight: '500' }}>
                    {incident.route?.nombre || 'N/A'}
                  </span>
                </td>
                <td style={{ textAlign: 'center' }}>
                  <span 
                    style={{
                      display: 'inline-block',
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      ...getSeverityStyle(incident.severity)
                    }}
                  >
                    {translateSeverity(incident.severity)}
                  </span>
                </td>
                <td style={{ textAlign: 'center' }}>
                  {/* Selector interactivo de estado directamente en la tabla */}
                  <div style={{ display: 'inline-flex', alignItems: 'center', position: 'relative' }}>
                    {isRowUpdating ? (
                      <span 
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '4px 10px',
                          borderRadius: '14px',
                          fontSize: '11px',
                          fontWeight: '600',
                          ...getStatusStyle(incident.status)
                        }}
                      >
                        <FaSyncAlt style={{ animation: 'spin 1s linear infinite' }} /> Guardando...
                      </span>
                    ) : (
                      <select
                        value={incident.status || 'open'}
                        onChange={(e) => onChangeStatus && onChangeStatus(incId, e.target.value)}
                        disabled={isRowUpdating}
                        title="Haz clic para cambiar el estado de la incidencia"
                        aria-label={`Cambiar estado de ${shortId}`}
                        style={{
                          padding: '4px 22px 4px 10px',
                          borderRadius: '14px',
                          fontSize: '11.5px',
                          fontWeight: '700',
                          cursor: 'pointer',
                          outline: 'none',
                          appearance: 'none',
                          WebkitAppearance: 'none',
                          MozAppearance: 'none',
                          textAlign: 'center',
                          transition: 'all 0.2s ease',
                          ...getStatusStyle(incident.status)
                        }}
                      >
                        <option value="open">🟡 Pendiente</option>
                        <option value="in_progress">🔵 En revisión</option>
                        <option value="resolved">🟢 Resuelta</option>
                        <option value="closed">⚪ Cerrada</option>
                      </select>
                    )}
                    {!isRowUpdating && (
                      <span style={{
                        position: 'absolute',
                        right: '7px',
                        pointerEvents: 'none',
                        fontSize: '9px',
                        opacity: 0.7
                      }}>▼</span>
                    )}
                  </div>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <div className="actions-cell" style={{ justifyContent: 'flex-end', gap: '8px' }}>
                    {/* Botón rápido para marcar como resuelta o reabrir */}
                    {onChangeStatus && (
                      !isResolvedOrClosed ? (
                        <button 
                          onClick={() => onChangeStatus(incId, 'resolved')}
                          className="action-btn success"
                          title="Marcar como Resuelta directamente"
                          disabled={isRowUpdating}
                          style={{ color: '#10B981', background: 'rgba(16, 185, 129, 0.1)' }}
                        >
                          <FaCheckCircle />
                        </button>
                      ) : (
                        <button 
                          onClick={() => onChangeStatus(incId, 'open')}
                          className="action-btn warning"
                          title="Reabrir incidencia a Pendiente"
                          disabled={isRowUpdating}
                          style={{ color: '#F59E0B', background: 'rgba(245, 158, 11, 0.1)' }}
                        >
                          <FaUndo />
                        </button>
                      )
                    )}

                    {/* Botón de inspección y detalle */}
                    <button 
                      onClick={() => onSelect(incident)}
                      className="action-btn edit"
                      title="Ver detalle y mapa"
                      style={{ color: 'var(--color-primary)', background: 'rgba(37, 99, 235, 0.1)' }}
                    >
                      <FaEye />
                    </button>

                    {/* Botón de eliminación (Admin) */}
                    {isAdmin && (
                      <button 
                        onClick={() => onDelete(incident)}
                        className="action-btn delete"
                        title="Eliminar incidencia"
                      >
                        <FaTrashAlt />
                      </button>
                    )}
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
