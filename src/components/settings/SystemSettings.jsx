import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { settingsService } from '../../services/api';

export default function SystemSettings({ settings, onUpdateSettings }) {
  // General / Centro Educativo
  const [instName, setInstName] = useState('Colegio RouteNova');
  const [instAddress, setInstAddress] = useState('Av. Principal #123');
  const [instPhone, setInstPhone] = useState('809-555-0199');

  // Transporte
  const [maxDelay, setMaxDelay] = useState(15);
  const [maxDistance, setMaxDistance] = useState(200);
  const [gpsInterval, setGpsInterval] = useState(5);

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      if (settings.institution) {
        setInstName(settings.institution.name || 'Colegio RouteNova');
        setInstAddress(settings.institution.address || 'Av. Principal #123');
        setInstPhone(settings.institution.phone || '809-555-0199');
      }
      if (settings.transport) {
        setMaxDelay(settings.transport.maxDelay || 15);
        setMaxDistance(settings.transport.maxDistance || 200);
        setGpsInterval(settings.transport.gpsInterval || 5);
      }
    }
  }, [settings]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setSaving(true);
    try {
      const payload = {
        institution: {
          name: instName,
          address: instAddress,
          phone: instPhone
        },
        transport: {
          maxDelay: Number(maxDelay),
          maxDistance: Number(maxDistance),
          gpsInterval: Number(gpsInterval)
        }
      };

      const updated = await settingsService.updateSettings(payload);
      toast.success('Configuración del sistema guardada.');
      if (onUpdateSettings) {
        onUpdateSettings(updated);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      
      {/* 1. Información del Centro Educativo */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: '700', margin: 0 }}>
            🏫 Información del Centro Educativo
          </h4>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '13.5px', marginTop: '4px', marginBottom: 0 }}>
            Establece los datos de la institución escolar. Esta información se utilizará de manera formal en reportes PDF, notificaciones y correos.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          <div className="input-group" style={{ margin: 0 }}>
            <label className="input-label">Nombre del Centro Educativo</label>
            <input
              type="text"
              className="input-field"
              value={instName}
              onChange={(e) => setInstName(e.target.value)}
              placeholder="Ej. Colegio RouteNova"
              required
            />
          </div>

          <div className="input-group" style={{ margin: 0 }}>
            <label className="input-label">Teléfono Institucional</label>
            <input
              type="tel"
              className="input-field"
              value={instPhone}
              onChange={(e) => setInstPhone(e.target.value)}
              placeholder="000-000-0000"
            />
          </div>
        </div>

        <div className="input-group" style={{ margin: 0 }}>
          <label className="input-label">Dirección Física</label>
          <input
            type="text"
            className="input-field"
            value={instAddress}
            onChange={(e) => setInstAddress(e.target.value)}
            placeholder="Ej. Av. Principal #123"
          />
        </div>
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: 0 }} />

      {/* 2. Parámetros del Transporte */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: '700', margin: 0 }}>
            🚌 Parámetros de Operación del Transporte
          </h4>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '13.5px', marginTop: '4px', marginBottom: 0 }}>
            Configura las reglas operativas globales del trayecto escolar para el cálculo dinámico de alarmas en Socket.IO, alertas de desvíos y mediciones en Mapbox.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
          <div className="input-group" style={{ margin: 0 }}>
            <label className="input-label">Retraso Máximo Admitido (min)</label>
            <input
              type="number"
              className="input-field"
              value={maxDelay}
              onChange={(e) => setMaxDelay(e.target.value)}
              min="1"
              max="120"
              required
            />
            <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', display: 'block', marginTop: '4px' }}>
              Minutos tolerados antes de notificar retraso.
            </span>
          </div>

          <div className="input-group" style={{ margin: 0 }}>
            <label className="input-label">Umbral de Desvío de Ruta (m)</label>
            <input
              type="number"
              className="input-field"
              value={maxDistance}
              onChange={(e) => setMaxDistance(e.target.value)}
              min="10"
              max="2000"
              required
            />
            <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', display: 'block', marginTop: '4px' }}>
              Metros permitidos fuera de la polilínea GPS.
            </span>
          </div>

          <div className="input-group" style={{ margin: 0 }}>
            <label className="input-label">Frecuencia Actualización GPS (seg)</label>
            <input
              type="number"
              className="input-field"
              value={gpsInterval}
              onChange={(e) => setGpsInterval(e.target.value)}
              min="1"
              max="60"
              required
            />
            <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', display: 'block', marginTop: '4px' }}>
              Intervalo de retransmisión de geolocalización.
            </span>
          </div>
        </div>
      </div>

      <button
        type="submit"
        className="btn-primary"
        disabled={saving}
        style={{ width: 'auto', alignSelf: 'flex-start', padding: '12px 24px', fontSize: '14.5px', marginTop: '8px' }}
      >
        {saving ? 'Guardando...' : '💾 Guardar Cambios'}
      </button>

    </form>
  );
}
