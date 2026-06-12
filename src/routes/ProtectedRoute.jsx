import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
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

  return children;
}
