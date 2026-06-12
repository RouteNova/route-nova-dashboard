import React, { useState, useEffect } from 'react';
import { 
  FaSearch, 
  FaBus, 
  FaEdit, 
  FaTrashAlt, 
  FaTimes, 
  FaExclamationTriangle,
  FaSyncAlt,
  FaPlus
} from 'react-icons/fa';
import { autobusService } from '../services/api';
import { toast } from 'react-toastify';

export default function Autobuses() {
  const [autobuses, setAutobuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' o 'edit'
  const [selectedAutobus, setSelectedAutobus] = useState(null);
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [autobusToDelete, setAutobusToDelete] = useState(null);

  // Formulario
  const [formValues, setFormValues] = useState({
    patente: '',
    modelo: '',
    capacidad: '',
    activo: true
  });
  
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Cargar autobuses con debounce para búsqueda
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchAutobuses();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const fetchAutobuses = async () => {
    setLoading(true);
    try {
      const params = {};
      if (searchQuery.trim() !== '') {
        params.search = searchQuery;
      }
      
      const data = await autobusService.getAutobuses(params);
      const list = Array.isArray(data) ? data : [];
      setAutobuses(list);
    } catch (err) {
      console.error('Error fetching buses:', err);
    } finally {
      setLoading(false);
    }
  };

  // Abrir modal de creación
  const handleOpenCreateModal = () => {
    setModalMode('create');
    setFormValues({
      patente: '',
      modelo: '',
      capacidad: '',
      activo: true
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Abrir modal de edición
  const handleOpenEditModal = (bus) => {
    setModalMode('edit');
    setSelectedAutobus(bus);
    setFormValues({
      patente: bus.patente || '',
      modelo: bus.modelo || '',
      capacidad: bus.capacidad || '',
      activo: bus.activo !== undefined ? bus.activo : true
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Abrir modal de eliminación
  const handleOpenDeleteModal = (bus) => {
    setAutobusToDelete(bus);
    setIsDeleteModalOpen(true);
  };

  // Manejar cambios en campos de formulario
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormValues(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Limpiar error del campo
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Validar formulario
  const validateForm = () => {
    const errors = {};
    const patenteRegex = /^[A-Z0-9-]{3,10}$/i; // Patente flexible (letras, números y guiones)

    if (!formValues.patente || formValues.patente.trim() === '') {
      errors.patente = 'La patente es obligatoria';
    } else if (!patenteRegex.test(formValues.patente.trim())) {
      errors.patente = 'Formato de patente no válido (Mínimo 3 caracteres, letras/números/guiones)';
    }

    if (!formValues.modelo || formValues.modelo.trim() === '') {
      errors.modelo = 'El modelo del vehículo es obligatorio';
    }

    const capNum = Number(formValues.capacidad);
    if (!formValues.capacidad || formValues.capacidad === '') {
      errors.capacidad = 'La capacidad de pasajeros es obligatoria';
    } else if (isNaN(capNum) || capNum <= 0 || !Number.isInteger(capNum)) {
      errors.capacidad = 'Ingrese un número entero positivo de pasajeros';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Guardar Autobús (Crear o Editar)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const payload = {
        ...formValues,
        patente: formValues.patente.trim().toUpperCase(),
        capacidad: parseInt(formValues.capacidad, 10)
      };

      if (modalMode === 'create') {
        const response = await autobusService.createAutobus(payload);
        toast.success(`Autobús con patente "${response.patente}" registrado con éxito.`);
      } else {
        const response = await autobusService.updateAutobus(selectedAutobus._id, payload);
        toast.success(`Autobús "${response.patente}" actualizado con éxito.`);
      }

      setIsModalOpen(false);
      fetchAutobuses();
    } catch (err) {
      console.error('Error al guardar autobús:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Alternar el estado activo/inactivo directamente desde la lista (experiencia premium)
  const handleToggleStatus = async (bus) => {
    try {
      const updatedStatus = !bus.activo;
      const response = await autobusService.updateAutobus(bus._id, { activo: updatedStatus });
      
      // Actualizar estado local inmediatamente
      setAutobuses(prev => prev.map(b => b._id === bus._id ? { ...b, activo: response.activo } : b));
      toast.success(`Estado de autobús "${bus.patente}" cambiado a ${response.activo ? 'Activo' : 'Inactivo'}.`);
    } catch (err) {
      console.error('Error al alternar estado:', err);
    }
  };

  // Confirmar eliminación de autobús
  const handleDeleteConfirm = async () => {
    if (!autobusToDelete) return;

    setSubmitting(true);
    try {
      await autobusService.deleteAutobus(autobusToDelete._id);
      toast.success('Autobús eliminado exitosamente.');
      setIsDeleteModalOpen(false);
      setAutobusToDelete(null);
      fetchAutobuses();
    } catch (err) {
      console.error('Error al eliminar autobús:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="animate-slide-up" style={{ padding: '0 0 20px 0' }}>
      {/* Subcabecera descriptiva */}
      <div style={{ marginBottom: '24px' }}>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '15px' }}>
          Administra la flota de vehículos escolares autorizados en la plataforma. Controla su capacidad máxima de alumnos y su estado activo de circulación.
        </p>
      </div>

      {/* Barra de Herramientas con Filtros y Botón de Crear */}
      <div className="users-toolbar">
        <div className="users-filters">
          <div className="search-input-wrapper">
            <FaSearch className="search-input-icon" />
            <input 
              type="text" 
              placeholder="Buscar por patente o modelo..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field search-input-field"
            />
          </div>
        </div>

        <button 
          onClick={handleOpenCreateModal}
          className="btn-primary btn-add-user"
        >
          <FaPlus /> Nuevo Autobús
        </button>
      </div>

      {/* Tabla de autobuses o estado vacío */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px' }}>
          <div className="spinner" style={{ marginBottom: '16px' }}></div>
          <span style={{ color: 'var(--color-text-secondary)', fontSize: '14px', fontWeight: '500' }}>
            Cargando lista de autobuses...
          </span>
        </div>
      ) : autobuses.length === 0 ? (
        <div className="glass-panel empty-state">
          <div className="empty-state-icon">🚌</div>
          <h3 className="empty-state-title">No se encontraron autobuses</h3>
          <p style={{ fontSize: '14px', marginBottom: '16px' }}>
            {searchQuery 
              ? 'Prueba a cambiar el texto de búsqueda.'
              : 'Empieza registrando al primer autobús escolar usando el botón superior.'}
          </p>
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="btn-secondary"
              style={{ fontSize: '13px', padding: '8px 16px' }}
            >
              Restablecer filtro
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
                  <th>Vehículo (Patente)</th>
                  <th>Modelo / Descripción</th>
                  <th style={{ textAlign: 'center' }}>Capacidad</th>
                  <th style={{ textAlign: 'center' }}>Estado</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {autobuses.map((bus) => (
                  <tr key={bus._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div className="avatar-circle" style={{ background: 'rgba(37, 99, 235, 0.1)', color: 'var(--color-primary)' }}>
                          <FaBus />
                        </div>
                        <div style={{ fontWeight: '700', color: 'var(--color-text)', letterSpacing: '0.5px' }}>
                          {bus.patente}
                        </div>
                      </div>
                    </td>
                    <td>{bus.modelo}</td>
                    <td style={{ textAlign: 'center', fontWeight: '600' }}>{bus.capacidad} Asientos</td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                        <label className="toggle-switch">
                          <input 
                            type="checkbox" 
                            checked={bus.activo !== false}
                            onChange={() => handleToggleStatus(bus)}
                            aria-label={`Alternar estado de ${bus.patente}`}
                          />
                          <span className="toggle-slider"></span>
                        </label>
                        <span className={`status-badge ${bus.activo !== false ? 'active' : 'inactive'}`} style={{ minWidth: '75px' }}>
                          {bus.activo !== false ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="actions-cell" style={{ justifyContent: 'flex-end' }}>
                        <button 
                          onClick={() => handleOpenEditModal(bus)}
                          className="action-btn edit"
                          title="Editar autobús"
                          aria-label={`Editar autobús ${bus.patente}`}
                        >
                          <FaEdit />
                        </button>
                        <button 
                          onClick={() => handleOpenDeleteModal(bus)}
                          className="action-btn delete"
                          title="Eliminar autobús"
                          aria-label={`Eliminar autobús ${bus.patente}`}
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
            {autobuses.map((bus) => (
              <div className="glass-panel user-card" key={bus._id}>
                <div className="user-card-header">
                  <div className="user-card-avatar">
                    <div className="avatar-circle" style={{ background: 'rgba(37, 99, 235, 0.1)', color: 'var(--color-primary)' }}>
                      <FaBus />
                    </div>
                    <div>
                      <h4 className="user-card-name" style={{ letterSpacing: '0.5px' }}>{bus.patente}</h4>
                      <span className="user-card-email">{bus.modelo}</span>
                    </div>
                  </div>
                </div>

                <div className="user-card-details">
                  <span>Capacidad:</span>
                  <span style={{ fontWeight: '600' }}>{bus.capacidad} Alumnos</span>
                </div>

                <div className="user-card-details">
                  <span>Estado:</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <label className="toggle-switch">
                      <input 
                        type="checkbox" 
                        checked={bus.activo !== false}
                        onChange={() => handleToggleStatus(bus)}
                        aria-label={`Alternar estado móvil de ${bus.patente}`}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                    <span className={`status-badge ${bus.activo !== false ? 'active' : 'inactive'}`}>
                      {bus.activo !== false ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                </div>

                <div className="user-card-actions">
                  <button 
                    onClick={() => handleOpenEditModal(bus)}
                    className="action-btn edit"
                    title="Editar autobús"
                    aria-label={`Editar móvil de ${bus.patente}`}
                  >
                    <FaEdit />
                  </button>
                  <button 
                    onClick={() => handleOpenDeleteModal(bus)}
                    className="action-btn delete"
                    title="Eliminar autobús"
                    aria-label={`Eliminar móvil de ${bus.patente}`}
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
          <div className="glass-panel modal-dialog" style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h3 className="modal-title">
                {modalMode === 'create' ? 'Registrar Nuevo Autobús' : 'Editar Datos de Autobús'}
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
              <div className="modal-body">
                {/* Campo Patente */}
                <div className="input-group">
                  <label className="input-label" htmlFor="bus-patente">Patente / Placa</label>
                  <input 
                    type="text" 
                    id="bus-patente"
                    name="patente"
                    value={formValues.patente}
                    onChange={handleInputChange}
                    className={`input-field ${formErrors.patente ? 'error' : ''}`}
                    placeholder="Ej. AB-123-CD"
                    style={{ textTransform: 'uppercase' }}
                    required
                  />
                  {formErrors.patente && (
                    <span className="field-error-text">{formErrors.patente}</span>
                  )}
                </div>

                {/* Campo Modelo */}
                <div className="input-group">
                  <label className="input-label" htmlFor="bus-modelo">Modelo / Descripción</label>
                  <input 
                    type="text" 
                    id="bus-modelo"
                    name="modelo"
                    value={formValues.modelo}
                    onChange={handleInputChange}
                    className={`input-field ${formErrors.modelo ? 'error' : ''}`}
                    placeholder="Ej. Mercedes-Benz Sprinter 2024"
                    required
                  />
                  {formErrors.modelo && (
                    <span className="field-error-text">{formErrors.modelo}</span>
                  )}
                </div>

                {/* Campo Capacidad */}
                <div className="input-group">
                  <label className="input-label" htmlFor="bus-capacidad">Capacidad de Pasajeros</label>
                  <input 
                    type="number" 
                    id="bus-capacidad"
                    name="capacidad"
                    value={formValues.capacidad}
                    onChange={handleInputChange}
                    className={`input-field ${formErrors.capacidad ? 'error' : ''}`}
                    placeholder="Ej. 18"
                    min="1"
                    required
                  />
                  {formErrors.capacidad && (
                    <span className="field-error-text">{formErrors.capacidad}</span>
                  )}
                </div>

                {/* Estado Activo en Formulario */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px' }}>
                  <label className="toggle-switch">
                    <input 
                      type="checkbox" 
                      name="activo"
                      checked={formValues.activo}
                      onChange={handleInputChange}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                  <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--color-text)' }}>
                    Autobús Activo (Disponible para asignar a rutas)
                  </span>
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
                    modalMode === 'create' ? 'Registrar Autobús' : 'Guardar Cambios'
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
                <FaExclamationTriangle /> ¿Eliminar Autobús?
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
                ¿Estás seguro de que deseas eliminar permanentemente el autobús con patente <strong>{autobusToDelete?.patente}</strong> ({autobusToDelete?.modelo})?
              </p>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px' }}>
                Esta acción no se puede deshacer.
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
                  'Sí, Eliminar Autobús'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
