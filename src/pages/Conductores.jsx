import React, { useState, useEffect } from 'react';
import { 
  FaSearch, 
  FaUserTie, 
  FaEdit, 
  FaTrashAlt, 
  FaTimes, 
  FaExclamationTriangle,
  FaSyncAlt,
  FaUserPlus,
  FaPhone,
  FaRoute,
  FaUser
} from 'react-icons/fa';
import { conductorService, userService, routeService } from '../services/api';
import { toast } from 'react-toastify';

export default function Conductores() {
  const [conductores, setConductores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Rutas y Usuarios disponibles
  const [routes, setRoutes] = useState([]);
  const [availableDriverUsers, setAvailableDriverUsers] = useState([]);
  
  // Modales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' o 'edit'
  const [selectedConductor, setSelectedConductor] = useState(null);
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [conductorToDelete, setConductorToDelete] = useState(null);

  // Modal secundario de selección de usuario base
  const [isUserSelectModalOpen, setIsUserSelectModalOpen] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [usersLoading, setUsersLoading] = useState(false);

  // Formulario
  const [formValues, setFormValues] = useState({
    usuarioId: '',
    telefono: '',
    rutaAsignada: ''
  });
  
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Cargar perfiles de conductores con debounce para búsqueda
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchConductores();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  // Cargar catálogo de rutas en el inicio
  useEffect(() => {
    fetchRoutes();
  }, []);

  const fetchConductores = async () => {
    setLoading(true);
    try {
      const params = {};
      if (searchQuery.trim() !== '') {
        params.search = searchQuery;
      }
      const data = await conductorService.getConductors(params);
      const list = Array.isArray(data) ? data : [];
      setConductores(list);
    } catch (err) {
      console.error('Error fetching drivers profiles:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoutes = async () => {
    try {
      const data = await routeService.getRoutes();
      const list = Array.isArray(data) ? data : (data.rutas || data.data || []);
      setRoutes(list);
    } catch (err) {
      console.error('Error fetching routes:', err);
    }
  };

  // Cargar usuarios con rol 'conductor' para asociar
  const fetchAvailableUsers = async () => {
    setUsersLoading(true);
    try {
      const data = await userService.getUsers({ rol: 'conductor' });
      const list = Array.isArray(data) ? data : (data.users || data.data || []);
      
      // Filtrar usuarios que ya tienen un perfil operativo registrado (excepto si es edición)
      const existingUserIds = conductores.map(c => c.usuarioId?._id);
      const filtered = list.filter(u => !existingUserIds.includes(u._id));
      
      setAvailableDriverUsers(filtered);
    } catch (err) {
      console.error('Error fetching driver users:', err);
    } finally {
      setUsersLoading(false);
    }
  };

  // Abrir selección de usuario
  const handleOpenUserSelect = () => {
    fetchAvailableUsers();
    setUserSearchQuery('');
    setIsUserSelectModalOpen(true);
  };

  // Seleccionar usuario
  const handleSelectUser = (user) => {
    setFormValues(prev => ({
      ...prev,
      usuarioId: user._id
    }));
    
    if (formErrors.usuarioId) {
      setFormErrors(prev => ({ ...prev, usuarioId: '' }));
    }
    
    setIsUserSelectModalOpen(false);
  };

  // Abrir modal de creación
  const handleOpenCreateModal = () => {
    setModalMode('create');
    setFormValues({
      usuarioId: '',
      telefono: '',
      rutaAsignada: ''
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Abrir modal de edición
  const handleOpenEditModal = (conductor) => {
    setModalMode('edit');
    setSelectedConductor(conductor);
    setFormValues({
      usuarioId: conductor.usuarioId?._id || '',
      telefono: conductor.telefono || '',
      rutaAsignada: conductor.rutaAsignada?._id || ''
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Abrir modal de eliminación
  const handleOpenDeleteModal = (conductor) => {
    setConductorToDelete(conductor);
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

  // Validar formulario
  const validateForm = () => {
    const errors = {};
    
    if (!formValues.usuarioId) {
      errors.usuarioId = 'Debe seleccionar un usuario conductor base';
    }

    if (!formValues.telefono || formValues.telefono.trim() === '') {
      errors.telefono = 'El número de teléfono es obligatorio';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Guardar Conductor
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const payload = {
        usuarioId: formValues.usuarioId,
        telefono: formValues.telefono.trim(),
        rutaAsignada: formValues.rutaAsignada || null
      };

      if (modalMode === 'create') {
        await conductorService.createConductor(payload);
        toast.success(`Perfil operativo de conductor registrado con éxito.`);
      } else {
        await conductorService.updateConductor(selectedConductor._id, payload);
        toast.success(`Perfil operativo de conductor actualizado con éxito.`);
      }

      setIsModalOpen(false);
      fetchConductores();
    } catch (err) {
      console.error('Error al guardar perfil de conductor:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Alternar el estado activo del usuario conductor directamente
  const handleToggleUserStatus = async (conductor) => {
    if (!conductor.usuarioId) return;
    
    try {
      const updatedStatus = !conductor.usuarioId.activo;
      await userService.updateUser(conductor.usuarioId._id, { activo: updatedStatus });
      
      // Actualizar estado local inmediatamente
      setConductores(prev => prev.map(c => 
        c._id === conductor._id 
          ? { ...c, usuarioId: { ...c.usuarioId, activo: updatedStatus } } 
          : c
      ));
      
      toast.success(`Cuenta de "${conductor.usuarioId.nombre}" cambiada a ${updatedStatus ? 'Activa' : 'Inactiva'}.`);
    } catch (err) {
      console.error('Error al alternar estado de usuario conductor:', err);
    }
  };

  // Confirmar eliminación de perfil
  const handleDeleteConfirm = async () => {
    if (!conductorToDelete) return;

    setSubmitting(true);
    try {
      await conductorService.deleteConductor(conductorToDelete._id);
      toast.success('Perfil operativo de conductor eliminado.');
      setIsDeleteModalOpen(false);
      setConductorToDelete(null);
      fetchConductores();
    } catch (err) {
      console.error('Error al eliminar perfil de conductor:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'C';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  // Filtrado local para modal de búsqueda de usuarios
  const filteredUsers = availableDriverUsers.filter(u => 
    u.nombre?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
    u.correo?.toLowerCase().includes(userSearchQuery.toLowerCase())
  );

  return (
    <div className="animate-slide-up" style={{ padding: '0 0 20px 0' }}>
      {/* Subcabecera descriptiva */}
      <div style={{ marginBottom: '24px' }}>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '15px' }}>
          Administra los perfiles operativos de los conductores. Asocia cuentas de usuario base, gestiona su información de contacto telefónico y verifica su ruta escolar asignada.
        </p>
      </div>

      {/* Barra de Herramientas con Filtros y Botón de Crear */}
      <div className="users-toolbar">
        <div className="users-filters">
          <div className="search-input-wrapper">
            <FaSearch className="search-input-icon" />
            <input 
              type="text" 
              placeholder="Buscar conductor por nombre..." 
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
          <FaUserPlus /> Nuevo Conductor
        </button>
      </div>

      {/* Grid de conductores o estado vacío */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px' }}>
          <div className="spinner" style={{ marginBottom: '16px' }}></div>
          <span style={{ color: 'var(--color-text-secondary)', fontSize: '14px', fontWeight: '500' }}>
            Cargando perfiles de conductores...
          </span>
        </div>
      ) : conductores.length === 0 ? (
        <div className="glass-panel empty-state">
          <div className="empty-state-icon">👷‍♂️</div>
          <h3 className="empty-state-title">No se encontraron conductores</h3>
          <p style={{ fontSize: '14px', marginBottom: '16px' }}>
            {searchQuery 
              ? 'Prueba a cambiar el texto de búsqueda.'
              : 'Empieza registrando al primer perfil operativo de conductor usando el botón superior.'}
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
                  <th>Conductor</th>
                  <th>Correo Electrónico</th>
                  <th>Teléfono</th>
                  <th>Ruta Escolar</th>
                  <th style={{ textAlign: 'center' }}>Cuenta Activa</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {conductores.map((cond) => (
                  <tr key={cond._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div className="avatar-circle" style={{ background: 'rgba(124, 58, 237, 0.1)', color: 'var(--color-secondary)' }}>
                          {getInitials(cond.usuarioId?.nombre)}
                        </div>
                        <div style={{ fontWeight: '600', color: 'var(--color-text)' }}>
                          {cond.usuarioId?.nombre || 'Sin usuario asociado'}
                        </div>
                      </div>
                    </td>
                    <td>{cond.usuarioId?.correo || 'N/A'}</td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <FaPhone style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }} /> {cond.telefono}
                      </span>
                    </td>
                    <td>
                      {cond.rutaAsignada ? (
                        <span className="role-badge conductor" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <FaRoute style={{ fontSize: '10px' }} /> {cond.rutaAsignada.nombre}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--color-text-secondary)', fontSize: '13px', fontStyle: 'italic' }}>Sin asignar</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {cond.usuarioId ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                          <label className="toggle-switch">
                            <input 
                              type="checkbox" 
                              checked={cond.usuarioId.activo !== false}
                              onChange={() => handleToggleUserStatus(cond)}
                              aria-label={`Alternar estado de ${cond.usuarioId.nombre}`}
                            />
                            <span className="toggle-slider"></span>
                          </label>
                          <span className={`status-badge ${cond.usuarioId.activo !== false ? 'active' : 'inactive'}`} style={{ minWidth: '75px' }}>
                            {cond.usuarioId.activo !== false ? 'Activo' : 'Inactivo'}
                          </span>
                        </div>
                      ) : 'N/A'}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="actions-cell" style={{ justifyContent: 'flex-end' }}>
                        <button 
                          onClick={() => handleOpenEditModal(cond)}
                          className="action-btn edit"
                          title="Editar perfil de conductor"
                          aria-label={`Editar conductor ${cond.usuarioId?.nombre}`}
                        >
                          <FaEdit />
                        </button>
                        <button 
                          onClick={() => handleOpenDeleteModal(cond)}
                          className="action-btn delete"
                          title="Eliminar perfil de conductor"
                          aria-label={`Eliminar conductor ${cond.usuarioId?.nombre}`}
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
            {conductores.map((cond) => (
              <div className="glass-panel user-card" key={cond._id}>
                <div className="user-card-header">
                  <div className="user-card-avatar">
                    <div className="avatar-circle" style={{ background: 'rgba(124, 58, 237, 0.1)', color: 'var(--color-secondary)' }}>
                      {getInitials(cond.usuarioId?.nombre)}
                    </div>
                    <div>
                      <h4 className="user-card-name">{cond.usuarioId?.nombre || 'Sin usuario'}</h4>
                      <span className="user-card-email">{cond.usuarioId?.correo || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div className="user-card-details">
                  <span>Teléfono:</span>
                  <span>{cond.telefono}</span>
                </div>

                <div className="user-card-details">
                  <span>Ruta:</span>
                  <span>{cond.rutaAsignada?.nombre || 'Sin Ruta'}</span>
                </div>

                <div className="user-card-details">
                  <span>Cuenta Activa:</span>
                  {cond.usuarioId ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <label className="toggle-switch">
                        <input 
                          type="checkbox" 
                          checked={cond.usuarioId.activo !== false}
                          onChange={() => handleToggleUserStatus(cond)}
                          aria-label={`Alternar estado móvil de ${cond.usuarioId.nombre}`}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                      <span className={`status-badge ${cond.usuarioId.activo !== false ? 'active' : 'inactive'}`}>
                        {cond.usuarioId.activo !== false ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                  ) : 'N/A'}
                </div>

                <div className="user-card-actions">
                  <button 
                    onClick={() => handleOpenEditModal(cond)}
                    className="action-btn edit"
                    title="Editar perfil"
                    aria-label={`Editar móvil de ${cond.usuarioId?.nombre}`}
                  >
                    <FaEdit />
                  </button>
                  <button 
                    onClick={() => handleOpenDeleteModal(cond)}
                    className="action-btn delete"
                    title="Eliminar perfil"
                    aria-label={`Eliminar móvil de ${cond.usuarioId?.nombre}`}
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
                {modalMode === 'create' ? 'Registrar Perfil de Conductor' : 'Editar Perfil de Conductor'}
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
                {/* Campo Usuario Conductor */}
                <div className="input-group">
                  <label className="input-label">Usuario Conductor Base</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input 
                      type="text"
                      readOnly
                      value={
                        modalMode === 'edit'
                          ? (selectedConductor?.usuarioId?.nombre || '')
                          : (formValues.usuarioId 
                              ? (availableDriverUsers.find(u => u._id === formValues.usuarioId)?.nombre || 'Usuario seleccionado')
                              : '')
                      }
                      placeholder={modalMode === 'edit' ? "" : "Haga clic en '...' para seleccionar usuario..."}
                      onClick={modalMode === 'create' ? handleOpenUserSelect : undefined}
                      className={`input-field ${formErrors.usuarioId ? 'error' : ''}`}
                      style={{ flex: 1, background: 'rgba(0, 0, 0, 0.02)', cursor: modalMode === 'create' ? 'pointer' : 'default' }}
                      required
                    />
                    {modalMode === 'create' && (
                      <button
                        type="button"
                        onClick={handleOpenUserSelect}
                        className="btn-secondary"
                        style={{ padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 'bold' }}
                        title="Buscar usuario conductor"
                      >
                        ...
                      </button>
                    )}
                  </div>
                  {formErrors.usuarioId && (
                    <span className="field-error-text">{formErrors.usuarioId}</span>
                  )}
                  {modalMode === 'create' && (
                    <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '4px', display: 'block' }}>
                      Nota: Si no encuentra al conductor, primero regístrelo en el módulo de <strong>Usuarios</strong> con el rol "conductor".
                    </span>
                  )}
                </div>

                {/* Campo Teléfono */}
                <div className="input-group">
                  <label className="input-label" htmlFor="driver-phone">Número de Teléfono</label>
                  <input 
                    type="text" 
                    id="driver-phone"
                    name="telefono"
                    value={formValues.telefono}
                    onChange={handleInputChange}
                    className={`input-field ${formErrors.telefono ? 'error' : ''}`}
                    placeholder="Ej. +56 9 8765 4321"
                    required
                  />
                  {formErrors.telefono && (
                    <span className="field-error-text">{formErrors.telefono}</span>
                  )}
                </div>

                {/* Campo Ruta Escolar */}
                <div className="input-group">
                  <label className="input-label" htmlFor="driver-ruta">Ruta Escolar Asignada (Opcional)</label>
                  <select 
                    id="driver-ruta"
                    name="rutaAsignada"
                    value={formValues.rutaAsignada}
                    onChange={handleInputChange}
                    className="input-field"
                  >
                    <option value="">-- Ninguna / Sin Asignar --</option>
                    {routes.map(r => (
                      <option key={r._id} value={r._id}>{r.nombre}</option>
                    ))}
                  </select>
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
                    modalMode === 'create' ? 'Registrar Conductor' : 'Guardar Cambios'
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
                <FaExclamationTriangle /> ¿Eliminar Conductor?
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
                ¿Estás seguro de que deseas eliminar permanentemente el perfil operativo del conductor <strong>{conductorToDelete?.usuarioId?.nombre}</strong>?
              </p>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px' }}>
                Esta acción no eliminará su cuenta de usuario base de RouteNova, únicamente removerá su perfil operativo de la flota.
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
                  'Sí, Eliminar Perfil'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL SECUNDARIO DE SELECCIÓN DE USUARIO */}
      {isUserSelectModalOpen && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="glass-panel modal-dialog" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FaUser /> Seleccionar Usuario Conductor
              </h3>
              <button 
                onClick={() => { setIsUserSelectModalOpen(false); setUserSearchQuery(''); }} 
                className="modal-close-btn"
                aria-label="Cerrar modal de selección"
              >
                <FaTimes />
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', height: '350px' }}>
              {/* Barra de búsqueda interna */}
              <div className="search-input-wrapper" style={{ marginBottom: '16px' }}>
                <FaSearch className="search-input-icon" />
                <input 
                  type="text" 
                  placeholder="Buscar usuario por nombre o correo..." 
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  className="input-field search-input-field"
                  style={{ width: '100%' }}
                />
              </div>

              {/* Contenedor con scroll de la lista */}
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {usersLoading ? (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '24px' }}>
                    <div className="spinner"></div>
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                    {availableDriverUsers.length === 0 
                      ? 'No hay usuarios con rol "conductor" disponibles que no tengan un perfil creado.'
                      : 'No se encontraron usuarios coincidentes.'}
                  </div>
                ) : (
                  filteredUsers.map(user => (
                    <div 
                      key={user._id} 
                      onDoubleClick={() => handleSelectUser(user)}
                      className="glass-panel" 
                      style={{ 
                        padding: '12px 16px', 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <div>
                        <h4 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--color-text)', margin: 0 }}>{user.nombre}</h4>
                        <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>{user.correo}</span>
                      </div>
                      <button 
                        type="button"
                        onClick={() => handleSelectUser(user)}
                        className="btn-secondary"
                        style={{ padding: '4px 10px', fontSize: '11px' }}
                      >
                        Seleccionar
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button 
                type="button" 
                onClick={() => { setIsUserSelectModalOpen(false); setUserSearchQuery(''); }}
                className="btn-secondary"
                style={{ fontSize: '13px', padding: '8px 16px' }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
