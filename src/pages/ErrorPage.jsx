import React from 'react';

export default function ErrorPage({ error, resetErrorBoundary }) {
  return (
    <div className="login-container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '20px' }}>
      <div className="login-card glass-panel animate-slide-up" style={{ textAlign: 'center', maxWidth: '520px', padding: '40px' }}>
        <div style={{ fontSize: '64px', marginBottom: '16px' }}>⚠️</div>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '24px', fontWeight: '800', marginBottom: '8px', color: 'var(--color-danger)' }}>
          ¡Ups! Algo salió mal
        </h1>
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '16px', fontWeight: '600', marginBottom: '16px', color: 'var(--color-text)' }}>
          Ha ocurrido un error inesperado en la aplicación.
        </h2>
        
        {error && (
          <div style={{ 
            background: 'rgba(239, 68, 68, 0.08)', 
            border: '1px solid rgba(239, 68, 68, 0.2)', 
            borderRadius: 'var(--radius-md)', 
            padding: '16px', 
            fontSize: '14px', 
            fontFamily: 'monospace', 
            textAlign: 'left', 
            color: 'var(--color-danger)', 
            marginBottom: '24px',
            overflowX: 'auto',
            maxHeight: '150px',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word'
          }}>
            {error.message || error.toString()}
          </div>
        )}

        <button className="btn-primary" onClick={resetErrorBoundary || (() => window.location.href = '/')}>
          Reintentar / Volver a Cargar
        </button>
      </div>
    </div>
  );
}
