import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { settingsService } from '../../services/api';

export default function NotificationSettings({ settings, onUpdateSettings }) {
  const [incidents, setIncidents] = useState(true);
  const [delays, setDelays] = useState(true);
  const [deviations, setDeviations] = useState(true);
  const [boardings, setBoardings] = useState(false);
  const [sound, setSound] = useState(true);
  const [frequency, setFrequency] = useState('immediate');
  const [push, setPush] = useState(true);
  const [email, setEmail] = useState(true);
  const [sms, setSms] = useState(false);

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings && settings.notifications) {
      setIncidents(settings.notifications.incidents ?? true);
      setDelays(settings.notifications.delays ?? true);
      setDeviations(settings.notifications.deviations ?? true);
      setBoardings(settings.notifications.boardings ?? false);
      setSound(settings.notifications.sound ?? true);
      setFrequency(settings.notifications.frequency || 'immediate');
      
      const types = settings.notifications.alertTypes || ['push'];
      setPush(types.includes('push'));
      setEmail(types.includes('email'));
      setSms(types.includes('sms'));
    }
  }, [settings]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setSaving(true);
    try {
      const alertTypes = [];
      if (push) alertTypes.push('push');
      if (email) alertTypes.push('email');
      if (sms) alertTypes.push('sms');

      const payload = {
        notifications: {
          incidents,
          delays,
          deviations,
          boardings,
          sound,
          frequency,
          alertTypes
        }
      };

      const updated = await settingsService.updateSettings(payload);
      toast.success('Preferencias de notificación guardadas.');
      if (onUpdateSettings) {
        onUpdateSettings(updated);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const toggleStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    background: 'rgba(255, 255, 255, 0.01)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-md)',
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: '700', margin: 0 }}>
          🔔 Preferencias de Notificaciones
        </h4>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '13.5px', marginTop: '4px', marginBottom: 0 }}>
          Configura qué alertas deseas recibir en vivo, el canal de comunicación y las alertas sonoras en tu terminal.
        </p>
      </div>

      {/* Tipos de Alertas */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <h5 style={{ fontFamily: 'var(--font-heading)', fontSize: '14.5px', fontWeight: '600', color: 'var(--color-text)', margin: 0 }}>
          Eventos del Sistema
        </h5>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
          
          <div style={toggleStyle}>
            <span style={{ fontSize: '13.5px', fontWeight: '500' }}>⚠️ Nuevas Incidencias</span>
            <input 
              type="checkbox" 
              checked={incidents} 
              onChange={(e) => setIncidents(e.target.checked)} 
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
          </div>

          <div style={toggleStyle}>
            <span style={{ fontSize: '13.5px', fontWeight: '500' }}>🕒 Retrasos de Rutas</span>
            <input 
              type="checkbox" 
              checked={delays} 
              onChange={(e) => setDelays(e.target.checked)} 
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
          </div>

          <div style={toggleStyle}>
            <span style={{ fontSize: '13.5px', fontWeight: '500' }}>📍 Desvíos de Recorrido</span>
            <input 
              type="checkbox" 
              checked={deviations} 
              onChange={(e) => setDeviations(e.target.checked)} 
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
          </div>

          <div style={toggleStyle}>
            <span style={{ fontSize: '13.5px', fontWeight: '500' }}>✅ Eventos de Abordaje/Descenso</span>
            <input 
              type="checkbox" 
              checked={boardings} 
              onChange={(e) => setBoardings(e.target.checked)} 
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
          </div>

        </div>
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: 0 }} />

      {/* Canales y Preferencias */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
        
        {/* Canales */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h5 style={{ fontFamily: 'var(--font-heading)', fontSize: '14.5px', fontWeight: '600', color: 'var(--color-text)', margin: 0 }}>
            Canales de Alerta
          </h5>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13.5px', cursor: 'pointer' }}>
              <input type="checkbox" checked={push} onChange={(e) => setPush(e.target.checked)} style={{ width: '16px', height: '16px' }} />
              <span>Notificaciones Push FCM (App Móvil)</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13.5px', cursor: 'pointer' }}>
              <input type="checkbox" checked={email} onChange={(e) => setEmail(e.target.checked)} style={{ width: '16px', height: '16px' }} />
              <span>Correo Electrónico (Notificaciones SMTP)</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13.5px', cursor: 'pointer' }}>
              <input type="checkbox" checked={sms} onChange={(e) => setSms(e.target.checked)} style={{ width: '16px', height: '16px' }} />
              <span>Mensajería SMS Directa</span>
            </label>
          </div>
        </div>

        {/* Frecuencia y Sonido */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h5 style={{ fontFamily: 'var(--font-heading)', fontSize: '14.5px', fontWeight: '600', color: 'var(--color-text)', margin: 0 }}>
            Ajustes de Interfaz
          </h5>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13.5px', cursor: 'pointer' }}>
              <input type="checkbox" checked={sound} onChange={(e) => setSound(e.target.checked)} style={{ width: '16px', height: '16px' }} />
              <span>🔊 Activar sonido para alertas críticas</span>
            </label>

            <div className="input-group" style={{ margin: 0 }}>
              <span className="input-label" style={{ fontSize: '12.5px' }}>Frecuencia de Envío</span>
              <select 
                className="input-field" 
                value={frequency} 
                onChange={(e) => setFrequency(e.target.value)}
                style={{ padding: '8px 12px', fontSize: '13px', cursor: 'pointer' }}
              >
                <option value="immediate">Inmediata (En tiempo real)</option>
                <option value="hourly">Resumen por Hora</option>
                <option value="daily">Resumen Diario al Finalizar</option>
              </select>
            </div>
          </div>
        </div>

      </div>

      <button
        type="submit"
        className="btn-primary"
        disabled={saving}
        style={{ width: 'auto', alignSelf: 'flex-start', padding: '12px 24px', fontSize: '14.5px', marginTop: '8px' }}
      >
        {saving ? 'Guardando...' : '💾 Guardar Preferencias'}
      </button>
    </form>
  );
}
