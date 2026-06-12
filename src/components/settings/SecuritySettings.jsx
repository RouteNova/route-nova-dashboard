import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { authService, settingsService } from '../../services/api';

export default function SecuritySettings({ settings, onUpdateSettings }) {
  // Cambio de contraseña
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPass, setChangingPass] = useState(false);

  // Reglas de sesión
  const [sessionDuration, setSessionDuration] = useState(8);
  const [autoLogout, setAutoLogout] = useState(true);
  const [savingRules, setSavingRules] = useState(false);

  useEffect(() => {
    if (settings && settings.security) {
      setSessionDuration(settings.security.sessionDuration ?? 8);
      setAutoLogout(settings.security.autoLogout ?? true);
    }
  }, [settings]);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword) {
      return toast.error('Ingrese su contraseña actual.');
    }
    if (newPassword.length < 6) {
      return toast.error('La nueva contraseña debe tener al menos 6 caracteres.');
    }
    if (newPassword !== confirmPassword) {
      return toast.error('Las contraseñas no coinciden.');
    }

    setChangingPass(true);
    try {
      await authService.changePassword({ currentPassword, newPassword });
      toast.success('Contraseña actualizada con éxito.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error(err);
    } finally {
      setChangingPass(false);
    }
  };

  const handleSaveSessionRules = async (e) => {
    e.preventDefault();
    setSavingRules(true);
    try {
      const payload = {
        security: {
          sessionDuration: Number(sessionDuration),
          autoLogout
        }
      };
      const updated = await settingsService.updateSettings(payload);
      toast.success('Reglas de sesión actualizadas.');
      if (onUpdateSettings) {
        onUpdateSettings(updated);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingRules(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      {/* 1. Cambio de Contraseña */}
      <div>
        <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: '700', margin: 0 }}>
          🔒 Cambiar Contraseña
        </h4>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '13.5px', marginTop: '4px', marginBottom: '16px' }}>
          Mantén tu cuenta protegida renovando periódicamente tus credenciales de acceso.
        </p>

        <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '450px' }}>
          <div className="input-group" style={{ margin: 0 }}>
            <label className="input-label">Contraseña Actual</label>
            <input
              type="password"
              className="input-field"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <div className="input-group" style={{ margin: 0 }}>
            <label className="input-label">Nueva Contraseña (mínimo 6 caracteres)</label>
            <input
              type="password"
              className="input-field"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <div className="input-group" style={{ margin: 0 }}>
            <label className="input-label">Confirmar Nueva Contraseña</label>
            <input
              type="password"
              className="input-field"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={changingPass}
            style={{ width: 'auto', alignSelf: 'flex-start', padding: '12px 24px', fontSize: '14.5px', marginTop: '8px' }}
          >
            {changingPass ? 'Actualizando...' : '🔑 Actualizar Contraseña'}
          </button>
        </form>
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: 0 }} />

      {/* 2. Control de Sesión */}
      <div>
        <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: '700', margin: 0 }}>
          🛡️ Control de Sesión y Acceso
        </h4>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '13.5px', marginTop: '4px', marginBottom: '16px' }}>
          Configura las directivas globales para el tiempo de expiración y persistencia de las credenciales de los usuarios en el sistema.
        </p>

        <form onSubmit={handleSaveSessionRules} style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '450px' }}>
          
          <div className="input-group" style={{ margin: 0 }}>
            <label className="input-label">Duración Máxima de la Sesión (horas)</label>
            <input
              type="number"
              className="input-field"
              value={sessionDuration}
              onChange={(e) => setSessionDuration(e.target.value)}
              min="1"
              max="72"
              required
            />
            <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', display: 'block', marginTop: '4px' }}>
              Los tokens JWT expirarán automáticamente tras este periodo.
            </span>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            background: 'rgba(255, 255, 255, 0.01)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
          }}>
            <div>
              <span style={{ fontSize: '13.5px', fontWeight: '600', display: 'block' }}>Cerrar sesión automáticamente</span>
              <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Expulsar al usuario por inactividad tras 15 minutos.</span>
            </div>
            <input 
              type="checkbox" 
              checked={autoLogout} 
              onChange={(e) => setAutoLogout(e.target.checked)} 
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={savingRules}
            style={{ width: 'auto', alignSelf: 'flex-start', padding: '12px 24px', fontSize: '14.5px', marginTop: '8px' }}
          >
            {savingRules ? 'Guardando...' : '💾 Guardar Reglas'}
          </button>
        </form>
      </div>

    </div>
  );
}
