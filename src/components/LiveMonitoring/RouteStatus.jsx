import React from 'react';
import { FaRoute, FaClock, FaUserTie, FaBus, FaPlayCircle } from 'react-icons/fa';

export default function RouteStatus({ activeRoutes, selectedRouteId, onSelectRoute }) {
  
  // Calcula el porcentaje de progreso basado en la fase de abordaje/descenso
  const calculateProgress = (stats) => {
    if (!stats || stats.total === 0) return 0;
    // Otorgamos 0.5 puntos por abordaje y 1 punto por descenso completo
    const points = (stats.aBordo * 0.5) + stats.descendidos;
    return Math.min(100, Math.round((points / stats.total) * 100));
  };

  return (
    <div className="glass-panel" style={{
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
        <FaPlayCircle style={{ color: 'var(--color-secondary)' }} /> RUTAS EN CURSO EN VIVO
      </h3>

      {activeRoutes.length === 0 ? (
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
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>🚌💤</div>
          <h4 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--color-text)', marginBottom: '4px' }}>No hay rutas en curso</h4>
          <p style={{ fontSize: '12px' }}>Actualmente no hay transportes escolares transmitiendo GPS en tiempo real.</p>
        </div>
      ) : (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          overflowY: 'auto',
          flex: 1
        }}>
          {activeRoutes.map((item) => {
            const isSelected = selectedRouteId === item.route.id;
            const progress = calculateProgress(item.estudiantesStats);

            return (
              <div 
                key={item.route.id}
                onClick={() => onSelectRoute(item.route.id)}
                className="glass-panel"
                style={{
                  padding: '16px',
                  cursor: 'pointer',
                  border: isSelected ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                  background: isSelected ? 'rgba(37, 99, 235, 0.03)' : 'var(--color-card)',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                {/* Cabecera Ruta */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: '700', fontSize: '14px', color: 'var(--color-text)' }}>
                    {item.route.nombre}
                  </span>
                  <span className="status-badge active" style={{ fontSize: '11px', padding: '2px 8px' }}>
                    En Vivo
                  </span>
                </div>

                {/* Info básica */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <FaClock /> {item.route.horaSalida} - {item.route.horaLlegada}
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <FaBus /> {item.autobus?.patente || 'S/P'}
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', gridColumn: 'span 2' }}>
                    <FaUserTie /> Conductor: {item.conductor?.nombre || 'N/A'}
                  </span>
                </div>

                {/* Barra de Progreso */}
                <div style={{ marginTop: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: '600', marginBottom: '2px' }}>
                    <span>Progreso del Trayecto</span>
                    <span>{progress}%</span>
                  </div>
                  <div style={{ 
                    width: '100%', 
                    height: '6px', 
                    background: 'var(--color-border)', 
                    borderRadius: '3px',
                    overflow: 'hidden'
                  }}>
                    <div style={{ 
                      width: `${progress}%`, 
                      height: '100%', 
                      background: 'linear-gradient(90deg, var(--color-primary), var(--color-secondary))',
                      borderRadius: '3px',
                      transition: 'width 0.4s ease'
                    }}></div>
                  </div>
                </div>

                {/* Pasajeros status resumido */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  fontSize: '10px', 
                  color: 'var(--color-text-secondary)',
                  borderTop: '1px solid var(--color-border)',
                  paddingTop: '6px',
                  marginTop: '2px'
                }}>
                  <span>Total: <b>{item.estudiantesStats?.total}</b></span>
                  <span>A Bordo: <b style={{ color: '#8B5CF6' }}>{item.estudiantesStats?.aBordo}</b></span>
                  <span>Descendieron: <b style={{ color: 'var(--color-success)' }}>{item.estudiantesStats?.descendidos}</b></span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
