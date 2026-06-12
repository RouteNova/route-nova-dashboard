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
  FaSyncAlt 
} from 'react-icons/fa';
import { userService } from '../services/api';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

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

  // Abrir modal de creación
  const handleOpenCreateModal = () => {
    setModalMode('create');
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
                {/* Campo Nombre */}
                <div className="input-group">
                  <label className="input-label" htmlFor="form-nombre">Nombre Completo</label>
                  <input 
                    type="text" 
                    id="form-nombre"
                    name="nombre"
                    value={formValues.nombre}
                    onChange={handleInputChange}
                    className={`input-field ${formErrors.nombre ? 'error' : ''}`}
                    placeholder="Ej. Juan Pérez"
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
                    className={`input-field ${formErrors.correo ? 'error' : ''}`}
                    placeholder="ejemplo@routenova.com"
                    required
                  />
                  {formErrors.correo && (
                    <span className="field-error-text">{formErrors.correo}</span>
                  )}
                </div>

                {/* Campo Rol */}
                <div className="input-group">
                  <label className="input-label" htmlFor="form-rol">Rol asignado</label>
                  <select 
                    id="form-rol"
                    name="rol"
                    value={formValues.rol}
                    onChange={handleInputChange}
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
      )}

      {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN */}
      {isDeleteModalOpen && (
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
      )}
    </div>
  );
}
