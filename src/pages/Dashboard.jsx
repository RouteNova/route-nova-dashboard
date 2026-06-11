import React from 'react';

/**
 * Vista de Panel de Control (Dashboard) inicial de RouteNova.
 */
export default function Dashboard() {
  return (
    <div className="dashboard-content-wrapper">
      {/* Tarjetas de estadísticas */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '40px' }}>
        <div className="glass-panel" style={{ padding: '24px', boxShadow: 'var(--shadow-card)' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>📍</div>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '16px', color: 'var(--color-text-secondary)', fontWeight: '500' }}>Rutas Activas</h3>
          <div style={{ fontSize: '36px', fontWeight: '800', marginTop: '4px', fontFamily: 'var(--font-heading)' }}>0</div>
        </div>
        <div className="glass-panel" style={{ padding: '24px', boxShadow: 'var(--shadow-card)' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>🚌</div>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '16px', color: 'var(--color-text-secondary)', fontWeight: '500' }}>Autobuses en Operación</h3>
          <div style={{ fontSize: '36px', fontWeight: '800', marginTop: '4px', fontFamily: 'var(--font-heading)' }}>0</div>
        </div>
        <div className="glass-panel" style={{ padding: '24px', boxShadow: 'var(--shadow-card)' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>⚠️</div>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '16px', color: 'var(--color-text-secondary)', fontWeight: '500' }}>Incidencias Activas</h3>
          <div style={{ fontSize: '36px', fontWeight: '800', marginTop: '4px', fontFamily: 'var(--font-heading)' }}>0</div>
        </div>
      </section>

      {/* Sección en construcción */}
      <section className="glass-panel" style={{ padding: '40px', textAlign: 'center', background: 'var(--color-card)' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🛠️</div>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: '700', marginBottom: '8px' }}>Sección en Construcción</h2>
        <p style={{ color: 'var(--color-text-secondary)', maxWidth: '460px', margin: '0 auto' }}>
          Pronto podrás visualizar aquí el mapa en tiempo real con geolocalización GPS, seguimiento de las rutas y alertas de incidencias de RouteNova.
        </p>
      </section>
    </div>
  );
}
