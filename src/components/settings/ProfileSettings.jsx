import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { authService } from '../../services/api';
import { FaUser, FaKey, FaSave, FaLock } from 'react-icons/fa';

export default function ProfileSettings({ user, onUpdateUser }) {
  const [activeTab, setActiveTab] = useState('profile');

  // Datos de perfil
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [telefono, setTelefono] = useState('');
  const [imagenPerfil, setImagenPerfil] = useState('');
  const [saving, setSaving] = useState(false);

  // Cambio de contraseña
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPass, setChangingPass] = useState(false);

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

  const handleProfileSubmit = async (e) => {
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

  const handlePasswordSubmit = async (e) => {
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Sub-navegación por pestañas */}
      <div style={{
        display: 'flex',
        gap: '12px',
        borderBottom: '1px solid var(--color-border)',
        paddingBottom: '12px'
      }}>
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: 'var(--radius-md)',
            border: activeTab === 'profile' ? '1.5px solid var(--color-primary)' : '1px solid var(--color-border)',
            background: activeTab === 'profile' ? 'rgba(37, 99, 235, 0.12)' : 'transparent',
            color: activeTab === 'profile' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            fontWeight: '600',
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          <FaUser /> Información Personal
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('password')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: 'var(--radius-md)',
            border: activeTab === 'password' ? '1.5px solid var(--color-primary)' : '1px solid var(--color-border)',
            background: activeTab === 'password' ? 'rgba(37, 99, 235, 0.12)' : 'transparent',
            color: activeTab === 'password' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            fontWeight: '600',
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          <FaKey /> Cambiar Contraseña
        </button>
      </div>

      {activeTab === 'profile' ? (
        <form onSubmit={handleProfileSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '17px', fontWeight: '700', margin: '0 0 6px 0' }}>
              👤 Datos del Usuario Logueado
            </h4>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '13.5px', margin: 0 }}>
              Actualiza tu nombre, correo electrónico, teléfono y avatar de perfil.
            </p>
          </div>

          {/* Selector de Avatar */}
          <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '16px 20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
            <label className="input-label" style={{ fontWeight: '600', marginBottom: '10px', display: 'block' }}>
              Avatar de Perfil
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
              {/* Vista previa del avatar actual */}
              <div style={{
                width: '68px',
                height: '68px',
                borderRadius: '50%',
                background: 'rgba(37, 99, 235, 0.12)',
                border: '2px solid var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '34px',
                boxShadow: 'var(--shadow-sm)',
                overflow: 'hidden',
                flexShrink: 0
              }}>
                {imagenPerfil && (imagenPerfil.startsWith('http') ? <img src={imagenPerfil} alt="Avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : imagenPerfil)}
              </div>

              {/* Lista de emojis avatares */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', flex: 1 }}>
                {avatars.map((av, index) => (
                  <button
                    type="button"
                    key={index}
                    onClick={() => setImagenPerfil(av.emoji)}
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '50%',
                      background: imagenPerfil === av.emoji ? 'rgba(37, 99, 235, 0.2)' : 'rgba(255,255,255,0.03)',
                      border: imagenPerfil === av.emoji ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                      fontSize: '20px',
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

            <div style={{ marginTop: '14px' }}>
              <span className="input-label" style={{ fontSize: '12.5px', marginBottom: '4px', display: 'block' }}>
                O ingresa la URL de una imagen externa:
              </span>
              <input
                type="text"
                className="input-field"
                placeholder="https://ejemplo.com/mi-avatar.jpg"
                value={imagenPerfil.startsWith('http') ? imagenPerfil : ''}
                onChange={(e) => setImagenPerfil(e.target.value || '🧑‍✈️')}
                style={{ fontSize: '13.5px', padding: '10px 14px' }}
              />
            </div>
          </div>

          {/* Inputs de Datos Personales */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
            <div className="input-group" style={{ margin: 0 }}>
              <label className="input-label">Nombre Completo</label>
              <input
                type="text"
                className="input-field"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej. Juan Pérez"
                style={{ padding: '11px 14px' }}
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
                style={{ padding: '11px 14px' }}
                required
              />
            </div>
          </div>

          <div className="input-group" style={{ margin: 0, maxWidth: '320px' }}>
            <label className="input-label">Teléfono de Contacto</label>
            <input
              type="tel"
              className="input-field"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder="809-555-0199"
              style={{ padding: '11px 14px' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
            <button
              type="submit"
              className="btn-primary"
              disabled={saving}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 28px', fontSize: '15px' }}
            >
              <FaSave />
              <span>{saving ? 'Guardando...' : 'Guardar Cambios'}</span>
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '17px', fontWeight: '700', margin: '0 0 6px 0' }}>
              🔒 Cambiar Contraseña de Acceso
            </h4>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '13.5px', margin: 0 }}>
              Actualiza tu contraseña periódicamente para garantizar la seguridad de tu cuenta.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', maxWidth: '500px' }}>
            <div className="input-group" style={{ margin: 0 }}>
              <label className="input-label">Contraseña Actual</label>
              <input
                type="password"
                className="input-field"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                style={{ padding: '11px 14px' }}
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
                style={{ padding: '11px 14px' }}
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
                style={{ padding: '11px 14px' }}
                required
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
            <button
              type="submit"
              className="btn-primary"
              disabled={changingPass}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 28px', fontSize: '15px' }}
            >
              <FaLock />
              <span>{changingPass ? 'Actualizando...' : 'Actualizar Contraseña'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
