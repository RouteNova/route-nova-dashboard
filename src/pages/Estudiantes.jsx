import React, { useState, useEffect } from 'react';
import { 
  FaSearch, 
  FaUserPlus, 
  FaEdit, 
  FaTrashAlt, 
  FaTimes, 
  FaQrcode, 
  FaRoute, 
  FaUser, 
  FaExclamationTriangle,
  FaSyncAlt,
  FaDownload
} from 'react-icons/fa';
import api, { studentService, routeService, userService } from '../services/api';
import { toast } from 'react-toastify';

export default function Estudiantes() {
  // Listas de datos y estados de carga
  const [students, setStudents] = useState([]);
  const [parents, setParents] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtros de búsqueda
  const [searchQuery, setSearchQuery] = useState('');
  const [routeFilter, setRouteFilter] = useState('');

  // Modales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' o 'edit'
  const [selectedStudent, setSelectedStudent] = useState(null);
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);

  // Modal de visualización de Código QR
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [qrLoading, setQrLoading] = useState(false);

  // Formularios
  const [formValues, setFormValues] = useState({
    nombre: '',
    codigoQR: '',
    padreId: '',
    rutaId: ''
  });
  
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Cargar catálogos (Padres y Rutas) al montar
  useEffect(() => {
    fetchParents();
    fetchRoutes();
  }, []);

  // Cargar estudiantes cuando cambian los filtros (con debounce en búsqueda)
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchStudents();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, routeFilter]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const params = {};
      if (searchQuery.trim() !== '') {
        params.search = searchQuery;
      }
      if (routeFilter !== '') {
        params.rutaId = routeFilter;
      }
      
      const data = await studentService.getStudents(params);
      const list = Array.isArray(data) ? data : (data.students || data.data || []);
      setStudents(list);
    } catch (err) {
      console.error('Error fetching students:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchParents = async () => {
    try {
      const data = await userService.getUsers({ rol: 'padre' });
      const list = Array.isArray(data) ? data : (data.users || data.data || []);
      setParents(list);
    } catch (err) {
      console.error('Error fetching parents:', err);
    }
  };

  const fetchRoutes = async () => {
    try {
      const data = await routeService.getRoutes();
      const list = Array.isArray(data) ? data : (data.routes || data.data || []);
      setRoutes(list);
    } catch (err) {
      console.error('Error fetching routes:', err);
    }
  };

  // Obtener iniciales para avatar
  const getInitials = (name) => {
    if (!name) return 'E';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  // Cargar e inicializar imagen QR de forma segura
  const handleOpenQRModal = async (student) => {
    setQrLoading(true);
    setSelectedStudent(student);
    setIsQRModalOpen(true);
    try {
      // Solicitar el archivo de imagen como Blob para pasar la cabecera Authorization
      const response = await api.get(`/students/${student._id}/qr`, { responseType: 'blob' });
      // Crear una URL local del Blob para la etiqueta img
      const imageUrl = URL.createObjectURL(response);
      setQrCodeUrl(imageUrl);
    } catch (err) {
      console.error('Error al cargar código QR:', err);
      // El Axios interceptor mostrará el toast de error si falla, cerramos modal en fallback
      setIsQRModalOpen(false);
    } finally {
      setQrLoading(false);
    }
  };

  // Cerrar visualizador de código QR y limpiar la URL local
  const handleCloseQRModal = () => {
    setIsQRModalOpen(false);
    setSelectedStudent(null);
    if (qrCodeUrl) {
      URL.revokeObjectURL(qrCodeUrl);
      setQrCodeUrl('');
    }
  };

  // Descargar código QR a la computadora local
  const handleDownloadQR = () => {
    if (!qrCodeUrl || !selectedStudent) return;
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `QR-Estudiante-${selectedStudent.nombre.replace(/\s+/g, '_')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Código QR de ${selectedStudent.nombre} descargado.`);
  };

  // Abrir modal de creación
  const handleOpenCreateModal = () => {
    setModalMode('create');
    setFormValues({
      nombre: '',
      codigoQR: '',
      padreId: parents.length > 0 ? parents[0]._id : '',
      rutaId: routes.length > 0 ? routes[0]._id : ''
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Abrir modal de edición
  const handleOpenEditModal = (student) => {
    setModalMode('edit');
    setSelectedStudent(student);
    setFormValues({
      nombre: student.nombre || '',
      codigoQR: student.codigoQR || '',
      padreId: student.padreId?._id || student.padreId || '',
      rutaId: student.rutaId?._id || student.rutaId || ''
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Abrir modal de eliminación
  const handleOpenDeleteModal = (student) => {
    setStudentToDelete(student);
    setIsDeleteModalOpen(true);
  };

  // Manejar cambios en campos de formulario
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormValues(prev => ({
      ...prev,
      [name]: value
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

    if (!formValues.nombre || formValues.nombre.trim() === '') {
      errors.nombre = 'El nombre del estudiante es obligatorio';
    }

    if (!formValues.padreId) {
      errors.padreId = 'Debe seleccionar un padre / tutor asignado';
    }

    if (!formValues.rutaId) {
      errors.rutaId = 'Debe seleccionar una ruta escolar';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Guardar estudiante (Crear o Editar)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const payload = { ...formValues };
      
      // Si el código QR está en blanco, eliminamos el campo para dejar que el backend autogenere el UUID
      if (!payload.codigoQR || payload.codigoQR.trim() === '') {
        delete payload.codigoQR;
      }

      if (modalMode === 'create') {
        const response = await studentService.createStudent(payload);
        toast.success(`Estudiante "${response.nombre}" registrado con éxito.`);
      } else {
        const response = await studentService.updateStudent(selectedStudent._id, payload);
        toast.success(`Datos de "${response.nombre}" actualizados con éxito.`);
      }

      setIsModalOpen(false);
      fetchStudents();
    } catch (err) {
      console.error('Error al guardar estudiante:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Confirmar eliminación de estudiante
  const handleDeleteConfirm = async () => {
    if (!studentToDelete) return;

    setSubmitting(true);
    try {
      await studentService.deleteStudent(studentToDelete._id);
      toast.success('Estudiante eliminado exitosamente.');
      setIsDeleteModalOpen(false);
      setStudentToDelete(null);
      fetchStudents();
    } catch (err) {
      console.error('Error al eliminar estudiante:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="animate-slide-up" style={{ padding: '0 0 20px 0' }}>
      {/* Subcabecera descriptiva */}
      <div style={{ marginBottom: '24px' }}>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '15px' }}>
          Administra las asignaciones de estudiantes, asocia cada alumno a su padre/tutor familiar, define sus rutas escolares y genera sus códigos QR.
        </p>
      </div>

      {/* Barra de Herramientas con Filtros y Botón de Crear */}
      <div className="users-toolbar">
        <div className="users-filters">
          <div className="search-input-wrapper">
            <FaSearch className="search-input-icon" />
            <input 
              type="text" 
              placeholder="Buscar por nombre..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field search-input-field"
            />
          </div>

          <select 
            value={routeFilter}
            onChange={(e) => setRouteFilter(e.target.value)}
            className="input-field filter-select-field"
            aria-label="Filtrar por ruta escolar"
          >
            <option value="">Todas las rutas</option>
            {routes.map(route => (
              <option key={route._id} value={route._id}>{route.nombre}</option>
            ))}
          </select>
        </div>

        <button 
          onClick={handleOpenCreateModal}
          className="btn-primary btn-add-user"
        >
          <FaUserPlus /> Nuevo Estudiante
        </button>
      </div>

      {/* Grid de estudiantes o estado vacío */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px' }}>
          <div className="spinner" style={{ marginBottom: '16px' }}></div>
          <span style={{ color: 'var(--color-text-secondary)', fontSize: '14px', fontWeight: '500' }}>
            Cargando lista de estudiantes...
          </span>
        </div>
      ) : students.length === 0 ? (
        <div className="glass-panel empty-state">
          <div className="empty-state-icon">🎓</div>
          <h3 className="empty-state-title">No se encontraron estudiantes</h3>
          <p style={{ fontSize: '14px', marginBottom: '16px' }}>
            {searchQuery || routeFilter 
              ? 'Prueba a cambiar los filtros de búsqueda o la ruta seleccionada.'
              : 'Empieza registrando al primer alumno de la plataforma usando el botón superior.'}
          </p>
          {(searchQuery || routeFilter) && (
            <button 
              onClick={() => { setSearchQuery(''); setRouteFilter(''); }}
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
                  <th>Estudiante</th>
                  <th>Tutor / Padre</th>
                  <th>Ruta Escolar</th>
                  <th style={{ textAlign: 'center' }}>Código QR</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div className="avatar-circle">
                          {getInitials(student.nombre)}
                        </div>
                        <div style={{ fontWeight: '600', color: 'var(--color-text)' }}>
                          {student.nombre}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div>
                        <div style={{ fontWeight: '500' }}>{student.padreId?.nombre || 'No asignado'}</div>
                        <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>{student.padreId?.correo}</div>
                      </div>
                    </td>
                    <td>
                      <span className="role-badge conductor" style={{ background: 'rgba(37, 99, 235, 0.08)', color: 'var(--color-primary)', border: '1px solid rgba(37, 99, 235, 0.15)' }}>
                        <FaRoute style={{ marginRight: '6px' }} /> {student.rutaId?.nombre || 'No asignada'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button 
                        onClick={() => handleOpenQRModal(student)}
                        className="btn-secondary"
                        style={{ padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', borderRadius: '100px' }}
                        title="Ver código QR del estudiante"
                      >
                        <FaQrcode /> Ver QR
                      </button>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="actions-cell" style={{ justifyContent: 'flex-end' }}>
                        <button 
                          onClick={() => handleOpenEditModal(student)}
                          className="action-btn edit"
                          title="Editar datos"
                          aria-label={`Editar estudiante ${student.nombre}`}
                        >
                          <FaEdit />
                        </button>
                        <button 
                          onClick={() => handleOpenDeleteModal(student)}
                          className="action-btn delete"
                          title="Eliminar estudiante"
                          aria-label={`Eliminar estudiante ${student.nombre}`}
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
            {students.map((student) => (
              <div className="glass-panel user-card" key={student._id}>
                <div className="user-card-header">
                  <div className="user-card-avatar">
                    <div className="avatar-circle">
                      {getInitials(student.nombre)}
                    </div>
                    <div>
                      <h4 className="user-card-name">{student.nombre}</h4>
                    </div>
                  </div>
                </div>

                <div className="user-card-details">
                  <span>Tutor/Padre:</span>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: '600' }}>{student.padreId?.nombre || 'No asignado'}</div>
                    <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>{student.padreId?.correo}</div>
                  </div>
                </div>

                <div className="user-card-details">
                  <span>Ruta Escolar:</span>
                  <span className="role-badge conductor" style={{ background: 'rgba(37, 99, 235, 0.08)', color: 'var(--color-primary)', border: '1px solid rgba(37, 99, 235, 0.15)' }}>
                    <FaRoute style={{ marginRight: '6px' }} /> {student.rutaId?.nombre || 'No asignada'}
                  </span>
                </div>

                <div className="user-card-details">
                  <span>Código QR:</span>
                  <button 
                    onClick={() => handleOpenQRModal(student)}
                    className="btn-secondary"
                    style={{ padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', borderRadius: '100px' }}
                  >
                    <FaQrcode /> Mostrar QR
                  </button>
                </div>

                <div className="user-card-actions">
                  <button 
                    onClick={() => handleOpenEditModal(student)}
                    className="action-btn edit"
                    title="Editar datos"
                    aria-label={`Editar móvil de ${student.nombre}`}
                  >
                    <FaEdit />
                  </button>
                  <button 
                    onClick={() => handleOpenDeleteModal(student)}
                    className="action-btn delete"
                    title="Eliminar estudiante"
                    aria-label={`Eliminar móvil de ${student.nombre}`}
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
                {modalMode === 'create' ? 'Registrar Nuevo Estudiante' : 'Editar Datos de Estudiante'}
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
                  <label className="input-label" htmlFor="student-nombre">Nombre Completo del Alumno</label>
                  <input 
                    type="text" 
                    id="student-nombre"
                    name="nombre"
                    value={formValues.nombre}
                    onChange={handleInputChange}
                    className={`input-field ${formErrors.nombre ? 'error' : ''}`}
                    placeholder="Ej. Sofía Gómez"
                    required
                  />
                  {formErrors.nombre && (
                    <span className="field-error-text">{formErrors.nombre}</span>
                  )}
                </div>

                {/* Campo Padre/Tutor */}
                <div className="input-group">
                  <label className="input-label" htmlFor="student-padre">Tutor Familiar (Padre)</label>
                  <select 
                    id="student-padre"
                    name="padreId"
                    value={formValues.padreId}
                    onChange={handleInputChange}
                    className={`input-field ${formErrors.padreId ? 'error' : ''}`}
                    required
                  >
                    {parents.length === 0 ? (
                      <option value="">No hay padres registrados en el sistema</option>
                    ) : (
                      parents.map(parent => (
                        <option key={parent._id} value={parent._id}>
                          {parent.nombre} ({parent.correo})
                        </option>
                      ))
                    )}
                  </select>
                  {formErrors.padreId && (
                    <span className="field-error-text">{formErrors.padreId}</span>
                  )}
                </div>

                {/* Campo Ruta */}
                <div className="input-group">
                  <label className="input-label" htmlFor="student-ruta">Ruta Escolar Asignada</label>
                  <select 
                    id="student-ruta"
                    name="rutaId"
                    value={formValues.rutaId}
                    onChange={handleInputChange}
                    className={`input-field ${formErrors.rutaId ? 'error' : ''}`}
                    required
                  >
                    {routes.length === 0 ? (
                      <option value="">No hay rutas creadas en el sistema</option>
                    ) : (
                      routes.map(route => (
                        <option key={route._id} value={route._id}>
                          {route.nombre}
                        </option>
                      ))
                    )}
                  </select>
                  {formErrors.rutaId && (
                    <span className="field-error-text">{formErrors.rutaId}</span>
                  )}
                </div>

                {/* Campo Código QR manual (Opcional) */}
                <div className="input-group">
                  <label className="input-label" htmlFor="student-qr">Código QR o Credencial (Opcional)</label>
                  <input 
                    type="text" 
                    id="student-qr"
                    name="codigoQR"
                    value={formValues.codigoQR}
                    onChange={handleInputChange}
                    className={`input-field`}
                    placeholder="Dejar en blanco para auto-generar UUID seguro"
                  />
                  <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginTop: '4px', display: 'block' }}>
                    Si no ingresas un valor, el sistema le asignará automáticamente una clave de autenticación única de RouteNova.
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
                    modalMode === 'create' ? 'Registrar Alumno' : 'Guardar Cambios'
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
                <FaExclamationTriangle /> ¿Eliminar Alumno?
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
                ¿Estás seguro de que deseas eliminar al alumno <strong>{studentToDelete?.nombre}</strong> del sistema?
              </p>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px' }}>
                Esta acción es irreversible y eliminará su código QR activo. El estudiante ya no podrá abordar el transporte.
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
                  'Sí, Eliminar Alumno'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE VISUALIZACIÓN DE CÓDIGO QR */}
      {isQRModalOpen && (
        <div className="modal-overlay">
          <div className="glass-panel modal-dialog" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FaQrcode /> Credencial QR
              </h3>
              <button 
                onClick={handleCloseQRModal} 
                className="modal-close-btn"
                aria-label="Cerrar modal de código QR"
              >
                <FaTimes />
              </button>
            </div>

            <div className="modal-body" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
              <h4 style={{ fontFamily: 'var(--font-heading)', fontWeight: '700', fontSize: '18px', color: 'var(--color-text)', marginBottom: '4px' }}>
                {selectedStudent?.nombre}
              </h4>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px', marginBottom: '20px' }}>
                Asignado a: {selectedStudent?.rutaId?.nombre || 'Sin Ruta'}
              </p>

              {/* Contenedor de la Imagen QR */}
              <div style={{ 
                width: '240px', 
                height: '240px', 
                background: 'white', 
                borderRadius: 'var(--radius-lg)', 
                border: '1px solid var(--color-border)',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                boxShadow: 'var(--shadow-sm)',
                padding: '16px',
                position: 'relative',
                marginBottom: '16px'
              }}>
                {qrLoading ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                    <div className="spinner"></div>
                    <span style={{ color: '#64748B', fontSize: '12px' }}>Generando QR...</span>
                  </div>
                ) : (
                  <img 
                    src={qrCodeUrl} 
                    alt={`Código QR de ${selectedStudent?.nombre}`} 
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                )}
              </div>

              <div style={{ background: 'rgba(0, 0, 0, 0.03)', padding: '8px 16px', borderRadius: '8px', marginBottom: '24px', maxWidth: '100%' }}>
                <code style={{ fontSize: '11px', color: 'var(--color-text)', wordBreak: 'break-all', display: 'block' }}>
                  {selectedStudent?.codigoQR}
                </code>
              </div>
            </div>

            <div className="modal-footer" style={{ justifyContent: 'center', paddingTop: 0 }}>
              <button 
                onClick={handleDownloadQR}
                className="btn-primary"
                style={{ width: '80%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', borderRadius: '100px' }}
                disabled={qrLoading || !qrCodeUrl}
              >
                <FaDownload /> Descargar Código QR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
