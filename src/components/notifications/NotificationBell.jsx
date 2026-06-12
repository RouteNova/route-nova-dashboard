import React, { useState, useEffect, useRef } from 'react';
import { FaBell } from 'react-icons/fa';
import { io } from 'socket.io-client';
import { toast } from 'react-toastify';
import { notificationService } from '../../services/api';
import NotificationPanel from './NotificationPanel';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  
  const socketRef = useRef(null);
  const bellRef = useRef(null);

  // Cantidad de notificaciones no leídas
  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    fetchNotifications();
    setupSocketConnection();

    // Event listener para cerrar el panel al hacer clic en cualquier parte fuera de la campana
    const handleOutsideClick = (event) => {
      if (bellRef.current && !bellRef.current.contains(event.target)) {
        setIsPanelOpen(false);
      }
    };
    document.addEventListener('click', handleOutsideClick);

    return () => {
      document.removeEventListener('click', handleOutsideClick);
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const data = await notificationService.getNotifications();
      setNotifications(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const setupSocketConnection = () => {
    try {
      const token = sessionStorage.getItem('token');
      if (!token) return;

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const socketUrl = apiUrl.replace('/api', '');

      const socket = io(socketUrl, {
        auth: { token },
        transports: ['websocket']
      });

      socketRef.current = socket;

      socket.on('connect', () => {
        console.log('Socket.IO conectado para centro de notificaciones admin.');
      });

      socket.on('new_notification', (newNotification) => {
        // Añadir a la lista en el tope
        setNotifications(prev => [newNotification, ...prev]);

        // Disparar toast informando el suceso
        triggerNotificationToast(newNotification);
      });

      socket.on('disconnect', (reason) => {
        console.log('Socket.IO del Centro de notificaciones desconectado:', reason);
      });
    } catch (err) {
      console.error('Error al configurar socket de notificaciones:', err);
    }
  };

  const triggerNotificationToast = (n) => {
    const toastOptions = {
      position: "top-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true
    };

    switch (n.type) {
      case 'NEW_INCIDENT':
        toast.error(`⚠️ Alerta Incidencia: ${n.message}`, toastOptions);
        break;
      case 'ROUTE_DEVIATED':
        toast.warn(`📍 Alerta Desvío: ${n.message}`, toastOptions);
        break;
      case 'ROUTE_DELAYED':
        toast.warning(`🕒 Alerta Retraso: ${n.message}`, toastOptions);
        break;
      case 'ROUTE_STARTED':
        toast.info(`🚍 Inicio de Recorrido: ${n.message}`, toastOptions);
        break;
      case 'ROUTE_FINISHED':
        toast.success(`✅ Fin de Recorrido: ${n.message}`, toastOptions);
        break;
      default:
        toast.info(n.message, toastOptions);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev => 
        prev.map(n => (n._id === id || n.id === id) ? { ...n, read: true } : n)
      );
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  const togglePanel = (e) => {
    e.stopPropagation();
    setIsPanelOpen(!isPanelOpen);
  };

  return (
    <div 
      ref={bellRef} 
      style={{ 
        position: 'relative', 
        display: 'flex', 
        alignItems: 'center',
        cursor: 'pointer'
      }}
    >
      {/* Botón Campana */}
      <button
        onClick={togglePanel}
        aria-label="Notificaciones"
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid var(--color-border)',
          color: unreadCount > 0 ? 'var(--color-primary)' : 'var(--color-text-secondary)',
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '18px',
          transition: 'all 0.25s ease',
          padding: 0,
          cursor: 'pointer',
          position: 'relative'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.09)';
          e.currentTarget.style.color = 'var(--color-primary)';
          e.currentTarget.style.transform = 'scale(1.05)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
          e.currentTarget.style.color = unreadCount > 0 ? 'var(--color-primary)' : 'var(--color-text-secondary)';
          e.currentTarget.style.transform = 'scale(1)';
        }}
      >
        <FaBell style={{ animation: unreadCount > 0 ? 'pulse 2s infinite' : 'none' }} />
        
        {/* Badge numérico */}
        {unreadCount > 0 && (
          <span 
            className="animate-fade-in"
            style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              background: '#EF4444',
              color: '#ffffff',
              fontSize: '10px',
              fontWeight: '800',
              minWidth: '18px',
              height: '18px',
              borderRadius: '9px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 4px',
              boxShadow: '0 0 6px rgba(239, 68, 68, 0.6)',
              border: '1px solid var(--color-card)'
            }}
          >
            {unreadCount}
          </span>
        )}
      </button>

      {/* Panel desplegable popover */}
      {isPanelOpen && (
        <NotificationPanel 
          notifications={notifications}
          onRead={handleMarkAsRead}
          onMarkAllAsRead={handleMarkAllAsRead}
          onClose={() => setIsPanelOpen(false)}
          loading={loading}
        />
      )}
    </div>
  );
}
