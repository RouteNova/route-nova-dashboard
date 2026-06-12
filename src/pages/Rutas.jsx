import React, { useState, useEffect, useRef } from 'react';
import { 
  FaSearch, 
  FaRoute, 
  FaEdit, 
  FaTrashAlt, 
  FaTimes, 
  FaExclamationTriangle,
  FaSyncAlt,
  FaPlus,
  FaMapMarkerAlt,
  FaClock,
  FaUserTie,
  FaBus
} from 'react-icons/fa';
import { routeService, conductorService, autobusService } from '../services/api';
import { toast } from 'react-toastify';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || 'pk.eyJ1IjoiZnJhbmNpc2NvMDgyIiwiYSI6ImNtcWI0eXJkMDBkZm0yc3F5bGNkMDdudW8ifQ.hUD-NrHEMSqRfWiNmJs6hA';
mapboxgl.accessToken = MAPBOX_TOKEN;

export default function Rutas() {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Catálogos para formularios
  const [conductors, setConductors] = useState([]);
  const [autobuses, setAutobuses] = useState([]);

  // Filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' o 'edit'
  const [selectedRoute, setSelectedRoute] = useState(null);
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [routeToDelete, setRouteToDelete] = useState(null);

  // Formulario
  const [formValues, setFormValues] = useState({
    nombre: '',
    estado: 'programada',
    horaSalida: '',
    horaLlegada: '',
    conductorId: '',
    autobusId: '',
    umbralDesvio: 200,
    puntosRuta: [] // Array de { latitud: number, longitud: number }
  });

  // Estado temporal para añadir un punto de control (coordenada)
  const [tempLat, setTempLat] = useState('');
  const [tempLng, setTempLng] = useState('');
  
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Referencias para el visor de mapas interactivo de Mapbox en el modal
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const routeMarkersRef = useRef([]);

  // Inicializar y controlar el mapa dentro del modal de creación/edición
  useEffect(() => {
    if (!isModalOpen || !mapContainerRef.current) return;

    // Inicializar mapa
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12', // Estilo de calles para trazar la ruta con precisión
      center: [-69.931, 18.486], // Centro por defecto (Santo Domingo)
      zoom: 12,
      attributionControl: false
    });

    mapInstanceRef.current = map;

    // Si ya existen puntos cargados (en caso de edición), centrar la cámara del mapa
    if (formValues.puntosRuta && formValues.puntosRuta.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      formValues.puntosRuta.forEach(pt => {
        bounds.extend([parseFloat(pt.longitud), parseFloat(pt.latitud)]);
      });
      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.fitBounds(bounds, { padding: 40, maxZoom: 15, duration: 1000 });
        }
      }, 200);
    }

    // Agregar manejador de click para añadir puntos de control GPS
    map.on('click', (e) => {
      const { lng, lat } = e.lngLat;
      const newPoint = { latitud: parseFloat(lat.toFixed(6)), longitud: parseFloat(lng.toFixed(6)) };
      
      setFormValues(prev => ({
        ...prev,
        puntosRuta: [...prev.puntosRuta, newPoint]
      }));
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isModalOpen]);

  // Actualizar la polilínea y los marcadores del mapa cuando cambien los puntos de ruta en el estado
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const runMapUpdates = () => {
      // 1. Eliminar marcadores anteriores
      routeMarkersRef.current.forEach(m => m.remove());
      routeMarkersRef.current = [];

      const pathCoords = formValues.puntosRuta.map(p => [parseFloat(p.longitud), parseFloat(p.latitud)]);
      const sourceId = 'form-route-source';
      const layerId = 'form-route-layer';

      // 2. Dibujar o actualizar línea del trayecto
      if (pathCoords.length > 0) {
        const geojson = {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: pathCoords
          }
        };

        if (map.getSource(sourceId)) {
          map.getSource(sourceId).setData(geojson);
        } else {
          map.addSource(sourceId, {
            type: 'geojson',
            data: geojson
          });
          map.addLayer({
            id: layerId,
            type: 'line',
            source: sourceId,
            layout: {
              'line-join': 'round',
              'line-cap': 'round'
            },
            paint: {
              'line-color': '#2563EB', // Azul
              'line-width': 4,
              'line-opacity': 0.8
            }
          });
        }

        // 3. Agregar marcadores numerados con colores interactivos
        formValues.puntosRuta.forEach((pt, idx) => {
          const el = document.createElement('div');
          el.style.width = '20px';
          el.style.height = '20px';
          el.style.borderRadius = '50%';
          el.style.background = idx === 0 ? '#22C55E' : idx === formValues.puntosRuta.length - 1 ? '#EF4444' : '#F59E0B';
          el.style.border = '2px solid white';
          el.style.boxShadow = '0 1px 4px rgba(0,0,0,0.35)';
          el.style.color = 'white';
          el.style.fontSize = '9px';
          el.style.fontWeight = '800';
          el.style.display = 'flex';
          el.style.alignItems = 'center';
          el.style.justifyContent = 'center';
          el.style.cursor = 'pointer';
          el.innerHTML = (idx + 1).toString();

          const marker = new mapboxgl.Marker({ element: el, anchor: 'center' })
            .setLngLat([parseFloat(pt.longitud), parseFloat(pt.latitud)])
            .addTo(map);

          routeMarkersRef.current.push(marker);
        });
      } else {
        // Remover capa si la lista se vacía
        if (map.getLayer(layerId)) map.removeLayer(layerId);
        if (map.getSource(sourceId)) map.removeSource(sourceId);
      }
    };

    if (map.isStyleLoaded()) {
      runMapUpdates();
    } else {
      map.once('style.load', runMapUpdates);
    }
  }, [formValues.puntosRuta]);

  // Cargar rutas con debounce para búsqueda
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchRoutes();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, statusFilter]);

  // Cargar catálogos de conductores y autobuses al iniciar
  useEffect(() => {
    fetchCatalogs();
  }, []);

  const fetchRoutes = async () => {
    setLoading(true);
    try {
      const params = {};
      if (searchQuery.trim() !== '') {
        params.search = searchQuery;
      }
      if (statusFilter !== '') {
        params.estado = statusFilter;
      }
      const data = await routeService.getRoutes(params);
      const list = Array.isArray(data) ? data : [];
      setRoutes(list);
    } catch (err) {
      console.error('Error fetching routes:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCatalogs = async () => {
    try {
      // Obtener conductores operativos
      const condsData = await conductorService.getConductors();
      const condsList = Array.isArray(condsData) ? condsData : [];
      // Filtrar para asegurar que tienen usuario base asociado
      setConductors(condsList.filter(c => c.usuarioId));

      // Obtener autobuses
      const busesData = await autobusService.getAutobuses();
      const busesList = Array.isArray(busesData) ? busesData : [];
      setAutobuses(busesList);
    } catch (err) {
      console.error('Error loading route form catalogs:', err);
    }
  };

  // Abrir modal de creación
  const handleOpenCreateModal = () => {
    setModalMode('create');
    setFormValues({
      nombre: '',
      estado: 'programada',
      horaSalida: '',
      horaLlegada: '',
      conductorId: '',
      autobusId: '',
      umbralDesvio: 200,
      puntosRuta: []
    });
    setTempLat('');
    setTempLng('');
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Abrir modal de edición
  const handleOpenEditModal = (route) => {
    setModalMode('edit');
    setSelectedRoute(route);
    setFormValues({
      nombre: route.nombre || '',
      estado: route.estado || 'programada',
      horaSalida: route.horaSalida || '',
      horaLlegada: route.horaLlegada || '',
      // Mapeamos el _id del conductorId populado
      conductorId: route.conductorId?._id || '',
      // Mapeamos el _id del autobusId populado
      autobusId: route.autobusId?._id || '',
      umbralDesvio: route.umbralDesvio !== undefined ? route.umbralDesvio : 200,
      puntosRuta: Array.isArray(route.puntosRuta) ? route.puntosRuta : []
    });
    setTempLat('');
    setTempLng('');
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Abrir modal de eliminación
  const handleOpenDeleteModal = (route) => {
    setRouteToDelete(route);
    setIsDeleteModalOpen(true);
  };

  // Manejar cambios en campos de formulario
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormValues(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Añadir un punto GPS a la ruta
  const handleAddPoint = () => {
    const lat = parseFloat(tempLat);
    const lng = parseFloat(tempLng);

    if (isNaN(lat) || lat < -90 || lat > 90) {
      toast.error('La latitud debe ser un número válido entre -90 y 90.');
      return;
    }
    if (isNaN(lng) || lng < -180 || lng > 180) {
      toast.error('La longitud debe ser un número válido entre -180 y 180.');
      return;
    }

    setFormValues(prev => ({
      ...prev,
      puntosRuta: [...prev.puntosRuta, { latitud: lat, longitud: lng }]
    }));

    setTempLat('');
    setTempLng('');
  };

  // Eliminar un punto GPS de la ruta
  const handleRemovePoint = (indexToRemove) => {
    setFormValues(prev => ({
      ...prev,
      puntosRuta: prev.puntosRuta.filter((_, idx) => idx !== indexToRemove)
    }));
  };

  // Validar formulario
  const validateForm = () => {
    const errors = {};

    if (!formValues.nombre || formValues.nombre.trim() === '') {
      errors.nombre = 'El nombre de la ruta es obligatorio';
    }

    if (!formValues.horaSalida || formValues.horaSalida === '') {
      errors.horaSalida = 'La hora de salida es obligatoria';
    }

    if (!formValues.horaLlegada || formValues.horaLlegada === '') {
      errors.horaLlegada = 'La hora de llegada es obligatoria';
    }

    if (!formValues.conductorId) {
      errors.conductorId = 'El conductor asignado es obligatorio';
    }

    if (!formValues.autobusId) {
      errors.autobusId = 'El autobús asignado es obligatorio';
    }

    const umbralNum = Number(formValues.umbralDesvio);
    if (formValues.umbralDesvio === '' || isNaN(umbralNum) || umbralNum < 10) {
      errors.umbralDesvio = 'El umbral de desvío debe ser un número de al menos 10 metros';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Guardar Ruta (Crear o Editar)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const payload = {
        ...formValues,
        umbralDesvio: parseInt(formValues.umbralDesvio, 10)
      };

      if (modalMode === 'create') {
        const response = await routeService.createRoute(payload);
        toast.success(`Ruta escolar "${response.nombre}" creada con éxito.`);
      } else {
        const response = await routeService.updateRoute(selectedRoute._id, payload);
        toast.success(`Ruta escolar "${response.nombre}" actualizada con éxito.`);
      }

      setIsModalOpen(false);
      fetchRoutes();
    } catch (err) {
      console.error('Error saving route:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Confirmar eliminación de ruta
  const handleDeleteConfirm = async () => {
    if (!routeToDelete) return;

    setSubmitting(true);
    try {
      await routeService.deleteRoute(routeToDelete._id);
      toast.success('Ruta escolar eliminada exitosamente.');
      setIsDeleteModalOpen(false);
      setRouteToDelete(null);
      fetchRoutes();
    } catch (err) {
      console.error('Error deleting route:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Retorna color del badge para estado de la ruta
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'programada':
        return 'role-badge admin'; // Azul
      case 'en_curso':
        return 'role-badge conductor'; // Violeta (En alerta)
      case 'finalizada':
        return 'role-badge padre'; // Verde
      default:
        return 'status-badge inactive';
    }
  };

  return (
    <div className="animate-slide-up" style={{ padding: '0 0 20px 0' }}>
      {/* Subcabecera descriptiva */}
      <div style={{ marginBottom: '24px' }}>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '15px' }}>
          Administra los trayectos programados de transporte escolar. Define horarios de salida y llegada, asigna conductores y autobuses de la flota, y configura los puntos geográficos de ruta y tolerancia de desvío.
        </p>
      </div>

      {/* Barra de Herramientas con Filtros y Botón de Crear */}
      <div className="users-toolbar">
        <div className="users-filters">
          <div className="search-input-wrapper">
            <FaSearch className="search-input-icon" />
            <input 
              type="text" 
              placeholder="Buscar por nombre de ruta..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field search-input-field"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field filter-select-field"
          >
            <option value="">-- Todos los estados --</option>
            <option value="programada">Programada</option>
            <option value="en_curso">En curso</option>
            <option value="finalizada">Finalizada</option>
          </select>
        </div>

        <button 
          onClick={handleOpenCreateModal}
          className="btn-primary btn-add-user"
        >
          <FaPlus /> Nueva Ruta
        </button>
      </div>

      {/* Grid de rutas o estado vacío */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px' }}>
          <div className="spinner" style={{ marginBottom: '16px' }}></div>
          <span style={{ color: 'var(--color-text-secondary)', fontSize: '14px', fontWeight: '500' }}>
            Cargando rutas escolares...
          </span>
        </div>
      ) : routes.length === 0 ? (
        <div className="glass-panel empty-state">
          <div className="empty-state-icon">🗺️</div>
          <h3 className="empty-state-title">No se encontraron rutas</h3>
          <p style={{ fontSize: '14px', marginBottom: '16px' }}>
            {searchQuery || statusFilter
              ? 'Prueba a cambiar los filtros o el texto de búsqueda.'
              : 'Empieza registrando la primera ruta escolar usando el botón superior.'}
          </p>
          {(searchQuery || statusFilter) && (
            <button 
              onClick={() => { setSearchQuery(''); setStatusFilter(''); }}
              className="btn-secondary"
              style={{ fontSize: '13px', padding: '8px 16px' }}
            >
              Restablecer filtros
            </button>
          )}
        </div>
      ) : (
        <>
          {/* TABLA DE ESCRITORIO (resoluciones > 768px por CSS) */}
          <div className="glass-panel users-table-container animate-fade-in">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Nombre de Ruta</th>
                  <th>Horario (Salida / Regreso)</th>
                  <th>Conductor Asignado</th>
                  <th>Autobús Asignado</th>
                  <th>Puntos GPS</th>
                  <th style={{ textAlign: 'center' }}>Estado</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {routes.map((route) => (
                  <tr key={route._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div className="avatar-circle" style={{ background: 'rgba(37, 99, 235, 0.1)', color: 'var(--color-primary)', width: '36px', height: '36px' }}>
                          <FaRoute style={{ fontSize: '14px' }} />
                        </div>
                        <div style={{ fontWeight: '600', color: 'var(--color-text)' }}>
                          {route.nombre}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                        <FaClock style={{ color: 'var(--color-text-secondary)', fontSize: '11px' }} /> {route.horaSalida} - {route.horaLlegada}
                      </span>
                    </td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <FaUserTie style={{ color: 'var(--color-text-secondary)', fontSize: '12px' }} /> {route.conductorId?.nombre || 'Sin conductor'}
                      </span>
                    </td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <FaBus style={{ color: 'var(--color-text-secondary)', fontSize: '12px' }} /> {route.autobusId?.patente || 'Sin bus'} ({route.autobusId?.modelo || 'N/A'})
                      </span>
                    </td>
                    <td style={{ fontWeight: '500' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                        <FaMapMarkerAlt style={{ color: 'var(--color-primary)', fontSize: '12px' }} /> {route.puntosRuta?.length || 0} puntos
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={getStatusBadgeClass(route.estado)} style={{ minWidth: '90px', justifyContent: 'center' }}>
                        {route.estado === 'programada' ? 'Programada' : route.estado === 'en_curso' ? 'En Curso' : 'Finalizada'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="actions-cell" style={{ justifyContent: 'flex-end' }}>
                        <button 
                          onClick={() => handleOpenEditModal(route)}
                          className="action-btn edit"
                          title="Editar ruta"
                          aria-label={`Editar ruta ${route.nombre}`}
                        >
                          <FaEdit />
                        </button>
                        <button 
                          onClick={() => handleOpenDeleteModal(route)}
                          className="action-btn delete"
                          title="Eliminar ruta"
                          aria-label={`Eliminar ruta ${route.nombre}`}
                        >
                          <FaTrashAlt />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* TARJETAS DE MÓVIL/TABLET (resoluciones <= 768px por CSS) */}
          <div className="users-cards-grid animate-fade-in">
            {routes.map((route) => (
              <div className="glass-panel user-card" key={route._id}>
                <div className="user-card-header">
                  <div className="user-card-avatar">
                    <div className="avatar-circle" style={{ background: 'rgba(37, 99, 235, 0.1)', color: 'var(--color-primary)' }}>
                      <FaRoute />
                    </div>
                    <div>
                      <h4 className="user-card-name">{route.nombre}</h4>
                      <span className="user-card-email">Estado: <span className={getStatusBadgeClass(route.estado)} style={{ display: 'inline-block', fontSize: '10px', padding: '2px 6px' }}>{route.estado}</span></span>
                    </div>
                  </div>
                </div>

                <div className="user-card-details">
                  <span>Horario:</span>
                  <span>{route.horaSalida} - {route.horaLlegada}</span>
                </div>

                <div className="user-card-details">
                  <span>Conductor:</span>
                  <span>{route.conductorId?.nombre || 'Sin conductor'}</span>
                </div>

                <div className="user-card-details">
                  <span>Autobús:</span>
                  <span>{route.autobusId?.patente || 'Sin bus'}</span>
                </div>

                <div className="user-card-details">
                  <span>Puntos GPS:</span>
                  <span>{route.puntosRuta?.length || 0} puntos</span>
                </div>

                <div className="user-card-actions">
                  <button 
                    onClick={() => handleOpenEditModal(route)}
                    className="action-btn edit"
                    title="Editar ruta"
                    aria-label={`Editar móvil de ${route.nombre}`}
                  >
                    <FaEdit />
                  </button>
                  <button 
                    onClick={() => handleOpenDeleteModal(route)}
                    className="action-btn delete"
                    title="Eliminar ruta"
                    aria-label={`Eliminar móvil de ${route.nombre}`}
                  >
                    <FaTrashAlt />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* MODAL DE CREACIÓN / EDICIÓN */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="glass-panel modal-dialog" style={{ maxWidth: '550px', maxHeight: '92vh' }}>
            <div className="modal-header">
              <h3 className="modal-title">
                {modalMode === 'create' ? 'Registrar Nueva Ruta Escolar' : 'Editar Datos de Ruta'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="modal-close-btn"
                aria-label="Cerrar modal de formulario"
              >
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Nombre de la Ruta */}
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label" htmlFor="route-nombre">Nombre de la Ruta</label>
                  <input 
                    type="text" 
                    id="route-nombre"
                    name="nombre"
                    value={formValues.nombre}
                    onChange={handleInputChange}
                    className={`input-field ${formErrors.nombre ? 'error' : ''}`}
                    placeholder="Ej. Ruta Norte - Las Condes"
                    required
                  />
                  {formErrors.nombre && (
                    <span className="field-error-text">{formErrors.nombre}</span>
                  )}
                </div>

                {/* Grid Horas y Estado */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label className="input-label" htmlFor="route-salida">Hora Salida (HH:MM)</label>
                    <input 
                      type="time" 
                      id="route-salida"
                      name="horaSalida"
                      value={formValues.horaSalida}
                      onChange={handleInputChange}
                      className={`input-field ${formErrors.horaSalida ? 'error' : ''}`}
                      required
                    />
                    {formErrors.horaSalida && (
                      <span className="field-error-text">{formErrors.horaSalida}</span>
                    )}
                  </div>

                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label className="input-label" htmlFor="route-llegada">Hora Regreso (HH:MM)</label>
                    <input 
                      type="time" 
                      id="route-llegada"
                      name="horaLlegada"
                      value={formValues.horaLlegada}
                      onChange={handleInputChange}
                      className={`input-field ${formErrors.horaLlegada ? 'error' : ''}`}
                      required
                    />
                    {formErrors.horaLlegada && (
                      <span className="field-error-text">{formErrors.horaLlegada}</span>
                    )}
                  </div>
                </div>

                {/* Conductor y Autobús */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label className="input-label" htmlFor="route-conductor">Conductor Asignado</label>
                    <select 
                      id="route-conductor"
                      name="conductorId"
                      value={formValues.conductorId}
                      onChange={handleInputChange}
                      className={`input-field ${formErrors.conductorId ? 'error' : ''}`}
                      required
                    >
                      <option value="">-- Seleccionar --</option>
                      {conductors.map(c => (
                        <option key={c._id} value={c.usuarioId._id}>{c.usuarioId.nombre}</option>
                      ))}
                    </select>
                    {formErrors.conductorId && (
                      <span className="field-error-text">{formErrors.conductorId}</span>
                    )}
                  </div>

                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label className="input-label" htmlFor="route-autobus">Autobús Asignado</label>
                    <select 
                      id="route-autobus"
                      name="autobusId"
                      value={formValues.autobusId}
                      onChange={handleInputChange}
                      className={`input-field ${formErrors.autobusId ? 'error' : ''}`}
                      required
                    >
                      <option value="">-- Seleccionar --</option>
                      {autobuses.map(b => (
                        <option key={b._id} value={b._id} disabled={b.activo === false}>
                          {b.patente} ({b.modelo}) {b.activo === false ? '[Inactivo]' : ''}
                        </option>
                      ))}
                    </select>
                    {formErrors.autobusId && (
                      <span className="field-error-text">{formErrors.autobusId}</span>
                    )}
                  </div>
                </div>

                {/* Estado y Umbral de desvío */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label className="input-label" htmlFor="route-estado">Estado de la Ruta</label>
                    <select 
                      id="route-estado"
                      name="estado"
                      value={formValues.estado}
                      onChange={handleInputChange}
                      className="input-field"
                    >
                      <option value="programada">Programada</option>
                      <option value="en_curso">En curso</option>
                      <option value="finalizada">Finalizada</option>
                    </select>
                  </div>

                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label className="input-label" htmlFor="route-umbral">Umbral Desvío (Metros)</label>
                    <input 
                      type="number" 
                      id="route-umbral"
                      name="umbralDesvio"
                      value={formValues.umbralDesvio}
                      onChange={handleInputChange}
                      className={`input-field ${formErrors.umbralDesvio ? 'error' : ''}`}
                      min="10"
                      required
                    />
                    {formErrors.umbralDesvio && (
                      <span className="field-error-text">{formErrors.umbralDesvio}</span>
                    )}
                  </div>
                </div>

                {/* Constructor de Puntos de Control (puntosRuta) */}
                <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ fontFamily: 'var(--font-heading)', fontWeight: '700', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                      <FaMapMarkerAlt style={{ color: 'var(--color-primary)' }} /> Trazado de Trayecto (Mapa Interactivo)
                    </h4>
                    {formValues.puntosRuta.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setFormValues(prev => ({ ...prev, puntosRuta: [] }))}
                        className="btn-secondary"
                        style={{ padding: '4px 10px', fontSize: '11px', height: 'auto', border: '1px solid var(--color-danger)', color: 'var(--color-danger)' }}
                      >
                        Limpiar Puntos
                      </button>
                    )}
                  </div>
                  
                  <p style={{ color: 'var(--color-text-secondary)', fontSize: '11px', margin: 0 }}>
                    💡 <b>Haz clic en el mapa</b> para trazar la ruta punto a punto de forma secuencial.
                  </p>

                  {/* Contenedor del Mapa Mapbox */}
                  <div 
                    ref={mapContainerRef} 
                    style={{ 
                      width: '100%', 
                      height: '240px', 
                      borderRadius: 'var(--radius-md)', 
                      border: '1px solid var(--color-border)',
                      overflow: 'hidden'
                    }}
                  />
                  
                  {/* Lista de Puntos actuales */}
                  <div style={{ maxHeight: '100px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', background: 'rgba(0, 0, 0, 0.02)', padding: '6px', borderRadius: 'var(--radius-md)' }}>
                    {formValues.puntosRuta.length === 0 ? (
                      <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', padding: '6px', fontStyle: 'italic' }}>
                        Usa el mapa de arriba para añadir paradas y puntos de control al trayecto.
                      </span>
                    ) : (
                      formValues.puntosRuta.map((pt, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-card)', padding: '4px 10px', borderRadius: '4px', border: '1px solid var(--color-border)' }}>
                          <span style={{ fontSize: '11px', color: 'var(--color-text)', fontWeight: '600' }}>
                            {idx === 0 ? '🏁 Inicio' : idx === formValues.puntosRuta.length - 1 ? '🏫 Escuela' : `📍 Punto ${idx + 1}`}: Lat: {pt.latitud}, Lng: {pt.longitud}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemovePoint(idx)}
                            style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '2px' }}
                            title="Eliminar punto"
                          >
                            <FaTimes />
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Formulario rápido para añadir punto manualmente como alternativa */}
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', borderTop: '1px dashed var(--color-border)', paddingTop: '10px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '10px', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '2px' }}>Latitud Manual</label>
                      <input 
                        type="text" 
                        placeholder="Ej. 18.486" 
                        value={tempLat} 
                        onChange={(e) => setTempLat(e.target.value)} 
                        className="input-field" 
                        style={{ padding: '6px 8px', fontSize: '11px', height: '32px' }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '10px', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '2px' }}>Longitud Manual</label>
                      <input 
                        type="text" 
                        placeholder="Ej. -69.931" 
                        value={tempLng} 
                        onChange={(e) => setTempLng(e.target.value)} 
                        className="input-field" 
                        style={{ padding: '6px 8px', fontSize: '11px', height: '32px' }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleAddPoint}
                      className="btn-secondary"
                      style={{ padding: '6px 12px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', fontSize: '11px' }}
                    >
                      <FaPlus /> Añadir
                    </button>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="btn-secondary"
                  disabled={submitting}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn-primary btn-submit"
                  disabled={submitting}
                >
                  {submitting ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FaSyncAlt className="spin" style={{ animation: 'spin 1s linear infinite' }} /> Guardando...
                    </div>
                  ) : (
                    modalMode === 'create' ? 'Crear Ruta' : 'Guardar Cambios'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN */}
      {isDeleteModalOpen && (
        <div className="modal-overlay">
          <div className="glass-panel modal-dialog danger" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ color: 'var(--color-danger)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FaExclamationTriangle /> ¿Eliminar Ruta Escolar?
              </h3>
              <button 
                onClick={() => setIsDeleteModalOpen(false)} 
                className="modal-close-btn"
                aria-label="Cerrar modal de eliminación"
              >
                <FaTimes />
              </button>
            </div>

            <div className="modal-body">
              <p style={{ color: 'var(--color-text)', fontSize: '14px', marginBottom: '12px' }}>
                ¿Estás seguro de que deseas eliminar permanentemente la ruta escolar <strong>{routeToDelete?.nombre}</strong>?
              </p>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px' }}>
                Esta acción no se puede deshacer y removerá la asignación de ruta de todos los alumnos vinculados.
              </p>
            </div>

            <div className="modal-footer">
              <button 
                onClick={() => setIsDeleteModalOpen(false)}
                className="btn-secondary"
                disabled={submitting}
              >
                Cancelar
              </button>
              <button 
                onClick={handleDeleteConfirm}
                className="btn-danger"
                disabled={submitting}
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                {submitting ? (
                  <>
                    <FaSyncAlt className="spin" style={{ animation: 'spin 1s linear infinite' }} /> Eliminando...
                  </>
                ) : (
                  'Sí, Eliminar Ruta'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
