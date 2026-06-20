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

export default function EventsPage() {
  const [dbEvents, setDbEvents] = useState([]);
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

  // Recargar eventos al cambiar filtros
  useEffect(() => {
    fetchEvents();
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
    } catch (err) {
      console.error('Error fetching events from API:', err);
      setDbEvents([]);
    } finally {
      setLoading(false);
    }
  };

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

      {/* Grid de contenido */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px' }}>
          <div className="spinner" style={{ marginBottom: '16px' }}></div>
          <span style={{ color: 'var(--color-text-secondary)', fontSize: '14px', fontWeight: '500' }}>
            Consultando bitácora de auditoría...
          </span>
        </div>
      ) : dbEvents.length === 0 ? (
        <div className="glass-panel empty-state">
          <div className="empty-state-icon">📋</div>
          <h3 className="empty-state-title">No se encontraron eventos</h3>
          <p style={{ fontSize: '14px', marginBottom: '16px' }}>
            Prueba a cambiar las fechas o los criterios de búsqueda seleccionados.
          </p>
        </div>
      ) : (
          <EventTable 
            events={dbEvents}
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
