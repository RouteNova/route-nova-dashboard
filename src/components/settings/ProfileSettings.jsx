import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { authService } from '../../services/api';

export default function ProfileSettings({ user, onUpdateUser }) {
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [telefono, setTelefono] = useState('');
  const [imagenPerfil, setImagenPerfil] = useState('');
  const [saving, setSaving] = useState(false);

  const avatars = [
    { emoji: '🧑‍✈️', label: 'Conductor' },
    { emoji: '👩‍✈️', label: 'Conductora' },
    { emoji: '👨‍💻', label: 'Desarrollador' },
    { emoji: '👩‍💻', label: 'Desarrolladora' },
    { emoji: '🧑‍🏫', label: 'Profesor' },
    { emoji: '👩‍🏫', label: 'Profesora' },
    { emoji: '🦁', label: 'León' },
    { emoji: '🦊', label: 'Zorro' }
  ];

  useEffect(() => {
    if (user) {
      setNombre(user.nombre || '');
      setCorreo(user.correo || '');
      setTelefono(user.telefono || '');
      setImagenPerfil(user.imagenPerfil || '🧑‍✈️');
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nombre.trim()) {
      return toast.error('El nombre es obligatorio');
    }
    if (!correo.trim()) {
      return toast.error('El correo electrónico es obligatorio');
    }

    setSaving(true);
    try {
      const updated = await authService.updateProfile({
        nombre,
        correo,
        telefono,
        imagenPerfil
      });
      toast.success('Perfil actualizado correctamente.');
      if (onUpdateUser) {
        onUpdateUser(updated);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: '700', margin: 0 }}>
        👤 Configuración del Perfil
      </h4>
      <p style={{ color: 'var(--color-text-secondary)', fontSize: '13.5px', margin: 0 }}>
        Actualiza tu información personal de contacto y elige un avatar para personalizar tu cuenta en el dashboard.
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Selector de Avatar */}
        <div>
          <label className="input-label">Selecciona tu Avatar de Perfil</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', marginTop: '8px' }}>
            {/* Vista previa del avatar actual */}
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(37, 99, 235, 0.1)',
              border: '2px solid var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
              boxShadow: 'var(--shadow-sm)',
              overflow: 'hidden'
            }}>
              {imagenPerfil && (imagenPerfil.startsWith('http') ? <img src={imagenPerfil} alt="Avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : imagenPerfil)}
            </div>

            {/* Lista de emojis avatares */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {avatars.map((av, index) => (
                <button
                  type="button"
                  key={index}
                  onClick={() => setImagenPerfil(av.emoji)}
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    background: imagenPerfil === av.emoji ? 'rgba(37, 99, 235, 0.15)' : 'rgba(255,255,255,0.02)',
                    border: imagenPerfil === av.emoji ? '1.5px solid var(--color-primary)' : '1px solid var(--color-border)',
                    fontSize: '18px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s'
                  }}
                  title={av.label}
                >
                  {av.emoji}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginTop: '12px' }}>
            <span className="input-label" style={{ fontSize: '12.5px' }}>O ingresa la URL de una imagen externa:</span>
            <input
              type="text"
              className="input-field"
              placeholder="https://ejemplo.com/mi-avatar.jpg"
              value={imagenPerfil.startsWith('http') ? imagenPerfil : ''}
              onChange={(e) => setImagenPerfil(e.target.value || '🧑‍✈️')}
              style={{ fontSize: '13px', padding: '8px 12px', marginTop: '6px' }}
            />
          </div>
        </div>

        {/* Inputs de Datos */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          <div className="input-group" style={{ margin: 0 }}>
            <label className="input-label">Nombre Completo</label>
            <input
              type="text"
              className="input-field"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. Juan Pérez"
              required
            />
          </div>

          <div className="input-group" style={{ margin: 0 }}>
            <label className="input-label">Correo Electrónico</label>
            <input
              type="email"
              className="input-field"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              placeholder="correo@ejemplo.com"
              required
            />
          </div>
        </div>

        <div className="input-group" style={{ margin: 0, maxWidth: '280px' }}>
          <label className="input-label">Teléfono de Contacto</label>
          <input
            type="tel"
            className="input-field"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            placeholder="809-555-0199"
          />
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
    </div>
  );
}
