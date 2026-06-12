import React from 'react';
import { 
  translateType, 
  translateSeverity, 
  translateStatus, 
  getSeverityStyle, 
  getStatusStyle 
} from '../incidents/IncidentTable';

export default function ReportTable({ reportType, data = [] }) {
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' + 
           date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatTimeOnly = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const formatDuration = (minutes) => {
    if (minutes === undefined || minutes === null) return 'N/A';
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hrs > 0 ? `${hrs}h ${mins}min` : `${mins}min`;
  };

  if (!data || data.length === 0) {
    return (
      <div style={{ padding: '32px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
        No hay datos disponibles para los criterios seleccionados.
      </div>
    );
  }

  // Render según el tipo de reporte
  switch (reportType) {
    case 'students':
      return (
        <div style={{ display: 'block', overflowX: 'auto', width: '100%' }}>
          <table className="users-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '12px' }}>Estudiante</th>
                <th style={{ textAlign: 'left', padding: '12px' }}>Ruta Escolar</th>
                <th style={{ textAlign: 'left', padding: '12px' }}>Fecha</th>
                <th style={{ textAlign: 'center', padding: '12px' }}>¿Abordó?</th>
                <th style={{ textAlign: 'center', padding: '12px' }}>¿Descendió?</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, idx) => (
                <tr key={idx}>
                  <td style={{ padding: '12px', fontWeight: '600', color: 'var(--color-text)' }}>{row.studentName}</td>
                  <td style={{ padding: '12px' }}>{row.routeName}</td>
                  <td style={{ padding: '12px', color: 'var(--color-text-secondary)', fontSize: '13px' }}>{formatDate(row.date)}</td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: '600',
                      background: row.boarded ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      color: row.boarded ? '#34D399' : '#F87171',
                      border: row.boarded ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)'
                    }}>
                      {row.boarded ? 'Sí' : 'No'}
                    </span>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: '600',
                      background: row.dropped ? 'rgba(6, 182, 212, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      color: row.dropped ? '#06B6D4' : '#F87171',
                      border: row.dropped ? '1px solid rgba(6, 182, 212, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)'
                    }}>
                      {row.dropped ? 'Sí' : 'No'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case 'incidents':
      return (
        <div style={{ display: 'block', overflowX: 'auto', width: '100%' }}>
          <table className="users-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '12px' }}>Tipo</th>
                <th style={{ textAlign: 'left', padding: '12px' }}>Ruta Escolar</th>
                <th style={{ textAlign: 'center', padding: '12px' }}>Gravedad</th>
                <th style={{ textAlign: 'center', padding: '12px' }}>Estado</th>
                <th style={{ textAlign: 'left', padding: '12px' }}>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, idx) => (
                <tr key={idx}>
                  <td style={{ padding: '12px', fontWeight: '600', color: 'var(--color-text)' }}>{translateType(row.type)}</td>
                  <td style={{ padding: '12px' }}>{row.routeName}</td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      ...getSeverityStyle(row.severity)
                    }}>
                      {translateSeverity(row.severity)}
                    </span>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      ...getStatusStyle(row.status)
                    }}>
                      {translateStatus(row.status)}
                    </span>
                  </td>
                  <td style={{ padding: '12px', color: 'var(--color-text-secondary)', fontSize: '13px' }}>{formatDateTime(row.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case 'routes':
      return (
        <div style={{ display: 'block', overflowX: 'auto', width: '100%' }}>
          <table className="users-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '12px' }}>Ruta Escolar</th>
                <th style={{ textAlign: 'left', padding: '12px' }}>Conductor</th>
                <th style={{ textAlign: 'left', padding: '12px' }}>Vehículo (Patente)</th>
                <th style={{ textAlign: 'left', padding: '12px' }}>Inicio Real</th>
                <th style={{ textAlign: 'left', padding: '12px' }}>Finalización Real</th>
                <th style={{ textAlign: 'center', padding: '12px' }}>Duración</th>
                <th style={{ textAlign: 'center', padding: '12px' }}>Incidencias</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, idx) => (
                <tr key={idx}>
                  <td style={{ padding: '12px', fontWeight: '600', color: 'var(--color-text)' }}>{row.routeName}</td>
                  <td style={{ padding: '12px' }}>{row.driverName}</td>
                  <td style={{ padding: '12px', fontFamily: 'monospace' }}>{row.autobusPatente}</td>
                  <td style={{ padding: '12px', color: 'var(--color-text-secondary)', fontSize: '13px' }}>{formatDateTime(row.startTime)}</td>
                  <td style={{ padding: '12px', color: 'var(--color-text-secondary)', fontSize: '13px' }}>{formatDateTime(row.endTime)}</td>
                  <td style={{ padding: '12px', textAlign: 'center', fontWeight: '500' }}>{formatDuration(row.durationMinutes)}</td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: '600',
                      background: row.incidentCount > 0 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                      color: row.incidentCount > 0 ? '#F87171' : '#34D399',
                      border: row.incidentCount > 0 ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)'
                    }}>
                      {row.incidentCount}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case 'boarding':
      return (
        <div style={{ display: 'block', overflowX: 'auto', width: '100%' }}>
          <table className="users-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '12px' }}>Fecha</th>
                <th style={{ textAlign: 'left', padding: '12px' }}>Estudiante</th>
                <th style={{ textAlign: 'center', padding: '12px' }}>Hora Abordaje</th>
                <th style={{ textAlign: 'center', padding: '12px' }}>Hora Descenso</th>
                <th style={{ textAlign: 'left', padding: '12px' }}>Ruta Escolar</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, idx) => (
                <tr key={idx}>
                  <td style={{ padding: '12px', color: 'var(--color-text-secondary)', fontSize: '13px' }}>{formatDate(row.date)}</td>
                  <td style={{ padding: '12px', fontWeight: '600', color: 'var(--color-text)' }}>{row.studentName}</td>
                  <td style={{ padding: '12px', textAlign: 'center', fontFamily: 'monospace' }}>
                    {row.boardedTime ? (
                      <span style={{ color: '#34D399', background: 'rgba(16, 185, 129, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                        {formatTimeOnly(row.boardedTime)}
                      </span>
                    ) : 'N/A'}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center', fontFamily: 'monospace' }}>
                    {row.droppedTime ? (
                      <span style={{ color: '#06B6D4', background: 'rgba(6, 182, 212, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                        {formatTimeOnly(row.droppedTime)}
                      </span>
                    ) : 'N/A'}
                  </td>
                  <td style={{ padding: '12px' }}>{row.routeName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    default:
      return null;
  }
}
