import React, { useState, useEffect } from 'react';
import { 
  FaSearch, 
  FaUserPlus, 
  FaEdit, 
  FaTrashAlt, 
  FaTimes, 
  FaUserShield, 
  FaUserTie, 
  FaUsers, 
  FaUser,
  FaExclamationTriangle,
  FaSyncAlt,
  FaCheck
} from 'react-icons/fa';
import { userService, padreService, conductorService } from '../services/api';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import ModalPortal from '../components/common/ModalPortal';

export default function Usuarios() {
  const { user: currentUser } = useAuth();
  // Listas y estados de carga
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtros de búsqueda
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  // Modales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' o 'edit'
  const [selectedUser, setSelectedUser] = useState(null);
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  // Modal secundario de selección de entidad (Padre / Conductor)
  const [isEntitySelectModalOpen, setIsEntitySelectModalOpen] = useState(false);
  const [entityType, setEntityType] = useState('padre'); // 'padre' o 'conductor'
  const [availableEntities, setAvailableEntities] = useState([]);
  const [entitiesLoading, setEntitiesLoading] = useState(false);
  const [entitySearchQuery, setEntitySearchQuery] = useState('');
  const [selectedEntity, setSelectedEntity] = useState(null);

  // Formularios
  const [formValues, setFormValues] = useState({
    nombre: '',
    correo: '',
    password: '',
    rol: 'padre',
    activo: true
  });
  
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Cargar usuarios al iniciar o cuando cambian los filtros (con debounce en búsqueda)
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchUsers();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, roleFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = {};
      if (searchQuery.trim() !== '') {
        params.search = searchQuery;
      }
      if (roleFilter !== '') {
        params.rol = roleFilter;
      }
      
      const data = await userService.getUsers(params);
      const list = Array.isArray(data) ? data : (data.users || data.data || []);
      setUsers(list);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  // Obtener iniciales para avatar
  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  // Badge de rol
  const getRoleBadge = (role) => {
    switch (role) {
      case 'administrador':
        return (
          <span className="role-badge admin">
            <FaUserShield style={{ marginRight: '6px' }} /> Administrador
          </span>
        );
      case 'conductor':
        return (
          <span className="role-badge conductor">
            <FaUserTie style={{ marginRight: '6px' }} /> Conductor
          </span>
        );
      case 'padre':
        return (
          <span className="role-badge padre">
            <FaUsers style={{ marginRight: '6px' }} /> Padre
          </span>
        );
      default:
        return (
          <span className="role-badge">
            <FaUser style={{ marginRight: '6px' }} /> {role}
          </span>
        );
    }
  };

  // Cargar lista de entidades disponibles sin usuario
  const fetchAvailableEntities = async (type) => {
    setEntitiesLoading(true);
    setEntitySearchQuery('');
    try {
      if (type === 'padre') {
        const res = await padreService.getPadres();
        const list = Array.isArray(res) ? res : (res.padres || res.data || []);
        
        // Filtrar padres cuyos correos/IDs no estén en la lista actual de usuarios 'users'
        const existingEmails = users.map(u => u.correo?.toLowerCase());
        const existingIds = users.map(u => u._id);
        
        const filtered = list.filter(p => {
          const emailMatch = p.correo && existingEmails.includes(p.correo.toLowerCase());
          const idMatch = existingIds.includes(p._id);
          return !emailMatch && !idMatch;
        });

        setAvailableEntities(filtered);
      } else if (type === 'conductor') {
        const res = await conductorService.getConductors();
        const list = Array.isArray(res) ? res : (res.conductores || res.data || []);

        const existingUserIds = users.map(u => u._id);
        const existingEmails = users.map(u => u.correo?.toLowerCase()).filter(Boolean);

        const filtered = list.filter(c => {
          if (c.usuarioId) {
            const uId = typeof c.usuarioId === 'object' ? c.usuarioId._id : c.usuarioId;
            if (existingUserIds.includes(uId)) return false;
          }
          const email = (c.correo || c.usuarioId?.correo || '').toLowerCase();
          if (email && existingEmails.includes(email)) return false;
          return true;
        });

        setAvailableEntities(filtered);
      }
    } catch (err) {
      console.error(`Error al cargar lista de ${type}s:`, err);
      toast.error(`Error al cargar la lista de ${type === 'padre' ? 'padres' : 'conductores'}.`);
    } finally {
      setEntitiesLoading(false);
    }
  };

  const handleOpenEntityModal = (type) => {
    setEntityType(type);
    setIsEntitySelectModalOpen(true);
    fetchAvailableEntities(type);
  };

  const handleSelectEntity = (entity) => {
    setSelectedEntity(entity);
    setIsEntitySelectModalOpen(false);

    let entityName = '';
    let entityEmail = '';

    if (entityType === 'padre') {
      entityName = entity.nombre || '';
      entityEmail = entity.correo || '';
    } else if (entityType === 'conductor') {
      entityName = entity.nombre || (entity.usuarioId?.nombre) || '';
      entityEmail = entity.correo || (entity.usuarioId?.correo) || '';
    }

    setFormValues(prev => ({
      ...prev,
      nombre: entityName,
      correo: entityEmail
    }));

    if (entityName) {
      toast.info(`Datos cargados para "${entityName}".`);
    }
  };

  const handleRoleSelectChange = (e) => {
    const newRole = e.target.value;
    setFormValues(prev => ({
      ...prev,
      rol: newRole,
      nombre: '',
      correo: ''
    }));
    setSelectedEntity(null);
  };

  // Abrir modal de creación
  const handleOpenCreateModal = () => {
    setModalMode('create');
    setSelectedEntity(null);
    setFormValues({
      nombre: '',
      correo: '',
      password: '',
      rol: 'padre',
      activo: true
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Abrir modal de edición
  const handleOpenEditModal = (user) => {
    setModalMode('edit');
    setSelectedUser(user);
    setFormValues({
      nombre: user.nombre || '',
      correo: user.correo || '',
      password: '', // Contraseña en blanco (opcional en edición)
      rol: user.rol || 'padre',
      activo: user.activo !== undefined ? user.activo : true
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Abrir modal de eliminación
  const handleOpenDeleteModal = (user) => {
    if (currentUser && currentUser._id === user._id) {
      toast.warning('No puedes eliminar tu propia cuenta de administrador.');
      return;
    }
    setUserToDelete(user);
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
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;

    if (!formValues.nombre || formValues.nombre.trim() === '') {
      errors.nombre = 'El nombre es obligatorio';
    }

    if (!formValues.correo || formValues.correo.trim() === '') {
      errors.correo = 'El correo electrónico es obligatorio';
    } else if (!emailRegex.test(formValues.correo)) {
      errors.correo = 'Ingrese una dirección de correo electrónico válida';
    }

    if (modalMode === 'create') {
      if (!formValues.password) {
        errors.password = 'La contraseña es obligatoria';
      } else if (formValues.password.length < 6) {
        errors.password = 'La contraseña debe tener al menos 6 caracteres';
      }
    } else {
      // En modo edición la contraseña es opcional, pero si se escribe debe ser de mínimo 6 caracteres
      if (formValues.password && formValues.password.length < 6) {
        errors.password = 'La contraseña debe tener al menos 6 caracteres';
      }
    }

    const validRoles = ['administrador', 'padre', 'conductor'];
    if (!formValues.rol || !validRoles.includes(formValues.rol)) {
      errors.rol = 'El rol seleccionado no es válido';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Guardar usuario (Crear o Editar)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (modalMode === 'edit' && selectedUser && currentUser && currentUser._id === selectedUser._id) {
      if (formValues.activo === false) {
        toast.warning('No puedes desactivar tu propia cuenta.');
        return;
      }
      if (formValues.rol !== 'administrador') {
        toast.warning('No puedes cambiar tu propio rol de administrador.');
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload = { ...formValues };
      
      // Si estamos en edición y la contraseña está vacía, no la enviamos para no sobreescribirla
      if (modalMode === 'edit' && !payload.password) {
        delete payload.password;
      }

      if (modalMode === 'create') {
        if (selectedEntity && formValues.rol === 'conductor') {
          payload.conductorId = selectedEntity._id;
          payload.entityId = selectedEntity._id;
        }
        const response = await userService.createUser(payload);
        toast.success(`Usuario "${response.nombre}" creado con éxito.`);
      } else {
        const response = await userService.updateUser(selectedUser._id, payload);
        toast.success(`Usuario "${response.nombre}" actualizado con éxito.`);
      }

      setIsModalOpen(false);
      fetchUsers();
    } catch (err) {
      console.error('Error al guardar usuario:', err);
      // El error de servidor ya lo muestra el Axios Interceptor con un Toast, así que solo capturamos
    } finally {
      setSubmitting(false);
    }
  };

  // Alternar el estado activo/inactivo directamente desde la lista (experiencia premium)
  const handleToggleStatus = async (user) => {
    if (currentUser && currentUser._id === user._id) {
      toast.warning('No puedes desactivar tu propia cuenta de administrador.');
      return;
    }
    try {
      const updatedStatus = !user.activo;
      const response = await userService.updateUser(user._id, { activo: updatedStatus });
      
      // Actualizar estado local inmediatamente
      setUsers(prev => prev.map(u => u._id === user._id ? { ...u, activo: response.activo } : u));
      
      toast.success(`Estado de "${user.nombre}" cambiado a ${response.activo ? 'Activo' : 'Inactivo'}.`);
    } catch (err) {
      console.error('Error al alternar estado:', err);
    }
  };

  // Confirmar eliminación de usuario
  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;

    setSubmitting(true);
    try {
      await userService.deleteUser(userToDelete._id);
      toast.success('Usuario eliminado exitosamente.');
      setIsDeleteModalOpen(false);
      setUserToDelete(null);
      fetchUsers();
    } catch (err) {
      console.error('Error al eliminar usuario:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="animate-slide-up" style={{ padding: '0 0 20px 0' }}>
      {/* Subcabecera descriptiva */}
      <div style={{ marginBottom: '24px' }}>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '15px' }}>
          Administra los accesos de la plataforma RouteNova, asigna roles de administración, conducción o familias, y controla su estado activo.
        </p>
      </div>

      {/* Barra de Herramientas con Filtros y Botón de Crear */}
      <div className="users-toolbar">
        <div className="users-filters">
          <div className="search-input-wrapper">
            <FaSearch className="search-input-icon" />
            <input 
              type="text" 
              placeholder="Buscar por nombre o correo..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field search-input-field"
            />
          </div>

          <select 
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="input-field filter-select-field"
            aria-label="Filtrar por rol de usuario"
          >
            <option value="">Todos los roles</option>
            <option value="administrador">Administradores</option>
            <option value="conductor">Conductores</option>
            <option value="padre">Padres / Tutores</option>
          </select>
        </div>

        <button 
          onClick={handleOpenCreateModal}
          className="btn-primary btn-add-user"
        >
          <FaUserPlus /> Nuevo Usuario
        </button>
      </div>

      {/* Grid de usuarios o estado vacío */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px' }}>
          <div className="spinner" style={{ marginBottom: '16px' }}></div>
          <span style={{ color: 'var(--color-text-secondary)', fontSize: '14px', fontWeight: '500' }}>
            Cargando lista de usuarios...
          </span>
        </div>
      ) : users.length === 0 ? (
        <div className="glass-panel empty-state">
          <div className="empty-state-icon">🔍</div>
          <h3 className="empty-state-title">No se encontraron usuarios</h3>
          <p style={{ fontSize: '14px', marginBottom: '16px' }}>
            {searchQuery || roleFilter 
              ? 'Prueba a cambiar los filtros de búsqueda o el rol seleccionado.'
              : 'Empieza registrando el primer usuario de la plataforma usando el botón superior.'}
          </p>
          {(searchQuery || roleFilter) && (
            <button 
              onClick={() => { setSearchQuery(''); setRoleFilter(''); }}
              className="btn-secondary"
              style={{ fontSize: '13px', padding: '8px 16px' }}
            >
              Restablecer filtros
            </button>
          )}
        </div>
      ) : (
        <>
          {/* TABLA DE ESCRITORIO (Visible en resoluciones > 768px por CSS) */}
          <div className="glass-panel users-table-container animate-fade-in">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Correo Electrónico</th>
                  <th>Rol</th>
                  <th style={{ textAlign: 'center' }}>Estado</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div className="avatar-circle">
                          {getInitials(user.nombre)}
                        </div>
                        <div style={{ fontWeight: '600', color: 'var(--color-text)' }}>
                          {user.nombre}
                        </div>
                      </div>
                    </td>
                    <td>{user.correo}</td>
                    <td>{getRoleBadge(user.rol)}</td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                        <label className="toggle-switch" style={currentUser && currentUser._id === user._id ? { opacity: 0.5, cursor: 'not-allowed' } : {}}>
                          <input 
                            type="checkbox" 
                            checked={user.activo !== false}
                            onChange={() => handleToggleStatus(user)}
                            disabled={currentUser && currentUser._id === user._id}
                            aria-label={`Alternar estado de ${user.nombre}`}
                          />
                          <span className="toggle-slider"></span>
                        </label>
                        <span className={`status-badge ${user.activo !== false ? 'active' : 'inactive'}`} style={{ minWidth: '75px' }}>
                          {user.activo !== false ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="actions-cell" style={{ justifyContent: 'flex-end' }}>
                        <button 
                          onClick={() => handleOpenEditModal(user)}
                          className="action-btn edit"
                          title="Editar usuario"
                          aria-label={`Editar usuario ${user.nombre}`}
                        >
                          <FaEdit />
                        </button>
                        <button 
                          onClick={() => handleOpenDeleteModal(user)}
                          className="action-btn delete"
                          disabled={currentUser && currentUser._id === user._id}
                          style={currentUser && currentUser._id === user._id ? { opacity: 0.4, cursor: 'not-allowed' } : {}}
                          title={currentUser && currentUser._id === user._id ? "No puedes eliminar tu propia cuenta" : "Eliminar usuario"}
                          aria-label={`Eliminar usuario ${user.nombre}`}
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

          {/* TARJETAS DE MÓVIL/TABLET (Visible en resoluciones <= 768px por CSS) */}
          <div className="users-cards-grid animate-fade-in">
            {users.map((user) => (
              <div className="glass-panel user-card" key={user._id}>
                <div className="user-card-header">
                  <div className="user-card-avatar">
                    <div className="avatar-circle">
                      {getInitials(user.nombre)}
                    </div>
                    <div>
                      <h4 className="user-card-name">{user.nombre}</h4>
                      <span className="user-card-email">{user.correo}</span>
                    </div>
                  </div>
                </div>

                <div className="user-card-details">
                  <span>Rol:</span>
                  {getRoleBadge(user.rol)}
                </div>

                <div className="user-card-details">
                  <span>Estado:</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <label className="toggle-switch" style={currentUser && currentUser._id === user._id ? { opacity: 0.5, cursor: 'not-allowed' } : {}}>
                      <input 
                        type="checkbox" 
                        checked={user.activo !== false}
                        onChange={() => handleToggleStatus(user)}
                        disabled={currentUser && currentUser._id === user._id}
                        aria-label={`Alternar estado móvil de ${user.nombre}`}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                    <span className={`status-badge ${user.activo !== false ? 'active' : 'inactive'}`}>
                      {user.activo !== false ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                </div>

                <div className="user-card-actions">
                  <button 
                    onClick={() => handleOpenEditModal(user)}
                    className="action-btn edit"
                    title="Editar usuario"
                    aria-label={`Editar móvil de ${user.nombre}`}
                  >
                    <FaEdit />
                  </button>
                  <button 
                    onClick={() => handleOpenDeleteModal(user)}
                    className="action-btn delete"
                    disabled={currentUser && currentUser._id === user._id}
                    style={currentUser && currentUser._id === user._id ? { opacity: 0.4, cursor: 'not-allowed' } : {}}
                    title={currentUser && currentUser._id === user._id ? "No puedes eliminar tu propia cuenta" : "Eliminar usuario"}
                    aria-label={`Eliminar móvil de ${user.nombre}`}
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
        <ModalPortal>
          <div className="modal-overlay">
            <div className="glass-panel modal-dialog">
              <div className="modal-header">
                <h3 className="modal-title">
                  {modalMode === 'create' ? 'Registrar Nuevo Usuario' : 'Editar Datos de Usuario'}
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
                  {/* 1. PRIMER PASO: Campo Rol asignado */}
                  <div className="input-group">
                    <label className="input-label" htmlFor="form-rol" style={{ fontWeight: '700' }}>1. Seleccionar Rol del Usuario</label>
                    <select 
                      id="form-rol"
                      name="rol"
                      value={formValues.rol}
                      onChange={modalMode === 'create' ? handleRoleSelectChange : handleInputChange}
                      className={`input-field ${formErrors.rol ? 'error' : ''}`}
                      disabled={modalMode === 'edit' && selectedUser && currentUser && currentUser._id === selectedUser._id}
                      style={modalMode === 'edit' && selectedUser && currentUser && currentUser._id === selectedUser._id ? { opacity: 0.6, cursor: 'not-allowed' } : {}}
                      required
                    >
                      <option value="padre">Padre / Tutor / Familia</option>
                      <option value="conductor">Conductor de Autobús</option>
                      <option value="administrador">Administrador de Sistema</option>
                    </select>
                    {formErrors.rol && (
                      <span className="field-error-text">{formErrors.rol}</span>
                    )}
                    {modalMode === 'edit' && selectedUser && currentUser && currentUser._id === selectedUser._id && (
                      <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '4px', display: 'block' }}>
                        * No puedes cambiar tu propio rol de administrador.
                      </span>
                    )}
                  </div>

                  {/* 2. SI ES CREACIÓN Y EL ROL ES PADRE O CONDUCTOR: BOTÓN DE SELECCIÓN DESDE LISTADO */}
                  {modalMode === 'create' && (formValues.rol === 'padre' || formValues.rol === 'conductor') && (
                    <div style={{
                      background: 'rgba(37, 99, 235, 0.06)',
                      border: '1px dashed var(--color-primary)',
                      borderRadius: 'var(--radius-md)',
                      padding: '16px',
                      marginBottom: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px'
                    }}>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-text)' }}>
                        2. Seleccionar {formValues.rol === 'padre' ? 'Padre / Tutor' : 'Conductor'} sin cuenta de usuario:
                      </div>

                      {selectedEntity ? (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          background: 'var(--color-surface)',
                          border: '1px solid var(--color-border)',
                          padding: '10px 14px',
                          borderRadius: 'var(--radius-sm)'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              background: 'var(--color-primary)',
                              color: '#fff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 'bold',
                              fontSize: '14px'
                            }}>
                              {formValues.rol === 'padre' ? <FaUsers /> : <FaUserTie />}
                            </div>
                            <div>
                              <div style={{ fontSize: '13.5px', fontWeight: '700', color: 'var(--color-text)' }}>
                                {selectedEntity.nombre || selectedEntity.usuarioId?.nombre || 'Entidad seleccionada'}
                              </div>
                              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                                {selectedEntity.correo || selectedEntity.usuarioId?.correo || 'Sin correo asociado'}
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleOpenEntityModal(formValues.rol)}
                            className="btn-secondary"
                            style={{ padding: '6px 12px', fontSize: '12.5px' }}
                          >
                            Cambiar
                          </button>
                        </div>
                      ) : (
                        <button 
                          type="button"
                          onClick={() => handleOpenEntityModal(formValues.rol)}
                          className="btn-secondary"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            padding: '12px',
                            fontWeight: '600',
                            fontSize: '13.5px',
                            width: '100%'
                          }}
                        >
                          <FaSearch />
                          <span>Seleccionar {formValues.rol === 'padre' ? 'Padre' : 'Conductor'} de la lista...</span>
                        </button>
                      )}
                    </div>
                  )}

                  {/* Campo Nombre */}
                  <div className="input-group">
                    <label className="input-label" htmlFor="form-nombre">Nombre Completo</label>
                    <input 
                      type="text" 
                      id="form-nombre"
                      name="nombre"
                      value={formValues.nombre}
                      onChange={handleInputChange}
                      disabled={modalMode === 'create' && (formValues.rol === 'padre' || formValues.rol === 'conductor')}
                      readOnly={modalMode === 'create' && (formValues.rol === 'padre' || formValues.rol === 'conductor')}
                      className={`input-field ${formErrors.nombre ? 'error' : ''}`}
                      placeholder={
                        modalMode === 'create' && (formValues.rol === 'padre' || formValues.rol === 'conductor')
                          ? `Seleccione un ${formValues.rol === 'padre' ? 'padre' : 'conductor'} de la lista arriba...`
                          : "Ej. Juan Pérez"
                      }
                      style={
                        modalMode === 'create' && (formValues.rol === 'padre' || formValues.rol === 'conductor')
                          ? { opacity: 0.8, cursor: 'not-allowed', background: 'rgba(255, 255, 255, 0.02)' }
                          : {}
                      }
                      required
                    />
                    {formErrors.nombre && (
                      <span className="field-error-text">{formErrors.nombre}</span>
                    )}
                  </div>

                  {/* Campo Correo */}
                  <div className="input-group">
                    <label className="input-label" htmlFor="form-correo">Correo Electrónico</label>
                    <input 
                      type="email" 
                      id="form-correo"
                      name="correo"
                      value={formValues.correo}
                      onChange={handleInputChange}
                      disabled={modalMode === 'create' && (formValues.rol === 'padre' || formValues.rol === 'conductor')}
                      readOnly={modalMode === 'create' && (formValues.rol === 'padre' || formValues.rol === 'conductor')}
                      className={`input-field ${formErrors.correo ? 'error' : ''}`}
                      placeholder={
                        modalMode === 'create' && (formValues.rol === 'padre' || formValues.rol === 'conductor')
                          ? `Seleccione un ${formValues.rol === 'padre' ? 'padre' : 'conductor'} de la lista arriba...`
                          : "ejemplo@routenova.com"
                      }
                      style={
                        modalMode === 'create' && (formValues.rol === 'padre' || formValues.rol === 'conductor')
                          ? { opacity: 0.8, cursor: 'not-allowed', background: 'rgba(255, 255, 255, 0.02)' }
                          : {}
                      }
                      required
                    />
                    {formErrors.correo && (
                      <span className="field-error-text">{formErrors.correo}</span>
                    )}
                    {modalMode === 'create' && (formValues.rol === 'padre' || formValues.rol === 'conductor') && (
                      <span style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', marginTop: '4px', display: 'block' }}>
                        * Estos datos se autocompletan al seleccionar el {formValues.rol === 'padre' ? 'padre' : 'conductor'} del listado.
                      </span>
                    )}
                  </div>

                  {/* Campo Contraseña */}
                  <div className="input-group">
                    <label className="input-label" htmlFor="form-password">
                      Contraseña {modalMode === 'edit' && '(Opcional)'}
                    </label>
                    <input 
                      type="password" 
                      id="form-password"
                      name="password"
                      value={formValues.password}
                      onChange={handleInputChange}
                      className={`input-field ${formErrors.password ? 'error' : ''}`}
                      placeholder={
                        modalMode === 'create' 
                          ? "Mínimo 6 caracteres" 
                          : "Dejar en blanco para no modificar"
                      }
                      required={modalMode === 'create'}
                    />
                    {formErrors.password && (
                      <span className="field-error-text">{formErrors.password}</span>
                    )}
                  </div>

                  {/* Estado Activo en Formulario */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px' }}>
                    <label className="toggle-switch" style={modalMode === 'edit' && selectedUser && currentUser && currentUser._id === selectedUser._id ? { opacity: 0.5, cursor: 'not-allowed' } : {}}>
                      <input 
                        type="checkbox" 
                        name="activo"
                        checked={formValues.activo}
                        onChange={handleInputChange}
                        disabled={modalMode === 'edit' && selectedUser && currentUser && currentUser._id === selectedUser._id}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                    <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--color-text)' }}>
                      Usuario Activo {modalMode === 'edit' && selectedUser && currentUser && currentUser._id === selectedUser._id ? ' (No puedes desactivar tu propia cuenta)' : ' (Permite el inicio de sesión)'}
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
                      modalMode === 'create' ? 'Crear Usuario' : 'Guardar Cambios'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN */}
      {isDeleteModalOpen && (
        <ModalPortal>
          <div className="modal-overlay">
            <div className="glass-panel modal-dialog danger">
              <div className="modal-header">
                <h3 className="modal-title" style={{ color: 'var(--color-danger)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FaExclamationTriangle /> ¿Eliminar Usuario?
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
                  ¿Estás seguro de que deseas eliminar permanentemente al usuario <strong>{userToDelete?.nombre}</strong> ({userToDelete?.correo})?
                </p>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px' }}>
                  Esta acción no se puede deshacer. El usuario perderá inmediatamente el acceso al sistema y toda su sesión será revocada.
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
                    'Sí, Eliminar Usuario'
                  )}
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* MODAL SECUNDARIO DE SELECCIÓN DE ENTIDAD (PADRE / CONDUCTOR SIN USUARIO) */}
      {isEntitySelectModalOpen && (
        <ModalPortal>
          <div className="modal-overlay animate-fade-in" style={{ zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div className="glass-panel modal-dialog" style={{ maxWidth: '600px', width: '100%', maxHeight: '85vh', display: 'flex', flexDirection: 'column', padding: '24px' }}>
              <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--color-border)', paddingBottom: '12px' }}>
                <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '18px', fontWeight: '700', margin: 0 }}>
                  {entityType === 'padre' ? <FaUsers style={{ color: 'var(--color-primary)' }} /> : <FaUserTie style={{ color: 'var(--color-primary)' }} />}
                  <span>Seleccionar {entityType === 'padre' ? 'Padre / Tutor' : 'Conductor'} Sin Usuario</span>
                </h3>
                <button 
                  onClick={() => setIsEntitySelectModalOpen(false)} 
                  className="modal-close-btn"
                  aria-label="Cerrar modal de selección"
                  style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', fontSize: '18px' }}
                >
                  <FaTimes />
                </button>
              </div>

              {/* Buscador interno */}
              <div style={{ position: 'relative', marginBottom: '16px' }}>
                <FaSearch style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)', fontSize: '13px' }} />
                <input
                  type="text"
                  className="input-field"
                  placeholder={`Buscar ${entityType === 'padre' ? 'padre' : 'conductor'} por nombre o correo...`}
                  value={entitySearchQuery}
                  onChange={(e) => setEntitySearchQuery(e.target.value)}
                  style={{ paddingLeft: '38px', fontSize: '13.5px' }}
                />
              </div>

              <div className="modal-body" style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
                {entitiesLoading ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px' }}>
                    <FaSyncAlt className="spin" style={{ fontSize: '24px', color: 'var(--color-primary)', animation: 'spin 1s linear infinite', marginBottom: '12px' }} />
                    <span style={{ fontSize: '13.5px', color: 'var(--color-text-secondary)' }}>
                      Cargando listado de {entityType === 'padre' ? 'padres' : 'conductores'}...
                    </span>
                  </div>
                ) : availableEntities.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '36px 20px', color: 'var(--color-text-secondary)', background: 'rgba(255,255,255,0.01)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--color-border)' }}>
                    <FaExclamationTriangle style={{ fontSize: '28px', color: 'var(--color-warning)', marginBottom: '10px' }} />
                    <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-text)', marginBottom: '4px' }}>
                      No hay {entityType === 'padre' ? 'padres' : 'conductores'} disponibles
                    </div>
                    <div style={{ fontSize: '12.5px' }}>
                      Todos los {entityType === 'padre' ? 'padres' : 'conductores'} registrados ya poseen una cuenta de usuario activa.
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {availableEntities
                      .filter(item => {
                        const search = entitySearchQuery.toLowerCase();
                        const name = (item.nombre || item.usuarioId?.nombre || '').toLowerCase();
                        const email = (item.correo || item.usuarioId?.correo || '').toLowerCase();
                        return name.includes(search) || email.includes(search);
                      })
                      .map((item, idx) => {
                        const name = item.nombre || item.usuarioId?.nombre || 'Sin nombre';
                        const email = item.correo || item.usuarioId?.correo || 'Sin correo';
                        return (
                          <div 
                            key={item._id || idx}
                            onClick={() => handleSelectEntity(item)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '12px 16px',
                              borderRadius: 'var(--radius-md)',
                              background: 'rgba(255, 255, 255, 0.02)',
                              border: '1px solid var(--color-border)',
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                            className="entity-select-item"
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: '50%',
                                background: 'rgba(37, 99, 235, 0.15)',
                                color: 'var(--color-primary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '15px',
                                fontWeight: 'bold'
                              }}>
                                {entityType === 'padre' ? <FaUsers /> : <FaUserTie />}
                              </div>
                              <div>
                                <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>{name}</div>
                                <div style={{ fontSize: '12.5px', color: 'var(--color-text-secondary)' }}>{email}</div>
                              </div>
                            </div>
                            <button
                              type="button"
                              className="btn-primary"
                              style={{ padding: '6px 14px', fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '6px' }}
                            >
                              <FaCheck /> Seleccionar
                            </button>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
}
