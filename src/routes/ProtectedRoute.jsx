import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: 'var(--color-background)' }}>
        <div className="glass-panel animate-fade-in" style={{ padding: '32px 48px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '48px' }}>🚌</span>
          <div className="spinner"></div>
          <p style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-heading)', fontWeight: '600', margin: 0 }}>Verificando sesión...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Verificar autorización por roles
  if (allowedRoles && !allowedRoles.includes(user.rol)) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: 'var(--color-background)' }}>
        <div className="glass-panel animate-fade-in" style={{ padding: '40px 48px', textAlign: 'center', maxWidth: '480px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
          <span style={{ fontSize: '56px' }}>🚫</span>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: '800', margin: 0, color: 'var(--color-danger)' }}>Acceso Restringido</h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '15px', lineHeight: '1.6', margin: 0 }}>
            Tu cuenta con el rol <strong style={{ textTransform: 'capitalize' }}>{user.rol}</strong> no dispone de permisos suficientes para acceder a esta sección del sistema.
          </p>
          <button 
            onClick={() => window.location.href = '/login'}
            className="btn-primary" 
            style={{ marginTop: '8px', padding: '10px 24px', width: 'auto' }}
          >
            Volver al Inicio
          </button>
        </div>
      </div>
    );
  }

  return children;
}
