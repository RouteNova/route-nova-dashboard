import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="login-container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '20px' }}>
      <div className="login-card glass-panel animate-slide-up" style={{ textAlign: 'center', maxWidth: '480px', padding: '40px' }}>
        <div style={{ fontSize: '64px', marginBottom: '16px' }}>🔍</div>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '36px', fontWeight: '800', marginBottom: '8px', color: 'var(--color-primary)' }}>404</h1>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '20px', fontWeight: '600', marginBottom: '16px', color: 'var(--color-text)' }}>Página No Encontrada</h2>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '32px' }}>
          Lo sentimos, la página que buscas no existe o ha sido movida a otra ubicación.
        </p>
        <button className="btn-primary" onClick={() => navigate('/dashboard')}>
          Volver al Panel Principal
        </button>
      </div>
    </div>
  );
}
