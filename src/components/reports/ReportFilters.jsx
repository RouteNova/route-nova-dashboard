import React from 'react';
import { FaSearch, FaSyncAlt } from 'react-icons/fa';

export default function ReportFilters({
  reportType,
  routes = [],
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  routeFilter,
  setRouteFilter,
  searchQuery,
  setSearchQuery,
  severityFilter,
  setSeverityFilter,
  statusFilter,
  setStatusFilter,
  onReset
}) {
  const showStudentSearch = reportType === 'students' || reportType === 'boarding';
  const showIncidentsFilter = reportType === 'incidents';

  return (
    <div className="users-toolbar glass-panel" style={{ padding: '20px', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', width: '100%', alignItems: 'end' }}>
        
        {/* Filtro de Rango de Fechas - Desde */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-secondary)' }}>Fecha Desde</label>
          <input 
            type="date" 
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="input-field"
            style={{ width: '100%', height: '42px', margin: 0 }}
          />
        </div>

        {/* Filtro de Rango de Fechas - Hasta */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-secondary)' }}>Fecha Hasta</label>
          <input 
            type="date" 
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="input-field"
            style={{ width: '100%', height: '42px', margin: 0 }}
          />
        </div>

        {/* Filtro de Ruta */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-secondary)' }}>Ruta Escolar</label>
          <select
            value={routeFilter}
            onChange={(e) => setRouteFilter(e.target.value)}
            className="input-field filter-select-field"
            style={{ width: '100%', height: '42px', margin: 0 }}
          >
            <option value="">-- Todas las rutas --</option>
            {routes.map(route => (
              <option key={route._id || route.id} value={route._id || route.id}>
                {route.nombre}
              </option>
            ))}
          </select>
        </div>

        {/* Filtro de búsqueda de Estudiante */}
        {showStudentSearch && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-secondary)' }}>Buscar Estudiante</label>
            <div className="search-input-wrapper" style={{ margin: 0, width: '100%', height: '42px' }}>
              <FaSearch className="search-input-icon" />
              <input 
                type="text" 
                placeholder="Nombre del estudiante..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-field search-input-field"
                style={{ width: '100%', height: '100%' }}
              />
            </div>
          </div>
        )}

        {/* Filtros de Incidencias: Gravedad */}
        {showIncidentsFilter && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-secondary)' }}>Gravedad</label>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="input-field filter-select-field"
              style={{ width: '100%', height: '42px', margin: 0 }}
            >
              <option value="">-- Todas las gravedades --</option>
              <option value="low">Leve</option>
              <option value="medium">Moderada</option>
              <option value="high">Alta</option>
              <option value="critical">Crítica</option>
            </select>
          </div>
        )}

        {/* Filtros de Incidencias: Estado */}
        {showIncidentsFilter && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-text-secondary)' }}>Estado</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field filter-select-field"
              style={{ width: '100%', height: '42px', margin: 0 }}
            >
              <option value="">-- Todos los estados --</option>
              <option value="open">Pendientes</option>
              <option value="in_progress">En revisión</option>
              <option value="resolved">Resueltas</option>
              <option value="closed">Cerradas</option>
            </select>
          </div>
        )}

        {/* Botón de Resetear */}
        <button
          onClick={onReset}
          className="btn-secondary"
          style={{ 
            height: '42px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: '8px', 
            fontWeight: '600',
            fontSize: '13px',
            margin: 0
          }}
        >
          <FaSyncAlt /> Limpiar Filtros
        </button>

      </div>
    </div>
  );
}
