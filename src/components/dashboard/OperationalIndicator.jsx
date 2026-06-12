import React from 'react';

export default function OperationalIndicator({ complianceRate = 95, avgDuration = 45, avgDelay = 8, incidentRate = 2.5 }) {
  
  // Determinar color de cumplimiento
  const getComplianceColor = (rate) => {
    if (rate >= 90) return 'var(--color-success)';
    if (rate >= 75) return 'var(--color-warning)';
    return 'var(--color-danger)';
  };

  // Determinar color de tasa de incidencias
  const getIncidentRateColor = (rate) => {
    if (rate <= 3) return 'var(--color-success)';
    if (rate <= 8) return 'var(--color-warning)';
    return 'var(--color-danger)';
  };

  return (
    <div className="glass-panel" style={{ padding: '24px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
      <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '15.5px', fontWeight: '700', color: 'var(--color-text)', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        🧠 Indicadores y Estadísticas Analíticas de Operación (TFM)
      </h3>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '24px'
      }}>
        
        {/* Indicador 1: Cumplimiento de Rutas */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div style={{ position: 'relative', width: '100px', height: '100px', marginBottom: '12px' }}>
            {/* SVG Circular Gauge */}
            <svg width="100" height="100" viewBox="0 0 36 36">
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="rgba(255, 255, 255, 0.03)"
                strokeWidth="3.5"
              />
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke={getComplianceColor(complianceRate)}
                strokeWidth="3.5"
                strokeDasharray={`${complianceRate}, 100`}
                strokeLinecap="round"
                style={{
                  transition: 'stroke-dasharray 0.5s ease'
                }}
              />
            </svg>
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontSize: '18px',
              fontWeight: '800',
              fontFamily: 'var(--font-heading)',
              color: 'var(--color-text)'
            }}>
              {complianceRate}%
            </div>
          </div>
          <span style={{ fontSize: '13.5px', fontWeight: '600', color: 'var(--color-text)' }}>Cumplimiento de Rutas</span>
          <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>Rutas completadas / programadas</span>
        </div>

        {/* Indicador 2: Tiempo Promedio de Ruta */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'rgba(37, 99, 235, 0.1)',
            border: '1px solid rgba(37, 99, 235, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '22px',
            fontWeight: '800',
            color: '#60A5FA',
            fontFamily: 'var(--font-heading)',
            marginBottom: '16px'
          }}>
            {avgDuration}m
          </div>
          <span style={{ fontSize: '13.5px', fontWeight: '600', color: 'var(--color-text)' }}>Tiempo Promedio de Ruta</span>
          <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>Duración media del recorrido</span>
        </div>

        {/* Indicador 3: Retraso Promedio */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '22px',
            fontWeight: '800',
            color: '#FBBF24',
            fontFamily: 'var(--font-heading)',
            marginBottom: '16px'
          }}>
            {avgDelay}m
          </div>
          <span style={{ fontSize: '13.5px', fontWeight: '600', color: 'var(--color-text)' }}>Retraso Promedio</span>
          <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>Desfase promedio en rutas retrasadas</span>
        </div>

        {/* Indicador 4: Tasa de Incidencias */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div style={{ position: 'relative', width: '100px', height: '100px', marginBottom: '12px' }}>
            {/* SVG Circular Gauge */}
            <svg width="100" height="100" viewBox="0 0 36 36">
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="rgba(255, 255, 255, 0.03)"
                strokeWidth="3.5"
              />
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke={getIncidentRateColor(incidentRate)}
                strokeWidth="3.5"
                strokeDasharray={`${incidentRate * 10}, 100`} // Tasa * 10 para escala visible
                strokeLinecap="round"
                style={{
                  transition: 'stroke-dasharray 0.5s ease'
                }}
              />
            </svg>
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontSize: '18px',
              fontWeight: '800',
              fontFamily: 'var(--font-heading)',
              color: 'var(--color-text)'
            }}>
              {incidentRate}%
            </div>
          </div>
          <span style={{ fontSize: '13.5px', fontWeight: '600', color: 'var(--color-text)' }}>Tasa de Incidencias</span>
          <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>Incidencias promedio por recorrido</span>
        </div>

      </div>
    </div>
  );
}
