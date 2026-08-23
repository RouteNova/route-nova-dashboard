import React, { useState } from 'react';
import { FaRoute, FaClock, FaUserTie, FaBus, FaPlayCircle, FaPauseCircle, FaList } from 'react-icons/fa';

const ROUTE_COLORS = [
  '#3B82F6', // Azul
  '#10B981', // Verde esmeralda
  '#F59E0B', // Amarillo/Ambar
  '#EF4444', // Rojo/Carmesí
  '#EC4899', // Rosa/Magenta
  '#8B5CF6', // Violeta/Morado
  '#06B6D4', // Cian
  '#F97316', // Naranja
  '#14B8A6', // Teal
  '#6366F1'  // Indigo
];

export default function RouteStatus({ activeRoutes = [], allRoutes = [], selectedRouteId, onSelectRoute }) {
  const [tab, setTab] = useState('active'); // 'active' | 'passive' | 'all'

  // Calcula el porcentaje de progreso basado en la distancia recorrida del trayecto (Punto A -> Punto B)
  const calculateRouteProgress = (item) => {
    const distTotal = item.distanciaTotal ?? item.route?.distanciaTotal;
    const distRestante = item.distanciaRestante ?? item.route?.distanciaRestante;

    if (distTotal && distTotal > 0 && distRestante !== undefined && distRestante !== null) {
      const traveled = Math.max(0, distTotal - distRestante);
      const pct = Math.round((traveled / distTotal) * 100);
      return Math.min(100, Math.max(0, pct));
    }

    const estado = item.estado || item.route?.estado;
    if (estado === 'finalizada') return 100;

    // Fallback con estadísticas de estudiantes si aún no se ha calculado telemetría
    if (item.estudiantesStats && item.estudiantesStats.total > 0) {
      const points = ((item.estudiantesStats.aBordo || 0) * 0.5) + (item.estudiantesStats.descendidos || 0);
      return Math.min(100, Math.round((points / item.estudiantesStats.total) * 100));
    }

    return 0;
  };

  const passiveRoutes = allRoutes.filter(r => r.estado !== 'en_curso');

  let currentList = [];
  if (tab === 'active') {
    currentList = activeRoutes;
  } else if (tab === 'passive') {
    currentList = passiveRoutes;
  } else {
    currentList = allRoutes;
  }

  const getStatusBadge = (estado) => {
    switch (estado) {
      case 'en_curso':
        return <span className="status-badge active" style={{ fontSize: '11px', padding: '2px 8px' }}>En Vivo</span>;
      case 'programada':
        return <span className="status-badge" style={{ fontSize: '11px', padding: '2px 8px', background: 'rgba(59, 130, 246, 0.12)', color: '#3B82F6', border: '1px solid rgba(59, 130, 246, 0.25)' }}>Programada</span>;
      case 'finalizada':
        return <span className="status-badge" style={{ fontSize: '11px', padding: '2px 8px', background: 'rgba(139, 92, 246, 0.12)', color: '#8B5CF6', border: '1px solid rgba(139, 92, 246, 0.25)' }}>Finalizada</span>;
      default:
        return <span className="status-badge" style={{ fontSize: '11px', padding: '2px 8px', background: 'rgba(107, 114, 128, 0.12)', color: '#6B7280', border: '1px solid rgba(107, 114, 128, 0.25)' }}>Inactiva</span>;
    }
  };

  return (
    <div className="glass-panel" style={{
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '14px',
      height: '100%',
      minHeight: '350px'
    }}>
      {/* Cabecera con selector de pestañas */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <h3 style={{ 
          fontFamily: 'var(--font-heading)', 
          fontWeight: '800', 
          fontSize: '16px', 
          color: 'var(--color-text)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          margin: 0
        }}>
          <FaRoute style={{ color: 'var(--color-primary)' }} /> EXPLORADOR DE RUTAS
        </h3>

        {/* Pestañas de Filtrado (En Vivo / Pasivas / Todas) */}
        <div style={{ display: 'flex', gap: '4px', background: 'rgba(0,0,0,0.03)', padding: '4px', borderRadius: '100px', border: '1px solid var(--color-border)' }}>
          <button
            type="button"
            onClick={() => setTab('active')}
            style={{
              flex: 1,
              padding: '6px 8px',
              borderRadius: '100px',
              border: 'none',
              fontSize: '11.5px',
              fontWeight: '700',
              cursor: 'pointer',
              background: tab === 'active' ? 'var(--color-primary)' : 'transparent',
              color: tab === 'active' ? '#fff' : 'var(--color-text-secondary)',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px'
            }}
          >
            <FaPlayCircle /> En Vivo ({activeRoutes.length})
          </button>
          
          <button
            type="button"
            onClick={() => setTab('passive')}
            style={{
              flex: 1,
              padding: '6px 8px',
              borderRadius: '100px',
              border: 'none',
              fontSize: '11.5px',
              fontWeight: '700',
              cursor: 'pointer',
              background: tab === 'passive' ? 'var(--color-primary)' : 'transparent',
              color: tab === 'passive' ? '#fff' : 'var(--color-text-secondary)',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px'
            }}
          >
            <FaPauseCircle /> Sin Iniciar ({passiveRoutes.length})
          </button>

          <button
            type="button"
            onClick={() => setTab('all')}
            style={{
              flex: 1,
              padding: '6px 8px',
              borderRadius: '100px',
              border: 'none',
              fontSize: '11.5px',
              fontWeight: '700',
              cursor: 'pointer',
              background: tab === 'all' ? 'var(--color-primary)' : 'transparent',
              color: tab === 'all' ? '#fff' : 'var(--color-text-secondary)',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px'
            }}
          >
            <FaList /> Todas ({allRoutes.length})
          </button>
        </div>
      </div>

      {currentList.length === 0 ? (
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '30px 20px',
          textAlign: 'center',
          color: 'var(--color-text-secondary)'
        }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>🚌💤</div>
          <h4 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--color-text)', marginBottom: '4px' }}>
            {tab === 'active' ? 'No hay rutas en curso' : 'No hay rutas en esta categoría'}
          </h4>
          <p style={{ fontSize: '12px' }}>
            {tab === 'active' 
              ? 'Actualmente no hay transportes escolares transmitiendo GPS en tiempo real.' 
              : 'Selecciona otra pestaña para consultar el mapa y datos de las rutas escolares.'}
          </p>
        </div>
      ) : (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          overflowY: 'auto',
          flex: 1
        }}>
          {currentList.map((item, index) => {
            const routeId = item.route?.id || item.route?._id || item._id;
            const routeName = item.route?.nombre || item.nombre;
            const isSelected = selectedRouteId === routeId;
            const isActive = item.estado === 'en_curso' || item.route?.estado === 'en_curso';
            const progress = isActive ? calculateRouteProgress(item) : (item.estado === 'finalizada' || item.route?.estado === 'finalizada' ? 100 : 0);
            const routeColor = ROUTE_COLORS[index % ROUTE_COLORS.length];

            const driverName = item.conductor?.nombre || item.conductorId?.nombre || item.conductorId?.usuarioId?.nombre || 'Sin asignar';
            const busPlate = item.autobus?.patente || item.autobusId?.patente || 'Sin autobús';
            const horaSalida = item.route?.horaSalida || item.horaSalida || '--:--';
            const horaLlegada = item.route?.horaLlegada || item.horaLlegada || '--:--';
            const puntosCount = (item.puntosRuta || item.puntosProgramados || item.route?.puntosRuta || []).length;

            return (
              <div 
                key={routeId}
                onClick={() => onSelectRoute(routeId)}
                className="glass-panel"
                style={{
                  padding: '14px',
                  cursor: 'pointer',
                  border: isSelected ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                  borderLeft: `5px solid ${routeColor}`,
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
                    {routeName}
                  </span>
                  {getStatusBadge(isActive ? 'en_curso' : (item.estado || item.route?.estado || 'programada'))}
                </div>

                {/* Info básica */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <FaClock /> {horaSalida} - {horaLlegada}
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <FaBus /> {busPlate}
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', gridColumn: 'span 2' }}>
                    <FaUserTie /> Conductor: {driverName}
                  </span>
                  {puntosCount > 0 && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', gridColumn: 'span 2', fontSize: '10.5px', color: 'var(--color-text-secondary)' }}>
                      📍 {puntosCount} paradas / hitos registrados
                    </span>
                  )}
                </div>

                {/* Barra de Progreso sólo si está en curso */}
                {isActive && (
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
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
