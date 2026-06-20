import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { FaCheckDouble, FaBell, FaInfoCircle } from 'react-icons/fa';
import { notificationService } from '../services/api';
import NotificationList from '../components/notifications/NotificationList';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all' o 'unread'
  
  const socketRef = useRef(null);

  useEffect(() => {
    fetchNotifications();
    setupSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const data = await notificationService.getNotifications();
      const list = Array.isArray(data) ? data : [];
      setNotifications(list);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const setupSocket = () => {
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

      socket.on('new_notification', (newNotification) => {
        setNotifications(prev => [newNotification, ...prev]);
      });
    } catch (err) {
      console.error('Error setting up socket:', err);
    }
  };

  const handleRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev => 
        prev.map(n => (n._id === id || n.id === id) ? { ...n, read: true } : n)
      );
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  // Filtrar notificaciones según estado seleccionado
  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.read;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="animate-slide-up" style={{ padding: '0 0 20px 0' }}>
      {/* Subcabecera descriptiva */}
      <div style={{ marginBottom: '24px' }}>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '15px' }}>
          Historial completo de alertas, desvíos e incidencias registradas en tiempo real por el sistema.
        </p>
      </div>

      {/* Controles superiores */}
      <div 
        className="glass-panel"
        style={{
          padding: '16px 20px',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}
      >
        {/* Filtro Todos / No leídos */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setFilter('all')}
            className={filter === 'all' ? 'btn-primary' : 'btn-secondary'}
            style={{ padding: '8px 16px', fontSize: '13.5px', margin: 0 }}
          >
            Todas ({notifications.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={filter === 'unread' ? 'btn-primary' : 'btn-secondary'}
            style={{ padding: '8px 16px', fontSize: '13.5px', margin: 0 }}
          >
            No Leídas ({unreadCount})
          </button>
        </div>

        {/* Marcar todas como leídas */}
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="btn-secondary"
            style={{ 
              padding: '8px 16px', 
              fontSize: '13.5px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              margin: 0
            }}
          >
            <FaCheckDouble /> Marcar todas como leídas
          </button>
        )}
      </div>

      {/* Grid / Contenedor principal de notificaciones */}
      <div 
        className="glass-panel"
        style={{
          padding: '24px',
          minHeight: '400px'
        }}
      >
        <NotificationList 
          notifications={filteredNotifications}
          onRead={handleRead}
          loading={loading}
        />
      </div>
    </div>
  );
}
