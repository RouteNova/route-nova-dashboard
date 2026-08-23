import React from 'react';
import { FaSearch } from 'react-icons/fa';

export default function IncidentFilters({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  severityFilter,
  setSeverityFilter,
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', width: '100%' }}>
        {/* Búsqueda por texto */}
        <div className="search-input-wrapper" style={{ margin: 0 }}>
          <FaSearch className="search-input-icon" />
          <input 
            type="text" 
            placeholder="Buscar por título o descripción..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field search-input-field"
          />
        </div>

        {/* Filtro de Estado */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input-field filter-select-field"
          style={{ width: '100%', height: '42px' }}
        >
          <option value="">-- Todos los estados --</option>
          <option value="open">Pendientes</option>
          <option value="in_progress">En revisión</option>
          <option value="resolved">Resueltas</option>
          <option value="closed">Cerradas</option>
        </select>

        {/* Filtro de Gravedad */}
        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value)}
          className="input-field filter-select-field"
          style={{ width: '100%', height: '42px' }}
        >
          <option value="">-- Todas las gravedades --</option>
          <option value="low">Leve</option>
          <option value="medium">Moderada</option>
          <option value="high">Alta</option>
          <option value="critical">Crítica</option>
        </select>

        {/* Filtro de Ruta */}
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

      {/* Rango de Fechas */}
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
