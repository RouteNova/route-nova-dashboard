import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { FaCheckDouble, FaBell, FaInfoCircle } from 'react-icons/fa';
import { notificationService } from '../services/api';
import NotificationList from '../components/notifications/NotificationList';

const getMockNotifications = () => {
  const today = new Date();
  const formatTime = (minsAgo) => {
    return new Date(today.getTime() - minsAgo * 60 * 1000).toISOString();
  };

  return [
    {
      _id: "mocknotif001",
      type: "NEW_INCIDENT",
      title: "Nueva incidencia: Avería reportada",
      message: "Incidencia de Avería reportada en la Ruta Colegio Norte (Autobús BUS-03). Gravedad: Alta.",
      createdAt: formatTime(5),
      read: false
    },
    {
      _id: "mocknotif002",
      type: "ROUTE_DELAYED",
      title: "Retraso detectado",
      message: "La Ruta Sur registra un retraso estimado de 15 minutos (ETA excede el horario de llegada programado).",
      createdAt: formatTime(10),
      read: false
    },
    {
      _id: "mocknotif003",
      type: "ROUTE_STARTED",
      title: "Autobús inició recorrido",
      message: "El autobús de la ruta Colegio Norte ha iniciado su recorrido.",
      createdAt: formatTime(15),
      read: true
    },
    {
      _id: "mocknotif004",
      type: "ROUTE_DEVIATED",
      title: "Desvío detectado",
      message: "El autobús de la ruta Colegio Centro (BUS-02) se ha desviado por 250 metros.",
      createdAt: formatTime(20),
      read: false
    }
  ];
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all' o 'unread'
  const [usingMocks, setUsingMocks] = useState(false);
  
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
      
      if (list.length === 0) {
        setUsingMocks(true);
        setNotifications(getMockNotifications());
      } else {
        setUsingMocks(false);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
      // Fallback
      setUsingMocks(true);
      setNotifications(getMockNotifications());
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
    // Si estamos usando mocks, actualizamos localmente
    if (usingMocks) {
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
      return;
    }

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
    if (usingMocks) {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      return;
    }

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

      {usingMocks && (
        <div style={{ 
          background: 'rgba(59, 130, 246, 0.08)', 
          border: '1px solid rgba(59, 130, 246, 0.2)', 
          padding: '10px 16px', 
          borderRadius: 'var(--radius-md)', 
          fontSize: '13px', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px', 
          color: '#60A5FA', 
          marginBottom: '20px' 
        }}>
          💡 <b>Visualización Simulada</b>: No se registran alertas en la base de datos. Mostrando bandeja de notificaciones interactiva de prueba.
        </div>
      )}

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
