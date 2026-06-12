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
import IncidentCard from '../components/incidents/IncidentCard';
import IncidentDetail from '../components/incidents/IncidentDetail';

const MOCK_INCIDENTS = [
  {
    _id: "mockinc0001",
    title: "Tránsito detenido por accidente",
    description: "Tránsito completamente detenido en el kilómetro 12 debido a una colisión. Se estima un retraso de 25 minutos.",
    type: "delay",
    severity: "medium",
    status: "open",
    createdAt: new Date().toISOString(),
    route: { _id: "route1", nombre: "Ruta Colegio Norte", autobusId: { patente: "BUS-05", modelo: "Mercedes Sprinter" } },
    driver: { usuarioId: { nombre: "Carlos López", correo: "carlos.lopez@routenova.com" }, telefono: "+1 809-555-0123" },
    location: { latitude: 18.486, longitude: -69.931 }
  },
  {
    _id: "mockinc0002",
    title: "Falla mecánica en alternador",
    description: "Batería baja e indicador encendido en el tablero. Vehículo a un costado del camino esperando grúa de reemplazo.",
    type: "vehicle_breakdown",
    severity: "critical",
    status: "in_progress",
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    route: { _id: "route2", nombre: "Ruta Colegio Sur", autobusId: { patente: "BUS-09", modelo: "Hyundai County" } },
    driver: { usuarioId: { nombre: "Juan Pérez", correo: "juan.perez@routenova.com" }, telefono: "+1 809-555-0199" },
    location: { latitude: 18.462, longitude: -69.954 }
  },
  {
    _id: "mockinc0003",
    title: "Rutas alternas por fuerte lluvia",
    description: "Calles del sector bajo inundadas. El chofer desvía el trayecto por vías secundarias autorizadas.",
    type: "weather_condition",
    severity: "low",
    status: "resolved",
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    route: { _id: "route1", nombre: "Ruta Colegio Norte", autobusId: { patente: "BUS-05", modelo: "Mercedes Sprinter" } },
    driver: { usuarioId: { nombre: "Carlos López", correo: "carlos.lopez@routenova.com" }, telefono: "+1 809-555-0123" },
    location: { latitude: 18.471, longitude: -69.912 }
  }
];

export default function IncidentsPage() {
  const [dbIncidents, setDbIncidents] = useState([]);
  const [localMockIncidents, setLocalMockIncidents] = useState([]);
  const [usingMocks, setUsingMocks] = useState(false);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [routeFilter, setRouteFilter] = useState('');

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
      
      if (list.length > 0) {
        setUsingMocks(false);
      } else {
        setUsingMocks(true);
        if (localMockIncidents.length === 0) {
          setLocalMockIncidents(MOCK_INCIDENTS);
        }
      }
    } catch (err) {
      console.error('Error fetching incidents from API:', err);
      // Fallback a mocks en caso de error
      setUsingMocks(true);
      if (localMockIncidents.length === 0) {
        setLocalMockIncidents(MOCK_INCIDENTS);
      }
    } finally {
      setLoading(false);
    }
  };

  // Cambiar estado de la incidencia (PATCH)
  const handleChangeStatus = async (id, newStatus) => {
    setUpdatingStatus(true);
    try {
      if (usingMocks) {
        // Simular en local
        setLocalMockIncidents(prev => 
          prev.map(inc => inc._id === id ? { ...inc, status: newStatus } : inc)
        );
        // Actualizar en el modal si está abierto
        setSelectedIncident(prev => prev && prev._id === id ? { ...prev, status: newStatus } : prev);
        toast.success('Estado de incidencia simulado cambiado con éxito.');
      } else {
        // Llamada a la API real
        const response = await incidentService.updateIncidentStatus(id, newStatus);
        setDbIncidents(prev => 
          prev.map(inc => inc._id === id ? { ...inc, status: response.status } : inc)
        );
        // Actualizar en el modal
        setSelectedIncident(prev => prev && prev._id === id ? { ...prev, status: response.status } : prev);
        toast.success(`Incidencia actualizada a "${newStatus === 'open' ? 'Pendiente' : newStatus === 'in_progress' ? 'En revisión' : newStatus === 'resolved' ? 'Resuelta' : 'Cerrada'}".`);
      }
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
      if (usingMocks) {
        setLocalMockIncidents(prev => prev.filter(inc => inc._id !== id));
        toast.success('Incidencia simulada eliminada.');
      } else {
        await incidentService.deleteIncident(id);
        setDbIncidents(prev => prev.filter(inc => inc._id !== id));
        toast.success('Incidencia eliminada exitosamente.');
      }
      setIsDeleteModalOpen(false);
      setIncidentToDelete(null);
    } catch (err) {
      console.error('Error al eliminar incidencia:', err);
    } finally {
      setSubmittingDelete(false);
    }
  };

  // Obtener lista actual a filtrar
  const activeList = usingMocks ? localMockIncidents : dbIncidents;

  // Filtrar incidencias en cliente
  const filteredIncidents = activeList.filter((incident) => {
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
        routes={routes}
      />

      {usingMocks && (
        <div style={{ background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '10px 16px', borderRadius: 'var(--radius-md)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', color: '#60A5FA', marginBottom: '16px' }}>
          💡 <b>Visualización Simulada</b>: La base de datos no cuenta con incidencias registradas. Mostrando datos de simulación interactivos.
        </div>
      )}

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
        <>
          {/* TABLA DE ESCRITORIO (pantallas grandes) */}
          <IncidentTable 
            incidents={filteredIncidents}
            onSelect={setSelectedIncident}
            onDelete={handleOpenDeleteModal}
            isAdmin={isAdmin}
          />

          {/* TARJETAS DE MÓVIL (pantallas pequeñas) */}
          <IncidentCard 
            incidents={filteredIncidents}
            onSelect={setSelectedIncident}
            onDelete={handleOpenDeleteModal}
            isAdmin={isAdmin}
          />
        </>
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
      )}
    </div>
  );
}
