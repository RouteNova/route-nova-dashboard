import React from 'react';
import { FaSearch } from 'react-icons/fa';

export default function EventFilters({
  searchQuery,
  setSearchQuery,
  typeFilter,
  setTypeFilter,
  routeFilter,
  setRouteFilter,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  routes = []
}) {
  return (
    <div className="users-toolbar" style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
      {/* Primera fila de filtros: Búsqueda y Tipo de Evento */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', width: '100%' }}>
        {/* Búsqueda por texto */}
        <div className="search-input-wrapper" style={{ margin: 0 }}>
          <FaSearch className="search-input-icon" />
          <input 
            type="text" 
            placeholder="Buscar alumno, ruta, desc..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field search-input-field"
          />
        </div>

        {/* Filtro por Tipo de Evento */}
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="input-field filter-select-field"
          style={{ width: '100%', height: '42px' }}
        >
          <option value="">-- Todos los tipos --</option>
          <option value="route_started">Inicio de Ruta 🟢</option>
          <option value="route_finished">Fin de Ruta 🔴</option>
          <option value="student_boarded">Abordaje de Estudiante ✅</option>
          <option value="student_dropped">Descenso de Estudiante 📍</option>
          <option value="incident_reported">Incidencia Reportada ⚠️</option>
          <option value="route_deviated">Desvío de Ruta 🗺️</option>
          <option value="route_delayed">Demora de Ruta ⏰</option>
        </select>

        {/* Filtro por Ruta */}
        <select
          value={routeFilter}
          onChange={(e) => setRouteFilter(e.target.value)}
          className="input-field filter-select-field"
          style={{ width: '100%', height: '42px' }}
        >
          <option value="">-- Todas las rutas --</option>
          {routes.map(route => (
            <option key={route._id} value={route._id}>
              {route.nombre}
            </option>
          ))}
        </select>
      </div>

      {/* Segunda fila de filtros: Rango de Fechas */}
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap', borderTop: '1px dashed var(--color-border)', paddingTop: '12px', width: '100%' }}>
        <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--color-text-secondary)' }}>
          Rango de Fechas:
        </span>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }} htmlFor="start-date-input">Desde:</label>
          <input 
            type="date"
            id="start-date-input"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="input-field"
            style={{ padding: '6px 12px', height: '34px', fontSize: '13px', width: '140px', margin: 0 }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }} htmlFor="end-date-input">Hasta:</label>
          <input 
            type="date"
            id="end-date-input"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="input-field"
            style={{ padding: '6px 12px', height: '34px', fontSize: '13px', width: '140px', margin: 0 }}
          />
        </div>

        {(startDate || endDate) && (
          <button
            type="button"
            onClick={() => { setStartDate(''); setEndDate(''); }}
            className="btn-secondary"
            style={{ padding: '6px 12px', fontSize: '12px', height: '34px' }}
          >
            Limpiar Fechas
          </button>
        )}
      </div>
    </div>
  );
}
