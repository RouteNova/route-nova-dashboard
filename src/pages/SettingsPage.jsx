import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import SettingsMenu from '../components/settings/SettingsMenu';
import ProfileSettings from '../components/settings/ProfileSettings';
import SystemSettings from '../components/settings/SystemSettings';
import NotificationSettings from '../components/settings/NotificationSettings';
import SecuritySettings from '../components/settings/SecuritySettings';
import { authService, settingsService } from '../services/api';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(true);
  // Datos
  const [userProfile, setUserProfile] = useState(null);
  const [globalSettings, setGlobalSettings] = useState(null);

  // Apariencia
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'system');
  const [density, setDensity] = useState(localStorage.getItem('density') || 'standard');
  const [language, setLanguage] = useState(localStorage.getItem('lang') || 'es');

  useEffect(() => {
    loadSettingsData();
  }, []);

  const loadSettingsData = async () => {
    setLoading(true);
    try {
      const [profileRes, settingsRes] = await Promise.all([
        authService.getProfile().catch(() => null),
        settingsService.getSettings().catch(() => null)
      ]);

      if (profileRes) {
        setUserProfile(profileRes);
      } else {
        // Fallback local desde sessionStorage
        const savedUser = authService.getCurrentUser();
        if (savedUser) {
          setUserProfile({
            nombre: savedUser.nombre,
            correo: savedUser.correo,
            rol: savedUser.rol,
            telefono: '',
            imagenPerfil: '🧑‍✈️'
          });
        }
      }

      if (settingsRes) {
        setGlobalSettings(settingsRes);
      } else {
        setGlobalSettings({
          transport: { maxDelay: 15, maxDistance: 200, gpsInterval: 5 },
          notifications: {
            incidents: true,
            delays: true,
            deviations: true,
            boardings: false,
            sound: true,
            frequency: 'immediate',
            alertTypes: ['push', 'email']
          },
          security: { sessionDuration: 8, autoLogout: true },
          institution: {
            name: 'Colegio RouteNova',
            address: '',
            phone: ''
          }
        });
      }
    } catch (err) {
      console.error('Error cargando configuración:', err);
      setGlobalSettings({
        transport: { maxDelay: 15, maxDistance: 200, gpsInterval: 5 },
        notifications: {
          incidents: true,
          delays: true,
          deviations: true,
          boardings: false,
          sound: true,
          frequency: 'immediate',
          alertTypes: ['push', 'email']
        },
        security: { sessionDuration: 8, autoLogout: true },
        institution: {
          name: 'Colegio RouteNova',
          address: '',
          phone: ''
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUserProfile = (updatedProfile) => {
    setUserProfile(updatedProfile);
    // Actualizar también en el almacenamiento local para que se refleje de inmediato
    const cachedUser = authService.getCurrentUser();
    if (cachedUser) {
      cachedUser.nombre = updatedProfile.nombre;
      cachedUser.correo = updatedProfile.correo;
      sessionStorage.setItem('user', JSON.stringify(cachedUser));
    }
  };

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    const root = document.documentElement;
    if (newTheme === 'dark') {
      root.classList.add('dark-theme');
      root.classList.remove('light-theme');
    } else if (newTheme === 'light') {
      root.classList.add('light-theme');
      root.classList.remove('dark-theme');
    } else {
      root.classList.remove('dark-theme');
      root.classList.remove('light-theme');
    }
    toast.success(`Tema cambiado a modo ${newTheme === 'dark' ? 'oscuro' : newTheme === 'light' ? 'claro' : 'sistema'}.`);
  };

  const handleDensityChange = (newDensity) => {
    setDensity(newDensity);
    localStorage.setItem('density', newDensity);
    toast.success(`Densidad de interfaz cambiada a ${newDensity === 'compact' ? 'compacta' : newDensity === 'spacious' ? 'espaciosa' : 'estándar'}.`);
  };

  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
    localStorage.setItem('lang', newLang);
    toast.success(`Idioma cambiado a ${newLang === 'en' ? 'Inglés' : 'Español'}.`);
  };

  // Renderizar contenido basado en la pestaña activa
  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
      case 'transport':
        return (
          <SystemSettings 
            settings={globalSettings} 
            onUpdateSettings={setGlobalSettings} 
          />
        );
      case 'profile':
        return (
          <ProfileSettings 
            user={userProfile} 
            onUpdateUser={handleUpdateUserProfile} 
          />
        );
      case 'notifications':
        return (
          <NotificationSettings 
            settings={globalSettings} 
            onUpdateSettings={setGlobalSettings} 
          />
        );
      case 'security':
        return (
          <SecuritySettings 
            settings={globalSettings} 
            onUpdateSettings={setGlobalSettings} 
          />
        );
      case 'appearance':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: '700', margin: 0 }}>
                🎨 Apariencia y Personalización
              </h4>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '13.5px', marginTop: '4px', marginBottom: 0 }}>
                Ajusta el estilo visual del dashboard para adaptarlo a tus preferencias de lectura y confort visual.
              </p>
            </div>

            {/* Tema */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <span className="input-label">Tema del Sistema</span>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {['system', 'light', 'dark'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => handleThemeChange(t)}
                    style={{
                      padding: '10px 20px',
                      borderRadius: 'var(--radius-md)',
                      border: theme === t ? '1.5px solid var(--color-primary)' : '1px solid var(--color-border)',
                      background: theme === t ? 'rgba(37, 99, 235, 0.08)' : 'rgba(255, 255, 255, 0.01)',
                      color: theme === t ? 'var(--color-primary)' : 'var(--color-text)',
                      fontFamily: 'var(--font-heading)',
                      fontWeight: '600',
                      fontSize: '13.5px',
                      cursor: 'pointer',
                      textTransform: 'capitalize',
                      transition: 'all 0.2s'
                    }}
                  >
                    {t === 'system' ? '💻 Sistema' : t === 'light' ? '☀️ Claro' : '🌙 Oscuro'}
                  </button>
                ))}
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: 0 }} />

            {/* Densidad */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <span className="input-label">Densidad de la Interfaz</span>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {[
                  { id: 'compact', label: 'Compacta' },
                  { id: 'standard', label: 'Estándar' },
                  { id: 'spacious', label: 'Espaciosa' }
                ].map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => handleDensityChange(d.id)}
                    style={{
                      padding: '10px 20px',
                      borderRadius: 'var(--radius-md)',
                      border: density === d.id ? '1.5px solid var(--color-primary)' : '1px solid var(--color-border)',
                      background: density === d.id ? 'rgba(37, 99, 235, 0.08)' : 'rgba(255, 255, 255, 0.01)',
                      color: density === d.id ? 'var(--color-primary)' : 'var(--color-text)',
                      fontFamily: 'var(--font-heading)',
                      fontWeight: '600',
                      fontSize: '13.5px',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: 0 }} />

            {/* Idioma */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <span className="input-label">Idioma de Visualización</span>
              <select
                className="input-field"
                value={language}
                onChange={(e) => handleLanguageChange(e.target.value)}
                style={{ maxWidth: '200px', fontSize: '13.5px', padding: '8px 12px' }}
              >
                <option value="es">Español (América Latina)</option>
                <option value="en">English (United States)</option>
              </select>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="animate-slide-up" style={{ paddingBottom: '30px' }}>
      
      {/* Cabecera */}
      <div style={{ marginBottom: '24px' }}>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '15px' }}>
          Configura y personaliza los ajustes operativos de RouteNova, tu información institucional y tus credenciales de seguridad.
        </p>
      </div>


      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px' }}>
          <div className="spinner" style={{ marginBottom: '16px' }}></div>
          <span style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
            Cargando configuraciones generales...
          </span>
        </div>
      ) : (
        <div className="settings-layout">
          {/* Columna Izquierda: Menú */}
          <div className="glass-panel settings-menu-panel" style={{ padding: '16px' }}>
            <SettingsMenu activeTab={activeTab} setActiveTab={setActiveTab} />
          </div>

          {/* Columna Derecha: Panel Detalle */}
          <div className="glass-panel settings-content-panel" style={{ padding: '32px' }}>
            {renderTabContent()}
          </div>
        </div>
      )}

    </div>
  );
}
