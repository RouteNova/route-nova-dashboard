import React from 'react';
import { 
  FaBus, 
  FaUserTie, 
  FaRoute, 
  FaGraduationCap, 
  FaClock, 
  FaExclamationTriangle,
  FaTimes
} from 'react-icons/fa';

export default function BusMarker({ selectedRoute, onClose }) {
  if (!selectedRoute) return null;

  const { route, conductor, autobus, estudiantesStats } = selectedRoute;

  return (
    <div className="glass-panel animate-slide-up" style={{
      position: 'absolute',
      top: '20px',
      right: '20px',
      width: '320px',
      zIndex: 100,
      padding: '20px',
      boxShadow: 'var(--shadow-lg)',
      background: 'rgba(255, 255, 255, 0.85)',
      color: '#1E293B',
      border: '1px solid var(--color-border)',
      display: 'flex',
      flexDirection: 'column',
      gap: '14px'
    }}>
      {/* Cabecera */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ 
            background: 'rgba(37, 99, 235, 0.1)', 
            color: 'var(--color-primary)', 
            width: '32px', 
            height: '32px', 
            borderRadius: '50%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center' 
          }}>
            <FaBus />
          </div>
          <div>
            <h4 style={{ fontWeight: '800', margin: 0, fontSize: '15px', textTransform: 'uppercase' }}>
              {autobus?.patente || 'S/P'}
            </h4>
            <span style={{ fontSize: '11px', color: '#64748B' }}>
              {autobus?.modelo || 'Modelo Desconocido'}
            </span>
          </div>
        </div>
        <button 
          onClick={onClose} 
          style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: '4px' }}
          title="Cerrar detalles"
        >
          <FaTimes />
        </button>
      </div>

      {/* Alerta de Desvío */}
      {route?.desviada && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.08)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          borderRadius: 'var(--radius-md)',
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: 'var(--color-danger)',
          fontSize: '12px',
          fontWeight: '600'
        }}>
          <FaExclamationTriangle className="spin" style={{ animation: 'pulse 1.5s ease-in-out infinite' }} />
          <span>¡ALERTA! Vehículo fuera de la ruta programada.</span>
        </div>
      )}

      {/* Información Operativa */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
        {/* Ruta */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <FaRoute style={{ color: 'var(--color-primary)' }} />
          <div>
            <span style={{ fontWeight: '500' }}>Ruta: </span>
            <span>{route?.nombre}</span>
          </div>
        </div>

        {/* Conductor */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <FaUserTie style={{ color: 'var(--color-primary)' }} />
          <div>
            <span style={{ fontWeight: '500' }}>Conductor: </span>
            <span>{conductor?.nombre || 'N/A'}</span>
          </div>
        </div>

        {/* Horarios */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <FaClock style={{ color: 'var(--color-primary)' }} />
          <div>
            <span style={{ fontWeight: '500' }}>Horario: </span>
            <span>{route?.horaSalida} - {route?.horaLlegada}</span>
          </div>
        </div>

        {/* ETA */}
        {route?.eta !== null && route?.eta !== undefined && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', color: '#10B981', fontWeight: '600' }}>
            <FaClock />
            <div>
              <span>Llegada estimada (ETA): </span>
              <span>{route.eta} mins</span>
            </div>
          </div>
        )}
      </div>

      {/* Estadísticas de Estudiantes */}
      <div style={{
        background: 'rgba(0, 0, 0, 0.02)',
        borderRadius: 'var(--radius-md)',
        padding: '12px',
        border: '1px solid var(--color-border)'
      }}>
        <h5 style={{ fontWeight: '700', fontSize: '12px', color: '#64748B', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <FaGraduationCap /> ESTADO DE ABORDAJE HOY
        </h5>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', textAlign: 'center' }}>
          <div style={{ background: 'var(--color-card)', padding: '6px', borderRadius: '4px', border: '1px solid var(--color-border)' }}>
            <div style={{ fontSize: '16px', fontWeight: '800', color: '#2563EB' }}>
              {estudiantesStats?.esperando || 0}
            </div>
            <div style={{ fontSize: '9px', color: '#64748B', fontWeight: '500' }}>Esperando</div>
          </div>
          <div style={{ background: 'var(--color-card)', padding: '6px', borderRadius: '4px', border: '1px solid var(--color-border)' }}>
            <div style={{ fontSize: '16px', fontWeight: '800', color: '#8B5CF6' }}>
              {estudiantesStats?.aBordo || 0}
            </div>
            <div style={{ fontSize: '9px', color: '#64748B', fontWeight: '500' }}>A Bordo</div>
          </div>
          <div style={{ background: 'var(--color-card)', padding: '6px', borderRadius: '4px', border: '1px solid var(--color-border)' }}>
            <div style={{ fontSize: '16px', fontWeight: '800', color: '#10B981' }}>
              {estudiantesStats?.descendidos || 0}
            </div>
            <div style={{ fontSize: '9px', color: '#64748B', fontWeight: '500' }}>Completado</div>
          </div>
        </div>
      </div>
    </div>
  );
}
