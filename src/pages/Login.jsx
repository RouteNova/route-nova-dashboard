import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

/**
 * Vista de Inicio de Sesión para el Dashboard de RouteNova.
 */
export default function Login() {
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validaciones básicas de entrada
    if (!correo || !correo.trim()) {
      setError('El correo electrónico es obligatorio.');
      return;
    }
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(correo)) {
      setError('Por favor, introduce una dirección de correo válida.');
      return;
    }
    if (!password || password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setLoading(true);
    try {
      await login(correo, password);
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión. Comprueba tus credenciales.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container animate-fade-in">
      <div className="login-card glass-panel animate-slide-up">
        <div className="brand-section">
          <div className="logo-container">🚌</div>
          <h1 className="brand-name">RouteNova</h1>
          <p className="brand-tagline">Monitoreo Escolar en Tiempo Real</p>
        </div>

        <h2 className="login-title">Iniciar Sesión</h2>

        {error && (
          <div className="login-error">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label" htmlFor="email-input">Correo Electrónico</label>
            <input
              id="email-input"
              type="email"
              className="input-field"
              placeholder="nombre@correo.com"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              disabled={loading}
              autoComplete="email"
            />
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="password-input">Contraseña</label>
            <input
              id="password-input"
              type="password"
              className="input-field"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
          >
            {loading ? 'Iniciando sesión...' : 'Entrar al Panel'}
          </button>
        </form>

        <div className="login-footer">
          <p>© 2026 RouteNova. Todos los derechos reservados.</p>
        </div>
      </div>
      <div className="background-decoration"></div>
    </div>
  );
}
