import { authService } from '../services/api';

/**
 * Vista de Panel de Control (Dashboard) inicial de RouteNova.
 */
export default function Dashboard({ user, onLogout }) {
  const handleLogout = () => {
    authService.logout();
    onLogout();
  };

  return (
    <div className="dashboard-container animate-fade-in">
      <aside className="sidebar glass-panel" style={{ borderRadius: 0, borderTop: 'none', borderBottom: 'none', borderLeft: 'none' }}>
        <div style={{ marginBottom: '40px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '24px' }}>🚌</span>
          <span style={{ fontFamily: 'var(--heading)', fontWeight: '800', fontSize: '20px' }}>RouteNova</span>
        </div>
        
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
          <div style={{ padding: '12px 16px', background: 'hsla(var(--primary-hsl), 0.1)', color: 'var(--primary)', borderRadius: 'var(--radius-sm)', fontWeight: '600', cursor: 'pointer' }}>
            📊 Panel Principal
          </div>
          <div style={{ padding: '12px 16px', color: 'var(--text-secondary)', borderRadius: 'var(--radius-sm)', cursor: 'not-allowed' }}>
            🚌 Autobuses
          </div>
          <div style={{ padding: '12px 16px', color: 'var(--text-secondary)', borderRadius: 'var(--radius-sm)', cursor: 'not-allowed' }}>
            📍 Rutas
          </div>
          <div style={{ padding: '12px 16px', color: 'var(--text-secondary)', borderRadius: 'var(--radius-sm)', cursor: 'not-allowed' }}>
            ⚠️ Incidencias
          </div>
        </nav>

        <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
          <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>{user.nombre}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px', textOverflow: 'ellipsis', overflow: 'hidden' }}>{user.correo}</div>
          <button 
            onClick={handleLogout}
            className="btn-primary" 
            style={{ padding: '10px 16px', fontSize: '14px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-primary)', boxShadow: 'none' }}
          >
            Cerrar Sesión
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--heading)', fontSize: '32px', fontWeight: '800', margin: 0 }}>Panel Principal</h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>Bienvenido de vuelta, {user.nombre}.</p>
          </div>
          <div style={{ padding: '8px 16px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', borderRadius: '100px', fontSize: '14px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', background: 'var(--success)', borderRadius: '50%' }}></span>
            Servicios API Operativos
          </div>
        </header>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '40px' }}>
          <div className="glass-panel" style={{ padding: '24px', boxShadow: 'var(--shadow-md)' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>📍</div>
            <h3 style={{ fontFamily: 'var(--heading)', fontSize: '16px', color: 'var(--text-secondary)', fontWeight: '500' }}>Rutas Activas</h3>
            <div style={{ fontSize: '36px', fontWeight: '800', marginTop: '4px', fontFamily: 'var(--heading)' }}>0</div>
          </div>
          <div className="glass-panel" style={{ padding: '24px', boxShadow: 'var(--shadow-md)' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>🚌</div>
            <h3 style={{ fontFamily: 'var(--heading)', fontSize: '16px', color: 'var(--text-secondary)', fontWeight: '500' }}>Autobuses en Operación</h3>
            <div style={{ fontSize: '36px', fontWeight: '800', marginTop: '4px', fontFamily: 'var(--heading)' }}>0</div>
          </div>
          <div className="glass-panel" style={{ padding: '24px', boxShadow: 'var(--shadow-md)' }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>⚠️</div>
            <h3 style={{ fontFamily: 'var(--heading)', fontSize: '16px', color: 'var(--text-secondary)', fontWeight: '500' }}>Incidencias Activas</h3>
            <div style={{ fontSize: '36px', fontWeight: '800', marginTop: '4px', fontFamily: 'var(--heading)' }}>0</div>
          </div>
        </section>

        <section className="glass-panel" style={{ padding: '40px', textAlign: 'center', background: 'var(--card-bg)' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🛠️</div>
          <h2 style={{ fontFamily: 'var(--heading)', fontWeight: '700', marginBottom: '8px' }}>Sección en Construcción</h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '460px', margin: '0 auto' }}>
            Pronto podrás visualizar aquí el mapa en tiempo real con geolocalización GPS, seguimiento de las rutas y alertas de incidencias de RouteNova.
          </p>
        </section>
      </main>
    </div>
  );
}
