import React from 'react';
import { FaBuilding, FaUser, FaBus, FaBell, FaLock, FaPalette } from 'react-icons/fa';

export default function SettingsMenu({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'general', label: 'General', icon: <FaBuilding /> },
    { id: 'profile', label: 'Perfil', icon: <FaUser /> },
    { id: 'transport', label: 'Transporte', icon: <FaBus /> },
    { id: 'notifications', label: 'Notificaciones', icon: <FaBell /> },
    { id: 'security', label: 'Seguridad', icon: <FaLock /> },
    { id: 'appearance', label: 'Apariencia', icon: <FaPalette /> },
  ];

  return (
    <div className="settings-menu-tabs" style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '6px',
      width: '100%',
    }}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              width: '100%',
              padding: '12px 18px',
              border: '1px solid transparent',
              borderRadius: 'var(--radius-md)',
              background: isActive ? 'rgba(37, 99, 235, 0.1)' : 'transparent',
              color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
              fontFamily: 'var(--font-heading)',
              fontWeight: isActive ? '600' : '500',
              fontSize: '14.5px',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                e.currentTarget.style.color = 'var(--color-text)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'var(--color-text-secondary)';
              }
            }}
          >
            <span style={{ fontSize: '16px', display: 'flex', alignItems: 'center' }}>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
