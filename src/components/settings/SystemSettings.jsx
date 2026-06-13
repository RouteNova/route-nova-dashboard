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

  // Calendario y Horario Escolar
  const [classDays, setClassDays] = useState([1, 2, 3, 4, 5]);
  const [startTime, setStartTime] = useState('07:30');
  const [endTime, setEndTime] = useState('16:30');
  const [nonSchoolDays, setNonSchoolDays] = useState([]);

  // Estados temporales para formulario de días no laborables excepcionales
  const [newNonSchoolDate, setNewNonSchoolDate] = useState('');
  const [newNonSchoolReason, setNewNonSchoolReason] = useState('');

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
      if (settings.calendar) {
        setClassDays(settings.calendar.classDays || [1, 2, 3, 4, 5]);
        setStartTime(settings.calendar.startTime || '07:30');
        setEndTime(settings.calendar.endTime || '16:30');
        setNonSchoolDays(settings.calendar.nonSchoolDays || []);
      }
    }
  }, [settings]);

  const toggleClassDay = (dayVal) => {
    if (classDays.includes(dayVal)) {
      if (classDays.length === 1) {
        toast.warning('Debe haber al menos un día de clases habilitado.');
        return;
      }
      setClassDays(classDays.filter(d => d !== dayVal));
    } else {
      setClassDays([...classDays, dayVal].sort());
    }
  };

  const handleAddNonSchoolDay = () => {
    if (!newNonSchoolDate || !newNonSchoolReason.trim()) {
      toast.warning('Por favor ingrese la fecha y el motivo.');
      return;
    }
    
    if (nonSchoolDays.some(d => d.date === newNonSchoolDate)) {
      toast.warning('Esta fecha ya está registrada como día no laborable.');
      return;
    }
    
    const updated = [...nonSchoolDays, { date: newNonSchoolDate, reason: newNonSchoolReason.trim() }];
    updated.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    setNonSchoolDays(updated);
    setNewNonSchoolDate('');
    setNewNonSchoolReason('');
  };

  const handleRemoveNonSchoolDay = (dateStr) => {
    const updated = nonSchoolDays.filter(d => d.date !== dateStr);
    setNonSchoolDays(updated);
  };

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
        },
        calendar: {
          classDays,
          startTime,
          endTime,
          nonSchoolDays
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

      <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: 0 }} />

      {/* 3. Calendario y Horario Escolar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: '700', margin: 0 }}>
            📅 Horario y Calendario Escolar
          </h4>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '13.5px', marginTop: '4px', marginBottom: 0 }}>
            Define las horas de operación ordinaria y los días de clase de la institución. Las rutas se podrán activar únicamente en estos días hábiles.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="input-group" style={{ margin: 0 }}>
            <label className="input-label">Días Lectivos (Clases)</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
              {[
                { value: 1, label: 'Lunes' },
                { value: 2, label: 'Martes' },
                { value: 3, label: 'Miércoles' },
                { value: 4, label: 'Jueves' },
                { value: 5, label: 'Viernes' },
                { value: 6, label: 'Sábado' },
                { value: 0, label: 'Domingo' }
              ].map((day) => {
                const isSelected = classDays.includes(day.value);
                return (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleClassDay(day.value)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '20px',
                      border: isSelected ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                      backgroundColor: isSelected ? 'var(--color-primary)' : 'transparent',
                      color: isSelected ? '#ffffff' : 'var(--color-text-secondary)',
                      cursor: 'pointer',
                      fontSize: '13.5px',
                      fontWeight: isSelected ? '600' : '500',
                      transition: 'all 0.2s ease',
                      fontFamily: 'var(--font-heading)',
                    }}
                  >
                    {day.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
            <div className="input-group" style={{ margin: 0 }}>
              <label className="input-label">Hora de Entrada (Inicio)</label>
              <input
                type="time"
                className="input-field"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>

            <div className="input-group" style={{ margin: 0 }}>
              <label className="input-label">Hora de Salida (Cierre)</label>
              <input
                type="time"
                className="input-field"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
              />
            </div>
          </div>
        </div>
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: 0 }} />

      {/* 4. Días No Laborables Excepcionales */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: '700', margin: 0 }}>
            🛑 Días No Laborables y Feriados Excepcionales
          </h4>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '13.5px', marginTop: '4px', marginBottom: 0 }}>
            Registra fechas específicas en las cuales se suspenderá el servicio de transporte escolar (por ejemplo: días festivos, feriados o incidencias climáticas).
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Listado de días registrados */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label className="input-label">Suspensiones Registradas</label>
            {nonSchoolDays.length === 0 ? (
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '13.5px', fontStyle: 'italic', margin: 0, padding: '10px 0' }}>
                No hay días no laborables registrados.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto', paddingRight: '4px' }}>
                {nonSchoolDays.map((day, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 16px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(100, 116, 139, 0.08)',
                      border: '1px solid var(--color-border)',
                    }}
                  >
                    <div>
                      <span style={{ fontWeight: '600', marginRight: '10px', color: 'var(--color-text)', fontFamily: 'var(--font-heading)' }}>
                        {day.date}
                      </span>
                      <span style={{ color: 'var(--color-text-secondary)', fontSize: '13.5px' }}>
                        {day.reason}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveNonSchoolDay(day.date)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--color-danger)',
                        cursor: 'pointer',
                        fontSize: '16px',
                        padding: '4px 8px',
                        transition: 'opacity 0.2s',
                      }}
                      title="Eliminar día no laborable"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Formulario para agregar nuevo día */}
          <div style={{
            display: 'flex',
            gap: '12px',
            alignItems: 'flex-end',
            flexWrap: 'wrap',
            padding: '16px',
            borderRadius: '8px',
            backgroundColor: 'rgba(100, 116, 139, 0.04)',
            border: '1px solid var(--color-border)'
          }}>
            <div className="input-group" style={{ margin: 0, flex: '1 1 200px' }}>
              <label className="input-label">Fecha del Feriado</label>
              <input
                type="date"
                className="input-field"
                value={newNonSchoolDate}
                onChange={(e) => setNewNonSchoolDate(e.target.value)}
              />
            </div>
            <div className="input-group" style={{ margin: 0, flex: '2 1 300px' }}>
              <label className="input-label">Motivo de Suspensión</label>
              <input
                type="text"
                className="input-field"
                value={newNonSchoolReason}
                onChange={(e) => setNewNonSchoolReason(e.target.value)}
                placeholder="Ej. Día de la Constitución / Alerta de Tormenta"
              />
            </div>
            <button
              type="button"
              onClick={handleAddNonSchoolDay}
              className="btn-primary"
              style={{
                height: '42px',
                padding: '0 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: 0,
                fontSize: '13.5px',
                fontFamily: 'var(--font-heading)'
              }}
            >
              ➕ Agregar
            </button>
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
