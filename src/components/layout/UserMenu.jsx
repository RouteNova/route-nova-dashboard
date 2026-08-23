import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { FaUser, FaSignOutAlt, FaChevronDown, FaTimes } from 'react-icons/fa';
import ProfileSettings from '../settings/ProfileSettings';
import ModalPortal from '../common/ModalPortal';

export default function UserMenu() {
  const { user, logout, updateUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
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

  const renderAvatarContent = () => {
    if (user.imagenPerfil) {
      if (user.imagenPerfil.startsWith('http')) {
        return (
          <img 
            src={user.imagenPerfil} 
            alt="Avatar" 
            style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} 
          />
        );
      }
      return <span style={{ fontSize: '18px' }}>{user.imagenPerfil}</span>;
    }
    return initial;
  };

  return (
    <>
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
            fontSize: '14px',
            overflow: 'hidden'
          }}>
            {renderAvatarContent()}
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

            <button 
              onClick={() => {
                setIsOpen(false);
                setIsProfileModalOpen(true);
              }}
              className="dropdown-item" 
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                width: '100%',
                padding: '10px 12px',
                background: 'none',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--color-text)',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: '14px',
                transition: 'background 0.2s'
              }}
            >
              <FaUser style={{ opacity: 0.7 }} />
              <span>Mi Perfil</span>
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

      {/* Modal de Perfil de Usuario */}
      {isProfileModalOpen && (
        <ModalPortal>
          <div className="modal-overlay animate-fade-in" style={{ zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
            <div className="glass-panel modal-dialog" style={{ maxWidth: '780px', width: '100%', maxHeight: '88vh', overflowY: 'auto', padding: '32px 36px', borderRadius: 'var(--radius-lg)' }}>
              <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid var(--color-border)', paddingBottom: '16px' }}>
                <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: 0, fontSize: '20px', fontWeight: '700' }}>
                  <FaUser style={{ color: 'var(--color-primary)', fontSize: '20px' }} /> Configuración de Mi Perfil
                </h3>
                <button 
                  onClick={() => setIsProfileModalOpen(false)} 
                  className="modal-close-btn"
                  aria-label="Cerrar modal de perfil"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '50%',
                    width: '36px',
                    height: '36px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--color-text-secondary)',
                    cursor: 'pointer',
                    fontSize: '16px',
                    transition: 'all 0.2s'
                  }}
                >
                  <FaTimes />
                </button>
              </div>
              <div className="modal-body" style={{ padding: 0 }}>
                <ProfileSettings 
                  user={user} 
                  onUpdateUser={(updated) => {
                    updateUser(updated);
                    setIsProfileModalOpen(false);
                  }} 
                />
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </>
  );
}
