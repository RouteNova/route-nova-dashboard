import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { routeService } from '../services/api';
import { toast } from 'react-toastify';
import MapView from '../components/LiveMonitoring/MapView';
import BusMarker from '../components/LiveMonitoring/BusMarker';
import RouteStatus from '../components/LiveMonitoring/RouteStatus';
import IncidentPanel from '../components/LiveMonitoring/IncidentPanel';
import { FaBroadcastTower, FaSyncAlt } from 'react-icons/fa';

export default function LiveMonitoring() {
  const [activeRoutes, setActiveRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Ruta seleccionada en detalle
  const [selectedRouteId, setSelectedRouteId] = useState(null);
  const [selectedRouteDetails, setSelectedRouteDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Lista agregada de todas las incidencias de las rutas activas
  const [allIncidents, setAllIncidents] = useState([]);
  // Stream de eventos en tiempo real recibidos por WebSockets
  const [eventStream, setEventStream] = useState([]);

  const socketRef = useRef(null);
  const activeRouteIdsRef = useRef(new Set());
  
  // Ref para mantener la lista actualizada de rutas sin disparar reconexiones de socket
  const activeRoutesRef = useRef(activeRoutes);
  useEffect(() => {
    activeRoutesRef.current = activeRoutes;
  }, [activeRoutes]);

  // 1. Cargar datos iniciales
  useEffect(() => {
    fetchActiveRoutes();
    return () => {
      // Desconectar socket al desmontar
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const fetchActiveRoutes = async () => {
    setLoading(true);
    try {
      const data = await routeService.getActiveRoutesMonitoring();
      const list = Array.isArray(data) ? data : [];
      setActiveRoutes(list);
      setAllIncidents([]); 
    } catch (err) {
      console.error('Error fetching active monitoring routes:', err);
    } finally {
      setLoading(false);
    }
  };

  // 2. Establecer la conexión WebSocket ÚNICA al montar el componente
  useEffect(() => {
    // Obtener token de sesión
    const token = sessionStorage.getItem('token');
    if (!token) return;

    // Calcular la URL de WebSockets
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const socketUrl = apiUrl.replace('/api', '');

    const socket = io(socketUrl, {
      auth: { token: `Bearer ${token}` },
      transports: ['websocket']
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Socket.IO conectado para monitoreo. ID:', socket.id);
      // Al conectar, unirse a las rutas que ya tengamos cargadas
      activeRoutesRef.current.forEach(r => {
        if (r.route?.id && !activeRouteIdsRef.current.has(r.route.id)) {
          socket.emit('join_route', { routeId: r.route.id }, (res) => {
            if (res && res.status === 'ok') {
              activeRouteIdsRef.current.add(r.route.id);
              console.log(`Unido a ruta ${r.route.id} al conectar`);
            }
          });
        }
      });
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket.IO desconectado:', reason);
      activeRouteIdsRef.current.clear();
    });

    // Escuchar actualizaciones de ubicación GPS
    socket.on('location_updated', (data) => {
      const { routeId, latitud, longitud, eta } = data;

      // Actualizar posición del bus en la lista local de rutas activas
      setActiveRoutes(prev => prev.map(r => {
        if (r.route?.id === routeId) {
          return {
            ...r,
            ultimaUbicacion: { latitud, longitud, fechaHora: new Date().toISOString() },
            route: { ...r.route, eta }
          };
        }
        return r;
      }));

      // Si es la ruta enfocada actualmente, actualizar sus detalles en pantalla
      setSelectedRouteId(currentSelectedId => {
        if (currentSelectedId === routeId) {
          setSelectedRouteDetails(prev => {
            if (!prev) return null;
            return {
              ...prev,
              ultimaUbicacion: { latitud, longitud, fechaHora: new Date().toISOString() },
              route: { ...prev.route, eta }
            };
          });
        }
        return currentSelectedId;
      });
    });

    // Escuchar eventos de abordaje en vivo
    socket.on('student_boarded', (data) => {
      const { routeId, studentName, timestamp, estudiantesStats } = data;
      const formattedTime = new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      toast.info(`🔔 ${formattedTime} - ${studentName} abordó el autobús.`);

      // Agregar al stream de eventos del dashboard
      setEventStream(prev => [
        { id: Math.random(), type: 'boarded', routeId, studentName, time: formattedTime },
        ...prev.slice(0, 19)
      ]);

      // Actualizar estadísticas directamente si están presentes en la transmisión WebSocket
      if (estudiantesStats) {
        setActiveRoutes(prev => prev.map(r => {
          if (r.route?.id === routeId) {
            return {
              ...r,
              estudiantesStats
            };
          }
          return r;
        }));

        setSelectedRouteId(currentSelectedId => {
          if (currentSelectedId === routeId) {
            setSelectedRouteDetails(prev => {
              if (!prev) return null;
              return {
                ...prev,
                estudiantesStats
              };
            });
          }
          return currentSelectedId;
        });
      } else {
        // Fallback en caso de que no vengan las estadísticas en el payload
        refreshRouteStats(routeId);
      }
    });

    // Escuchar eventos de descenso en vivo
    socket.on('student_dropped', (data) => {
      const { routeId, studentName, timestamp, estudiantesStats } = data;
      const formattedTime = new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      toast.success(`🎓 ${formattedTime} - ${studentName} descendió del autobús.`);

      // Agregar al stream de eventos del dashboard
      setEventStream(prev => [
        { id: Math.random(), type: 'dropped', routeId, studentName, time: formattedTime },
        ...prev.slice(0, 19)
      ]);

      // Actualizar estadísticas directamente si están presentes en la transmisión WebSocket
      if (estudiantesStats) {
        setActiveRoutes(prev => prev.map(r => {
          if (r.route?.id === routeId) {
            return {
              ...r,
              estudiantesStats
            };
          }
          return r;
        }));

        setSelectedRouteId(currentSelectedId => {
          if (currentSelectedId === routeId) {
            setSelectedRouteDetails(prev => {
              if (!prev) return null;
              return {
                ...prev,
                estudiantesStats
              };
            });
          }
          return currentSelectedId;
        });
      } else {
        // Fallback en caso de que no vengan las estadísticas en el payload
        refreshRouteStats(routeId);
      }
    });

    // Escuchar incidencias en tiempo real
    socket.on('incident_reported', (data) => {
      const { routeId, title, severity, timestamp, description } = data;
      const formattedTime = new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      toast.warning(`⚠️ INCIDENCIA: ${title} en la ruta activa.`);

      // Obtener el nombre de la ruta usando la referencia actualizada para evitar closures viejos
      const routeName = activeRoutesRef.current.find(r => r.route?.id === routeId)?.route?.nombre || 'Ruta Escolar';

      // Agregar a la lista de incidencias
      setAllIncidents(prev => [
        { _id: data.incidentId || Math.random(), title, severity, createdAt: timestamp, description, routeName },
        ...prev
      ]);

      // Si es la ruta enfocada, agregar a sus incidencias
      setSelectedRouteId(currentSelectedId => {
        if (currentSelectedId === routeId) {
          setSelectedRouteDetails(prev => {
            if (!prev) return null;
            return {
              ...prev,
              incidenciasActivas: [
                { id: data.incidentId, title, severity, status: 'active', createdAt: timestamp },
                ...(prev.incidenciasActivas || [])
              ]
            };
          });
        }
        return currentSelectedId;
      });
    });

    return () => {
      socket.disconnect();
    };
  }, []); // Sin dependencias para que solo se cree una vez

  // 3. Suscribirse a nuevas salas cuando aparezcan en la lista activeRoutes
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || activeRoutes.length === 0) return;

    activeRoutes.forEach(r => {
      if (r.route?.id && !activeRouteIdsRef.current.has(r.route.id)) {
        socket.emit('join_route', { routeId: r.route.id }, (res) => {
          if (res && res.status === 'ok') {
            activeRouteIdsRef.current.add(r.route.id);
            console.log(`Unido reactivamente a la sala de la ruta: ${r.route.id}`);
          }
        });
      }
    });
  }, [activeRoutes]);

  // Función para sincronizar estadísticas tras eventos
  const refreshRouteStats = async (routeId) => {
    try {
      const details = await routeService.getRouteMonitoring(routeId);
      
      // Actualizar listado de rutas activas
      setActiveRoutes(prev => prev.map(r => {
        if (r.route?.id === routeId) {
          return {
            ...r,
            estudiantesStats: details.estudiantesStats
          };
        }
        return r;
      }));

      // Si está seleccionado, actualizar panel detallado
      setSelectedRouteId(currentSelectedId => {
        if (currentSelectedId === routeId) {
          setSelectedRouteDetails(details);
        }
        return currentSelectedId;
      });
    } catch (err) {
      console.error('Error refreshing route stats:', err);
    }
  };

  // Manejar selección de ruta en curso para enfocar detalles
  const handleSelectRoute = async (routeId) => {
    setSelectedRouteId(routeId);
    setDetailsLoading(true);
    try {
      const details = await routeService.getRouteMonitoring(routeId);
      setSelectedRouteDetails(details);
      
      // Sincronizar incidencias activas de la ruta enfocada en el panel general
      if (Array.isArray(details.incidenciasActivas)) {
        const routeName = details.route?.nombre || 'Ruta';
        const mapped = details.incidenciasActivas.map(inc => ({
          ...inc,
          routeName
        }));
        setAllIncidents(mapped);
      }
    } catch (err) {
      console.error('Error loading route monitoring detail:', err);
      setSelectedRouteDetails(null);
    } finally {
      setDetailsLoading(false);
    }
  };

  return (
    <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1, minHeight: '100%', paddingBottom: '30px' }}>
      
      {/* Indicador de conexión y cabecera */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '15px', margin: 0, flex: 1 }}>
          Supervisa el recorrido satelital de los autobuses, horarios programados, abordajes de estudiantes y alertas viales en tiempo real.
        </p>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={() => { fetchActiveRoutes(); setSelectedRouteId(null); setSelectedRouteDetails(null); }}
            className="btn-secondary"
            style={{ padding: '8px 16px', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
            title="Sincronizar rutas"
          >
            <FaSyncAlt /> Refrescar
          </button>
          
          <div className="navbar-api-badge" style={{ background: 'rgba(34, 197, 94, 0.08)', color: 'var(--color-success)' }}>
            <FaBroadcastTower /> Canal WebSockets Activo
          </div>
        </div>
      </div>

      {/* Mapa Interactivo de Ancho Completo */}
      <div style={{ position: 'relative', width: '100%', height: '520px' }}>
        <MapView 
          activeRoutes={activeRoutes}
          selectedRoute={selectedRouteDetails}
          onSelectRoute={handleSelectRoute}
        />
        
        {/* Card Detalle Flotante */}
        {selectedRouteDetails && (
          <BusMarker 
            selectedRoute={selectedRouteDetails}
            onClose={() => { setSelectedRouteId(null); setSelectedRouteDetails(null); }}
          />
        )}
      </div>

      {/* Paneles de Información (Rutas e Incidencias) */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
        gap: '20px',
        alignItems: 'stretch'
      }} className="live-monitoring-info-grid">
        
        {/* Listado de Rutas en Curso */}
        <div style={{ display: 'flex', flexDirection: 'column', height: '420px' }}>
          <RouteStatus 
            activeRoutes={activeRoutes} 
            selectedRouteId={selectedRouteId} 
            onSelectRoute={handleSelectRoute}
          />
        </div>

        {/* Alertas e Incidencias en Vivo */}
        <div style={{ display: 'flex', flexDirection: 'column', height: '420px' }}>
          <IncidentPanel incidents={allIncidents} />
        </div>
      </div>

      {/* Event Stream Log Timeline (Eventos Recientes) */}
      <div className="glass-panel animate-fade-in" style={{ padding: '20px' }}>
        <h4 style={{ fontFamily: 'var(--font-heading)', fontWeight: '700', fontSize: '15px', color: 'var(--color-text)', marginBottom: '12px' }}>
          Registro de Eventos en Tiempo Real (Socket.IO Stream)
        </h4>
        <div style={{ 
          maxHeight: '120px', 
          overflowY: 'auto', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '6px', 
          padding: '8px', 
          background: 'rgba(0,0,0,0.01)', 
          borderRadius: 'var(--radius-md)',
          fontFamily: 'monospace',
          fontSize: '12px'
        }}>
          {eventStream.length === 0 ? (
            <span style={{ color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>
              Esperando transmisiones WebSocket de los dispositivos de conductores (abordajes / descensos)...
            </span>
          ) : (
            eventStream.map(evt => (
              <div key={evt.id} style={{ display: 'flex', gap: '8px', borderBottom: '1px solid rgba(0,0,0,0.02)', paddingBottom: '4px' }}>
                <span style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>[{evt.time}]</span>
                <span style={{ color: evt.type === 'boarded' ? '#8B5CF6' : 'var(--color-success)', fontWeight: '600' }}>
                  {evt.type === 'boarded' ? 'ABORDÓ' : 'DESCENDIÓ'}
                </span>
                <span>{evt.studentName}</span>
                <span style={{ color: 'var(--color-text-secondary)' }}>en la ruta ID {evt.routeId}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
