import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { FaUser, FaCog, FaSignOutAlt, FaChevronDown } from 'react-icons/fa';

export default function UserMenu() {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  const initial = user.nombre ? user.nombre.charAt(0).toUpperCase() : 'A';

  return (
    <div className="user-menu-container" ref={dropdownRef} style={{ position: 'relative' }}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          background: 'none',
          border: 'none',
          color: 'var(--color-text)',
          cursor: 'pointer',
          padding: '6px 12px',
          borderRadius: 'var(--radius-md)',
          transition: 'var(--transition)'
        }}
        className="user-menu-btn"
      >
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          background: 'var(--color-primary)',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: '700',
          fontSize: '14px'
        }}>
          {initial}
        </div>
        <span style={{ fontSize: '14px', fontWeight: '600' }}>{user.nombre}</span>
        <FaChevronDown style={{ fontSize: '10px', opacity: 0.7, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>

      {isOpen && (
        <div className="glass-panel dropdown-menu animate-fade-in" style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          right: 0,
          width: '200px',
          padding: '8px',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-lg)',
          zIndex: 100,
          display: 'flex',
          flexDirection: 'column',
          gap: '2px'
        }}>
          <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--color-border)', marginBottom: '6px' }}>
            <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Sesión activa como:</div>
            <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-text)', textTransform: 'capitalize' }}>{user.rol}</div>
          </div>
          <button className="dropdown-item" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            width: '100%',
            padding: '10px 12px',
            background: 'none',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--color-text)',
            cursor: 'not-allowed',
            textAlign: 'left',
            fontSize: '14px'
          }}>
            <FaUser style={{ opacity: 0.7 }} />
            <span>Mi Perfil</span>
          </button>
          <button className="dropdown-item" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            width: '100%',
            padding: '10px 12px',
            background: 'none',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--color-text)',
            cursor: 'not-allowed',
            textAlign: 'left',
            fontSize: '14px'
          }}>
            <FaCog style={{ opacity: 0.7 }} />
            <span>Configuración</span>
          </button>
          <button 
            onClick={logout}
            className="dropdown-item logout-btn" 
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              width: '100%',
              padding: '10px 12px',
              background: 'none',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--color-danger)',
              cursor: 'pointer',
              textAlign: 'left',
              fontSize: '14px',
              borderTop: '1px solid var(--color-border)',
              marginTop: '6px'
            }}
          >
            <FaSignOutAlt />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      )}
    </div>
  );
}
