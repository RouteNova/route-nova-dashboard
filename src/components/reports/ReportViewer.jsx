import React from 'react';
import ReportTable from './ReportTable';

export default function ReportViewer({ 
  reportType, 
  data = [], 
  filters = {}, 
  routes = [],
  printableRef 
}) {
  const getReportName = () => {
    switch (reportType) {
      case 'students': return 'Reporte de Estudiantes Transportados';
      case 'incidents': return 'Reporte de Incidencias en Ruta';
      case 'routes': return 'Reporte de Rutas Completadas';
      case 'boarding': return 'Reporte de Abordajes y Descensos';
      default: return 'Reporte Administrativo';
    }
  };

  const getActiveFilterSummary = () => {
    const parts = [];
    
    // Fechas
    if (filters.startDate && filters.endDate) {
      parts.push(`Periodo: del ${new Date(filters.startDate).toLocaleDateString()} al ${new Date(filters.endDate).toLocaleDateString()}`);
    } else if (filters.startDate) {
      parts.push(`Desde: ${new Date(filters.startDate).toLocaleDateString()}`);
    } else if (filters.endDate) {
      parts.push(`Hasta: ${new Date(filters.endDate).toLocaleDateString()}`);
    } else {
      parts.push('Periodo: Historial Completo');
    }

    // Ruta
    if (filters.routeId) {
      const match = routes.find(r => (r._id || r.id) === filters.routeId);
      parts.push(`Ruta: ${match ? match.nombre : 'Seleccionada'}`);
    } else {
      parts.push('Ruta: Todas');
    }

    // Otros específicos
    if (reportType === 'incidents') {
      if (filters.severity) parts.push(`Gravedad: ${filters.severity.toUpperCase()}`);
      if (filters.status) parts.push(`Estado: ${filters.status}`);
    } else if (reportType === 'students' || reportType === 'boarding') {
      if (filters.search) parts.push(`Búsqueda: "${filters.search}"`);
    }

    return parts.join(' | ');
  };

  // Calcular estadísticas para las tarjetas resumen
  const getSummaryStats = () => {
    if (!data || data.length === 0) return null;

    switch (reportType) {
      case 'students':
        const totalRows = data.length;
        const boardedCount = data.filter(d => d.boarded).length;
        const droppedCount = data.filter(d => d.dropped).length;
        return [
          { label: 'Total Registros', value: totalRows, color: 'var(--color-primary)' },
          { label: 'Estudiantes Abordados', value: boardedCount, color: 'var(--color-success)' },
          { label: 'Estudiantes Descendidos', value: droppedCount, color: '#06B6D4' }
        ];

      case 'incidents':
        const totalIncidents = data.length;
        const criticalCount = data.filter(d => d.severity === 'critical' || d.severity === 'high').length;
        const resolvedCount = data.filter(d => d.status === 'resolved' || d.status === 'closed').length;
        return [
          { label: 'Total Incidencias', value: totalIncidents, color: 'var(--color-primary)' },
          { label: 'Gravedad Alta/Crítica', value: criticalCount, color: 'var(--color-danger)' },
          { label: 'Resueltas / Cerradas', value: resolvedCount, color: 'var(--color-success)' }
        ];

      case 'routes':
        const totalRoutes = data.length;
        const totalIncidentsInRoutes = data.reduce((acc, d) => acc + (d.incidentCount || 0), 0);
        const avgDuration = Math.round(data.reduce((acc, d) => acc + (d.durationMinutes || 0), 0) / totalRoutes) || 0;
        
        const hrs = Math.floor(avgDuration / 60);
        const mins = avgDuration % 60;
        const avgDurationStr = hrs > 0 ? `${hrs}h ${mins}min` : `${mins}min`;

        return [
          { label: 'Recorridos Completados', value: totalRoutes, color: 'var(--color-success)' },
          { label: 'Duración Promedio', value: avgDurationStr, color: '#06B6D4' },
          { label: 'Total Incidencias', value: totalIncidentsInRoutes, color: 'var(--color-warning)' }
        ];

      case 'boarding':
        const totalScans = data.length;
        const scansBoarded = data.filter(d => d.boardedTime).length;
        const scansDropped = data.filter(d => d.droppedTime).length;
        return [
          { label: 'Total Operaciones QR', value: totalScans, color: 'var(--color-primary)' },
          { label: 'Abordajes QR', value: scansBoarded, color: 'var(--color-success)' },
          { label: 'Descensos QR', value: scansDropped, color: '#06B6D4' }
        ];

      default:
        return null;
    }
  };

  const stats = getSummaryStats();

  return (
    <div 
      ref={printableRef}
      className="glass-panel"
      style={{
        padding: '24px',
        border: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-lg)',
        color: 'var(--color-text)',
        background: 'var(--color-card)',
        borderRadius: 'var(--radius-lg)',
        width: '100%',
        minHeight: '600px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transition: 'all 0.3s'
      }}
    >
      <div>
        {/* Cabecera institucional imprimible */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '2px solid var(--color-border)',
          paddingBottom: '20px',
          marginBottom: '24px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontSize: '24px' }}>🚌</span>
              <span style={{ fontFamily: 'var(--font-heading)', fontWeight: '800', fontSize: '20px', color: 'var(--color-primary)' }}>RouteNova</span>
            </div>
            <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)', margin: 0 }}>
              Sistema Inteligente de Transporte Escolar y Monitoreo en Vivo
            </p>
          </div>
          
          <div style={{ textAlign: 'right' }}>
            <h2 style={{ 
              fontFamily: 'var(--font-heading)', 
              fontWeight: '800', 
              fontSize: '18px', 
              color: 'var(--color-text)',
              margin: 0
            }}>
              {getReportName()}
            </h2>
            <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: '4px 0 0 0' }}>
              {getActiveFilterSummary()}
            </p>
          </div>
        </div>

        {/* Tarjetas resumen de estadísticas */}
        {stats && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '16px',
            marginBottom: '28px'
          }}>
            {stats.map((stat, idx) => (
              <div 
                key={idx}
                style={{
                  padding: '16px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--color-border)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}
              >
                <span style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', fontWeight: '500' }}>
                  {stat.label}
                </span>
                <span style={{ 
                  fontSize: '22px', 
                  fontWeight: '800', 
                  color: stat.color,
                  fontFamily: 'var(--font-heading)'
                }}>
                  {stat.value}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Tabla del reporte */}
        <div style={{ marginBottom: '32px' }}>
          <ReportTable 
            reportType={reportType}
            data={data}
          />
        </div>
      </div>

      {/* Pie de página institucional */}
      <div style={{
        borderTop: '1px solid var(--color-border)',
        paddingTop: '16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '11px',
        color: 'var(--color-text-secondary)'
      }}>
        <span>
          Generado el {new Date().toLocaleString()} por Panel de Control RouteNova
        </span>
        <span style={{ fontWeight: '500' }}>
          Confidencial - Uso Administrativo Interno
        </span>
      </div>
    </div>
  );
}
