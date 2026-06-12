import React, { useState, useEffect } from 'react';
import { 
  FaClipboardList,
  FaSyncAlt,
  FaCalendarAlt
} from 'react-icons/fa';
import { eventService, routeService } from '../services/api';
import EventFilters from '../components/events/EventFilters';
import EventTable from '../components/events/EventTable';
import EventDetail from '../components/events/EventDetail';

const getMockEvents = () => {
  const today = new Date();
  const formatTime = (hours, minutes) => {
    const d = new Date(today);
    d.setHours(hours, minutes, 0, 0);
    return d.toISOString();
  };

  return [
    {
      _id: "evt0001",
      type: "route_started",
      description: "El conductor Carlos López inició el recorrido de la Ruta Colegio Norte.",
      createdAt: formatTime(7, 0),
      route: { _id: "route1", nombre: "Ruta Colegio Norte", autobusId: { patente: "BUS-01", modelo: "Mercedes Sprinter" } },
      driver: { usuarioId: { nombre: "Carlos López" }, telefono: "+1 809-555-0123" },
      location: { latitude: 18.486, longitude: -69.931 }
    },
    {
      _id: "evt0002",
      type: "student_boarded",
      description: "Ana Pérez abordó el transporte escolar.",
      createdAt: formatTime(7, 15),
      route: { _id: "route1", nombre: "Ruta Colegio Norte", autobusId: { patente: "BUS-01", modelo: "Mercedes Sprinter" } },
      driver: { usuarioId: { nombre: "Carlos López" }, telefono: "+1 809-555-0123" },
      student: { _id: "stud1", nombre: "Ana Pérez" },
      location: { latitude: 18.481, longitude: -69.935 }
    },
    {
      _id: "evt0003",
      type: "incident_reported",
      description: "Incidencia: Tráfico pesado en Autopista Duarte. Retraso estimado de 15 minutos.",
      createdAt: formatTime(7, 30),
      route: { _id: "route1", nombre: "Ruta Colegio Norte", autobusId: { patente: "BUS-01", modelo: "Mercedes Sprinter" } },
      driver: { usuarioId: { nombre: "Carlos López" }, telefono: "+1 809-555-0123" },
      location: { latitude: 18.475, longitude: -69.928 }
    },
    {
      _id: "evt0004",
      type: "student_dropped",
      description: "Ana Pérez descendió del transporte en Av. Principal.",
      createdAt: formatTime(8, 0),
      route: { _id: "route1", nombre: "Ruta Colegio Norte", autobusId: { patente: "BUS-01", modelo: "Mercedes Sprinter" } },
      driver: { usuarioId: { nombre: "Carlos López" }, telefono: "+1 809-555-0123" },
      student: { _id: "stud1", nombre: "Ana Pérez" },
      location: { latitude: 18.465, longitude: -69.915 }
    },
    {
      _id: "evt0005",
      type: "route_finished",
      description: "Ruta finalizada con éxito. Duración real: 1h 15min. Todos los alumnos entregados.",
      createdAt: formatTime(8, 15),
      route: { _id: "route1", nombre: "Ruta Colegio Norte", autobusId: { patente: "BUS-01", modelo: "Mercedes Sprinter" } },
      driver: { usuarioId: { nombre: "Carlos López" }, telefono: "+1 809-555-0123" },
      location: { latitude: 18.453, longitude: -69.905 }
    }
  ];
};

export default function EventsPage() {
  const [dbEvents, setDbEvents] = useState([]);
  const [localMockEvents, setLocalMockEvents] = useState([]);
  const [usingMocks, setUsingMocks] = useState(false);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [routeFilter, setRouteFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Detalle seleccionado
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Recargar eventos al cambiar filtros si se usa la BD real
  useEffect(() => {
    if (!usingMocks) {
      fetchEvents();
    }
  }, [typeFilter, routeFilter, startDate, endDate]);

  // Debounce para búsqueda textual
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchEvents();
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  useEffect(() => {
    fetchCatalogs();
    fetchEvents();
  }, []);

  const fetchCatalogs = async () => {
    try {
      const data = await routeService.getRoutes();
      setRoutes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading routes catalog:', err);
    }
  };

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const params = {};
      if (typeFilter) params.type = typeFilter;
      if (routeFilter) params.routeId = routeFilter;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (searchQuery.trim() !== '') params.search = searchQuery;

      const data = await eventService.getEvents(params);
      const list = Array.isArray(data) ? data : [];
      setDbEvents(list);
      
      // Si el servidor retorna eventos, o si hay filtros activos de búsqueda, usamos la API real
      if (list.length > 0 || typeFilter || routeFilter || startDate || endDate || searchQuery.trim() !== '') {
        setUsingMocks(false);
      } else {
        setUsingMocks(true);
        if (localMockEvents.length === 0) {
          setLocalMockEvents(getMockEvents());
        }
      }
    } catch (err) {
      console.error('Error fetching events from API:', err);
      // Fallback a simulación interactiva
      setUsingMocks(true);
      if (localMockEvents.length === 0) {
        setLocalMockEvents(getMockEvents());
      }
    } finally {
      setLoading(false);
    }
  };

  // Obtener lista actual a filtrar
  const activeList = usingMocks ? localMockEvents : dbEvents;

  // Filtrar eventos (necesario en cliente si se está usando el modo simulado)
  const filteredEvents = activeList.filter((event) => {
    if (usingMocks) {
      if (typeFilter && event.type !== typeFilter) return false;
      if (routeFilter && event.route?._id !== routeFilter) return false;
      
      if (startDate) {
        if (new Date(event.createdAt) < new Date(startDate)) return false;
      }
      if (endDate) {
        const endLimit = new Date(endDate);
        endLimit.setHours(23, 59, 59, 999);
        if (new Date(event.createdAt) > endLimit) return false;
      }

      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const studentMatch = event.student?.nombre?.toLowerCase().includes(q);
        const routeMatch = event.route?.nombre?.toLowerCase().includes(q);
        const descMatch = event.description?.toLowerCase().includes(q);
        if (!studentMatch && !routeMatch && !descMatch) return false;
      }
    }
    return true;
  });

  return (
    <div className="animate-slide-up" style={{ padding: '0 0 20px 0' }}>
      {/* Subcabecera descriptiva */}
      <div style={{ marginBottom: '24px' }}>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '15px' }}>
          Consulta la bitácora de auditoría histórica para todos los recorridos del sistema. Inspecciona los escaneos de abordaje QR, descensos en paradas y eventos del estado operativo de los autobuses.
        </p>
      </div>

      {/* Filtros */}
      <EventFilters 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        typeFilter={typeFilter}
        setTypeFilter={setTypeFilter}
        routeFilter={routeFilter}
        setRouteFilter={setRouteFilter}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        routes={routes}
      />

      {usingMocks && (
        <div style={{ background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '10px 16px', borderRadius: 'var(--radius-md)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', color: '#60A5FA', marginBottom: '16px' }}>
          💡 <b>Visualización Simulada</b>: No se registran eventos activos en la base de datos de auditoría. Mostrando bitácora interactiva de simulación.
        </div>
      )}

      {/* Grid de contenido */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px' }}>
          <div className="spinner" style={{ marginBottom: '16px' }}></div>
          <span style={{ color: 'var(--color-text-secondary)', fontSize: '14px', fontWeight: '500' }}>
            Consultando bitácora de auditoría...
          </span>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="glass-panel empty-state">
          <div className="empty-state-icon">📋</div>
          <h3 className="empty-state-title">No se encontraron eventos</h3>
          <p style={{ fontSize: '14px', marginBottom: '16px' }}>
            Prueba a cambiar las fechas o los criterios de búsqueda seleccionados.
          </p>
        </div>
      ) : (
          <EventTable 
            events={filteredEvents}
            onSelect={setSelectedEvent}
          />
      )}

      {/* MODAL DE DETALLE DE AUDITORÍA */}
      {selectedEvent && (
        <EventDetail 
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </div>
  );
}
