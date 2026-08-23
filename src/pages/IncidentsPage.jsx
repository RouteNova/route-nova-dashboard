import React, { useState, useEffect } from 'react';
import { 
  FaExclamationTriangle,
  FaTimes,
  FaSyncAlt,
  FaTrashAlt
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import { incidentService, routeService, authService } from '../services/api';
import IncidentFilters from '../components/incidents/IncidentFilters';
import IncidentTable from '../components/incidents/IncidentTable';
import IncidentDetail from '../components/incidents/IncidentDetail';
import ModalPortal from '../components/common/ModalPortal';

export default function IncidentsPage() {
  const [dbIncidents, setDbIncidents] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);

  const getTodayString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [routeFilter, setRouteFilter] = useState('');
  const [startDate, setStartDate] = useState(getTodayString());
  const [endDate, setEndDate] = useState(getTodayString());

  // Detalles e Interacciones
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [incidentToDelete, setIncidentToDelete] = useState(null);
  const [submittingDelete, setSubmittingDelete] = useState(false);

  // Info del usuario
  const currentUser = authService.getCurrentUser();
  const isAdmin = currentUser?.rol === 'administrador';

  useEffect(() => {
    fetchCatalogs();
    fetchIncidents();
  }, []);

  const fetchCatalogs = async () => {
    try {
      const data = await routeService.getRoutes();
      setRoutes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching routes catalog:', err);
    }
  };

  const fetchIncidents = async () => {
    setLoading(true);
    try {
      const data = await incidentService.getIncidents();
      const list = Array.isArray(data) ? data : [];
      setDbIncidents(list);
    } catch (err) {
      console.error('Error fetching incidents from API:', err);
      setDbIncidents([]);
    } finally {
      setLoading(false);
    }
  };

  // Cambiar estado de la incidencia (PATCH)
  const handleChangeStatus = async (id, newStatus) => {
    setUpdatingStatus(true);
    try {
      // Llamada a la API real
      const response = await incidentService.updateIncidentStatus(id, newStatus);
      setDbIncidents(prev => 
        prev.map(inc => inc._id === id ? { ...inc, status: response.status } : inc)
      );
      // Actualizar en el modal
      setSelectedIncident(prev => prev && prev._id === id ? { ...prev, status: response.status } : prev);
      toast.success(`Incidencia actualizada a "${newStatus === 'open' ? 'Pendiente' : newStatus === 'in_progress' ? 'En revisión' : newStatus === 'resolved' ? 'Resuelta' : 'Cerrada'}".`);
    } catch (err) {
      console.error('Error al actualizar estado de la incidencia:', err);
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Abrir modal de confirmación de borrado
  const handleOpenDeleteModal = (incident) => {
    setIncidentToDelete(incident);
    setIsDeleteModalOpen(true);
  };

  // Confirmar eliminación (DELETE)
  const handleDeleteConfirm = async () => {
    if (!incidentToDelete) return;
    setSubmittingDelete(true);
    try {
      const id = incidentToDelete._id || incidentToDelete.id;
      await incidentService.deleteIncident(id);
      setDbIncidents(prev => prev.filter(inc => inc._id !== id));
      toast.success('Incidencia eliminada exitosamente.');
      setIsDeleteModalOpen(false);
      setIncidentToDelete(null);
    } catch (err) {
      console.error('Error al eliminar incidencia:', err);
    } finally {
      setSubmittingDelete(false);
    }
  };

  // Filtrar incidencias en cliente
  const filteredIncidents = dbIncidents.filter((incident) => {
    // 1. Búsqueda por texto
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      const titleMatch = incident.title?.toLowerCase().includes(query);
      const descMatch = incident.description?.toLowerCase().includes(query);
      const typeMatch = incident.type?.toLowerCase().includes(query);
      if (!titleMatch && !descMatch && !typeMatch) return false;
    }

    // 2. Filtro de Estado
    if (statusFilter !== '') {
      if (incident.status !== statusFilter) return false;
    }

    // 3. Filtro de Gravedad
    if (severityFilter !== '') {
      if (incident.severity !== severityFilter) return false;
    }

    // 4. Filtro de Ruta
    if (routeFilter !== '') {
      const incidentRouteId = incident.route?._id || incident.route;
      if (incidentRouteId !== routeFilter) return false;
    }

    // 5. Filtro de Rango de Fechas (Por defecto el día actual si no se seleccionan específicas)
    const todayStr = getTodayString();
    const queryStartDate = startDate || todayStr;
    const queryEndDate = endDate || todayStr;

    if (incident.createdAt) {
      const incidentDate = new Date(incident.createdAt);
      if (queryStartDate) {
        const startLimit = new Date(queryStartDate);
        startLimit.setHours(0, 0, 0, 0);
        if (incidentDate < startLimit) return false;
      }
      if (queryEndDate) {
        const endLimit = new Date(queryEndDate);
        endLimit.setHours(23, 59, 59, 999);
        if (incidentDate > endLimit) return false;
      }
    }

    return true;
  });

  return (
    <div className="animate-slide-up" style={{ padding: '0 0 20px 0' }}>
      {/* Subcabecera descriptiva */}
      <div style={{ marginBottom: '24px' }}>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '15px' }}>
          Visualiza, gestiona y da seguimiento a las incidencias viales reportadas por los conductores de la flota. Modifica su estado operativo, revisa las ubicaciones exactas en el mapa y administra el historial técnico.
        </p>
      </div>

      {/* Componente de Filtros */}
      <IncidentFilters 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        severityFilter={severityFilter}
        setSeverityFilter={setSeverityFilter}
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
            Cargando incidencias del transporte...
          </span>
        </div>
      ) : filteredIncidents.length === 0 ? (
        <div className="glass-panel empty-state">
          <div className="empty-state-icon">🛡️</div>
          <h3 className="empty-state-title">No se encontraron incidencias</h3>
          <p style={{ fontSize: '14px', marginBottom: '16px' }}>
            Prueba a cambiar los filtros de búsqueda o el estado de visualización.
          </p>
        </div>
      ) : (
        <IncidentTable 
          incidents={filteredIncidents}
          onSelect={setSelectedIncident}
          onDelete={handleOpenDeleteModal}
          isAdmin={isAdmin}
        />
      )}

      {/* DETALLE DEL INCIDENTE */}
      {selectedIncident && (
        <IncidentDetail 
          incident={selectedIncident}
          onClose={() => setSelectedIncident(null)}
          onChangeStatus={handleChangeStatus}
          updatingStatus={updatingStatus}
        />
      )}

      {/* DIÁLOGO CONFIRMACIÓN ELIMINACIÓN */}
      {isDeleteModalOpen && (
        <ModalPortal>
          <div className="modal-overlay">
            <div className="glass-panel modal-dialog danger" style={{ maxWidth: '400px' }}>
              <div className="modal-header">
                <h3 className="modal-title" style={{ color: 'var(--color-danger)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  ¿Eliminar Incidencia?
                </h3>
                <button 
                  onClick={() => setIsDeleteModalOpen(false)} 
                  className="modal-close-btn"
                  aria-label="Cerrar modal de confirmación"
                >
                  <FaTimes />
                </button>
              </div>

              <div className="modal-body">
                <p style={{ color: 'var(--color-text)', fontSize: '14.5px', marginBottom: '12px' }}>
                  ¿Estás seguro de que deseas eliminar permanentemente la incidencia <strong>INC-{(incidentToDelete?._id || incidentToDelete?.id || '').slice(-4).toUpperCase()}</strong>?
                </p>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px' }}>
                  Esta acción es irreversible y la removerá de las estadísticas de rutas.
                </p>
              </div>

              <div className="modal-footer">
                <button 
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="btn-secondary"
                  disabled={submittingDelete}
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleDeleteConfirm}
                  className="btn-danger"
                  disabled={submittingDelete}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  {submittingDelete ? (
                    <>
                      <FaSyncAlt className="spin" style={{ animation: 'spin 1s linear infinite' }} /> Eliminando...
                    </>
                  ) : (
                    'Sí, Eliminar'
                  )}
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
}
