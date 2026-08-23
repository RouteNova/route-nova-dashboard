import React, { useState, useEffect } from 'react';
import { 
  FaSearch, 
  FaUserPlus, 
  FaEdit, 
  FaTrashAlt, 
  FaTimes, 
  FaExclamationTriangle,
  FaSyncAlt,
  FaGraduationCap,
  FaUser,
  FaEnvelope,
  FaEye,
  FaUsers,
  FaPhone,
  FaPlus
} from 'react-icons/fa';
import { padreService, studentService } from '../services/api';
import { toast } from 'react-toastify';
import ModalPortal from '../components/common/ModalPortal';

export default function Padres() {
  // Listas de datos y estados de carga
  const [padres, setPadres] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtro de búsqueda
  const [searchQuery, setSearchQuery] = useState('');

  // Modales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' o 'edit'
  const [selectedPadre, setSelectedPadre] = useState(null);
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [padreToDelete, setPadreToDelete] = useState(null);

  // Modal de visualización y gestión de hijos/estudiantes asociados
  const [isStudentsModalOpen, setIsStudentsModalOpen] = useState(false);
  const [associatedStudents, setAssociatedStudents] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [linking, setLinking] = useState(false);

  // Modal secundario de selección de estudiante sin tutor
  const [isStudentSelectModalOpen, setIsStudentSelectModalOpen] = useState(false);
  const [studentSearchQuery, setStudentSearchQuery] = useState('');

  // Formularios
  const [formValues, setFormValues] = useState({
    nombre: '',
    correo: '',
    telefono: '',
    activo: true
  });
  
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Cargar padres cuando cambia el filtro (con debounce)
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchPadres();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const fetchPadres = async () => {
    setLoading(true);
    try {
      const params = {};
      if (searchQuery.trim() !== '') {
        params.search = searchQuery;
      }
      
      const data = await padreService.getPadres(params);
      const list = Array.isArray(data) ? data : (data.padres || data.data || []);
      setPadres(list);
    } catch (err) {
      console.error('Error fetching parents:', err);
    } finally {
      setLoading(false);
    }
  };

  // Obtener iniciales para avatar
  const getInitials = (name) => {
    if (!name) return 'P';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  // Abrir modal de gestión de alumnos asociados
  const handleOpenStudentsModal = async (padre) => {
    setSelectedPadre(padre);
    setStudentsLoading(true);
    setIsStudentsModalOpen(true);
    try {
      const [assocData, allData] = await Promise.all([
        padreService.getPadreEstudiantes(padre._id),
        studentService.getStudents()
      ]);
      const list = Array.isArray(assocData.students) ? assocData.students : [];
      const allList = Array.isArray(allData) ? allData : (allData.students || allData.data || []);
      setAssociatedStudents(list);
      setAllStudents(allList);
    } catch (err) {
      console.error('Error fetching associated students:', err);
    } finally {
      setStudentsLoading(false);
    }
  };

  const refreshAssociatedStudents = async (padreId) => {
    try {
      const [assocData, allData] = await Promise.all([
        padreService.getPadreEstudiantes(padreId),
        studentService.getStudents()
      ]);
      const list = Array.isArray(assocData.students) ? assocData.students : [];
      const allList = Array.isArray(allData) ? allData : (allData.students || allData.data || []);
      setAssociatedStudents(list);
      setAllStudents(allList);
    } catch (err) {
      console.error('Error refreshing associated students:', err);
    }
  };

  const handleAssignStudent = async (student) => {
    if (!selectedPadre || !student) return;
    setLinking(true);
    try {
      await studentService.updateStudent(student._id, { padreId: selectedPadre._id });
      toast.success(`Estudiante "${student.nombre}" asignado a ${selectedPadre.nombre} con éxito.`);
      setIsStudentSelectModalOpen(false);
      setStudentSearchQuery('');
      await refreshAssociatedStudents(selectedPadre._id);
    } catch (err) {
      console.error('Error al asignar estudiante:', err);
    } finally {
      setLinking(false);
    }
  };

  const handleUnlinkStudent = async (studentId, studentName) => {
    if (!selectedPadre) return;
    setLinking(true);
    try {
      await studentService.updateStudent(studentId, { padreId: null });
      toast.success(`Alumno "${studentName}" desvinculado con éxito.`);
      await refreshAssociatedStudents(selectedPadre._id);
    } catch (err) {
      console.error('Error al desvincular alumno:', err);
    } finally {
      setLinking(false);
    }
  };

  // Abrir modal de creación
  const handleOpenCreateModal = () => {
    setModalMode('create');
    setFormValues({
      nombre: '',
      correo: '',
      telefono: '',
      activo: true
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Abrir modal de edición
  const handleOpenEditModal = (padre) => {
    setModalMode('edit');
    setSelectedPadre(padre);
    setFormValues({
      nombre: padre.nombre || '',
      correo: padre.correo || '',
      telefono: padre.telefono || '',
      activo: padre.activo !== undefined ? padre.activo : true
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // Abrir modal de eliminación
  const handleOpenDeleteModal = (padre) => {
    setPadreToDelete(padre);
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

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Guardar padre (Crear o Editar)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const payload = {
        nombre: formValues.nombre.trim(),
        correo: formValues.correo.trim(),
        telefono: formValues.telefono.trim(),
        activo: formValues.activo
      };

      if (modalMode === 'create') {
        const response = await padreService.createPadre(payload);
        toast.success(`Tutor familiar "${response.nombre}" registrado con éxito.`);
      } else {
        const response = await padreService.updatePadre(selectedPadre._id, payload);
        toast.success(`Tutor familiar "${response.nombre}" actualizado con éxito.`);
      }

      setIsModalOpen(false);
      fetchPadres();
    } catch (err) {
      console.error('Error al guardar tutor:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Alternar el estado activo/inactivo directamente desde la lista (experiencia premium)
  const handleToggleStatus = async (padre) => {
    try {
      const updatedStatus = !padre.activo;
      const response = await padreService.updatePadre(padre._id, { activo: updatedStatus });
      
      // Actualizar estado local inmediatamente
      setPadres(prev => prev.map(p => p._id === padre._id ? { ...p, activo: response.activo } : p));
      
      toast.success(`Estado de "${padre.nombre}" cambiado a ${response.activo ? 'Activo' : 'Inactivo'}.`);
    } catch (err) {
      console.error('Error al alternar estado:', err);
    }
  };

  // Confirmar eliminación de padre
  const handleDeleteConfirm = async () => {
    if (!padreToDelete) return;

    setSubmitting(true);
    try {
      await padreService.deletePadre(padreToDelete._id);
      toast.success('Tutor familiar eliminado exitosamente.');
      setIsDeleteModalOpen(false);
      setPadreToDelete(null);
      fetchPadres();
    } catch (err) {
      console.error('Error al eliminar tutor:', err);
      // El error de servidor (ej. tiene estudiantes asociados) ya lo muestra el Axios Interceptor
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="animate-slide-up" style={{ padding: '0 0 20px 0' }}>
      {/* Subcabecera descriptiva */}
      <div style={{ marginBottom: '24px' }}>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '15px' }}>
          Administra las cuentas de los padres, madres y tutores legales de los alumnos. Controla su estado de acceso y visualiza sus hijos asignados.
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
        </div>

        <button 
          onClick={handleOpenCreateModal}
          className="btn-primary btn-add-user"
        >
          <FaUserPlus /> Nuevo Padre / Tutor
        </button>
      </div>

      {/* Grid de padres o estado vacío */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px' }}>
          <div className="spinner" style={{ marginBottom: '16px' }}></div>
          <span style={{ color: 'var(--color-text-secondary)', fontSize: '14px', fontWeight: '500' }}>
            Cargando lista de tutores familiares...
          </span>
        </div>
      ) : padres.length === 0 ? (
        <div className="glass-panel empty-state">
          <div className="empty-state-icon">👥</div>
          <h3 className="empty-state-title">No se encontraron padres de familia</h3>
          <p style={{ fontSize: '14px', marginBottom: '16px' }}>
            {searchQuery 
              ? 'Prueba a cambiar el texto de búsqueda.'
              : 'Empieza registrando al primer tutor familiar de la plataforma usando el botón superior.'}
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
          {/* TABLA DE ESCRITORIO (Visible en resoluciones > 768px por CSS) */}
          <div className="glass-panel users-table-container animate-fade-in">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Tutor Familiar</th>
                  <th>Correo Electrónico</th>
                  <th>Teléfono</th>
                  <th style={{ textAlign: 'center' }}>Alumnos Asociados</th>
                  <th style={{ textAlign: 'center' }}>Estado</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {padres.map((padre) => (
                  <tr key={padre._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div className="avatar-circle">
                          {getInitials(padre.nombre)}
                        </div>
                        <div style={{ fontWeight: '600', color: 'var(--color-text)' }}>
                          {padre.nombre}
                        </div>
                      </div>
                    </td>
                    <td>{padre.correo}</td>
                    <td>
                      {padre.telefono ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <FaPhone style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }} /> {padre.telefono}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--color-text-secondary)', fontSize: '13px', fontStyle: 'italic' }}>Sin registrar</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <button 
                        onClick={() => handleOpenStudentsModal(padre)}
                        className="btn-secondary"
                        style={{ padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', borderRadius: '100px' }}
                        title="Ver alumnos asignados"
                      >
                        <FaGraduationCap /> Ver Alumnos
                      </button>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                        <label className="toggle-switch">
                          <input 
                            type="checkbox" 
                            checked={padre.activo !== false}
                            onChange={() => handleToggleStatus(padre)}
                            aria-label={`Alternar estado de ${padre.nombre}`}
                          />
                          <span className="toggle-slider"></span>
                        </label>
                        <span className={`status-badge ${padre.activo !== false ? 'active' : 'inactive'}`} style={{ minWidth: '75px' }}>
                          {padre.activo !== false ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="actions-cell" style={{ justifyContent: 'flex-end' }}>
                        <button 
                          onClick={() => handleOpenEditModal(padre)}
                          className="action-btn edit"
                          title="Editar tutor"
                          aria-label={`Editar tutor ${padre.nombre}`}
                        >
                          <FaEdit />
                        </button>
                        <button 
                          onClick={() => handleOpenDeleteModal(padre)}
                          className="action-btn delete"
                          title="Eliminar tutor"
                          aria-label={`Eliminar tutor ${padre.nombre}`}
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
            {padres.map((padre) => (
              <div className="glass-panel user-card" key={padre._id}>
                <div className="user-card-header">
                  <div className="user-card-avatar">
                    <div className="avatar-circle">
                      {getInitials(padre.nombre)}
                    </div>
                    <div>
                      <h4 className="user-card-name">{padre.nombre}</h4>
                      <span className="user-card-email">{padre.correo}</span>
                    </div>
                  </div>
                </div>

                <div className="user-card-details">
                  <span>Teléfono:</span>
                  <span>{padre.telefono || 'Sin registrar'}</span>
                </div>

                <div className="user-card-details">
                  <span>Alumnos Asociados:</span>
                  <button 
                    onClick={() => handleOpenStudentsModal(padre)}
                    className="btn-secondary"
                    style={{ padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', borderRadius: '100px' }}
                  >
                    <FaGraduationCap /> Ver Alumnos
                  </button>
                </div>

                <div className="user-card-details">
                  <span>Estado:</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <label className="toggle-switch">
                      <input 
                        type="checkbox" 
                        checked={padre.activo !== false}
                        onChange={() => handleToggleStatus(padre)}
                        aria-label={`Alternar estado móvil de ${padre.nombre}`}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                    <span className={`status-badge ${padre.activo !== false ? 'active' : 'inactive'}`}>
                      {padre.activo !== false ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                </div>

                <div className="user-card-actions">
                  <button 
                    onClick={() => handleOpenEditModal(padre)}
                    className="action-btn edit"
                    title="Editar tutor"
                    aria-label={`Editar móvil de ${padre.nombre}`}
                  >
                    <FaEdit />
                  </button>
                  <button 
                    onClick={() => handleOpenDeleteModal(padre)}
                    className="action-btn delete"
                    title="Eliminar tutor"
                    aria-label={`Eliminar móvil de ${padre.nombre}`}
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
                  {modalMode === 'create' ? 'Registrar Nuevo Tutor Familiar' : 'Editar Datos de Tutor Familiar'}
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
                    <label className="input-label" htmlFor="padre-nombre">Nombre Completo</label>
                    <input 
                      type="text" 
                      id="padre-nombre"
                      name="nombre"
                      value={formValues.nombre}
                      onChange={handleInputChange}
                      className={`input-field ${formErrors.nombre ? 'error' : ''}`}
                      placeholder="Ej. María López"
                      required
                    />
                    {formErrors.nombre && (
                      <span className="field-error-text">{formErrors.nombre}</span>
                    )}
                  </div>

                  {/* Campo Correo */}
                  <div className="input-group">
                    <label className="input-label" htmlFor="padre-correo">Correo Electrónico</label>
                    <input 
                      type="email" 
                      id="padre-correo"
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

                  {/* Campo Teléfono */}
                  <div className="input-group">
                    <label className="input-label" htmlFor="padre-telefono">Número de Teléfono</label>
                    <input 
                      type="text" 
                      id="padre-telefono"
                      name="telefono"
                      value={formValues.telefono}
                      onChange={handleInputChange}
                      className={`input-field ${formErrors.telefono ? 'error' : ''}`}
                      placeholder="Ej. +56 9 8765 4321"
                    />
                    {formErrors.telefono && (
                      <span className="field-error-text">{formErrors.telefono}</span>
                    )}
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
                      modalMode === 'create' ? 'Registrar Tutor' : 'Guardar Cambios'
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
                  <FaExclamationTriangle /> ¿Eliminar Tutor Familiar?
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
                  ¿Estás seguro de que deseas eliminar permanentemente al tutor <strong>{padreToDelete?.nombre}</strong> ({padreToDelete?.correo})?
                </p>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: '13px' }}>
                  Esta acción es irreversible y eliminará su cuenta de usuario del sistema.
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
                    'Sí, Eliminar Tutor'
                  )}
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* MODAL DE GESTIÓN Y ASIGNACIÓN DE ALUMNOS */}
      {isStudentsModalOpen && (
        <ModalPortal>
          <div className="modal-overlay">
            <div className="glass-panel modal-dialog" style={{ maxWidth: '580px' }}>
              <div className="modal-header">
                <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FaUsers /> Alumnos de {selectedPadre?.nombre}
                </h3>
                <button 
                  onClick={() => { setIsStudentsModalOpen(false); setAssociatedStudents([]); setAllStudents([]); }} 
                  className="modal-close-btn"
                  aria-label="Cerrar modal de alumnos"
                >
                  <FaTimes />
                </button>
              </div>

              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Botón para abrir el modal de selección de estudiante sin tutor */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(37, 99, 235, 0.04)', border: '1px dashed var(--color-primary)', padding: '14px 16px', borderRadius: 'var(--radius-md)' }}>
                  <div>
                    <div style={{ fontSize: '13.5px', fontWeight: '700', color: 'var(--color-text)' }}>
                      Asignar Nuevo Alumno
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                      Busca y selecciona alumnos sin tutor asignado.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setIsStudentSelectModalOpen(true); setStudentSearchQuery(''); }}
                    className="btn-primary"
                    style={{ padding: '8px 16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <FaPlus /> + Añadir Estudiante
                  </button>
                </div>

                {/* Sección Alumnos Actuales */}
                <div>
                  <h4 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
                    Estudiantes Asignados ({associatedStudents.length})
                  </h4>

                  {studentsLoading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '30px' }}>
                      <div className="spinner" style={{ marginBottom: '12px' }}></div>
                      <span style={{ color: 'var(--color-text-secondary)', fontSize: '13px' }}>Cargando alumnos...</span>
                    </div>
                  ) : associatedStudents.length === 0 ? (
                    <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-secondary)', background: 'rgba(0,0,0,0.02)', borderRadius: 'var(--radius-md)' }}>
                      <div style={{ fontSize: '28px', marginBottom: '4px' }}>🎓</div>
                      <h4 style={{ color: 'var(--color-text)', fontWeight: '700', fontSize: '14px', marginBottom: '2px' }}>Sin alumnos asignados</h4>
                      <p style={{ fontSize: '12.5px', margin: 0 }}>Haz clic en "+ Añadir Estudiante" para buscar y asignar un alumno sin tutor.</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '250px', overflowY: 'auto' }}>
                      {associatedStudents.map(student => (
                        <div key={student._id} className="glass-panel" style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div className="avatar-circle" style={{ width: '36px', height: '36px', fontSize: '13px' }}>
                              {getInitials(student.nombre)}
                            </div>
                            <div>
                              <h4 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--color-text)', margin: 0 }}>{student.nombre}</h4>
                              <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', fontFamily: 'monospace' }}>QR: {student.codigoQR}</span>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span className="role-badge" style={{ background: 'rgba(37, 99, 235, 0.08)', color: 'var(--color-primary)', border: '1px solid rgba(37, 99, 235, 0.15)', fontSize: '11px' }}>
                              {student.rutaId?.nombre || 'Sin Ruta'}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleUnlinkStudent(student._id, student.nombre)}
                              disabled={linking}
                              className="action-btn delete"
                              title="Desvincular alumno de este tutor"
                              style={{ width: '30px', height: '30px', borderRadius: '6px' }}
                            >
                              <FaTimes />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-footer">
                <button 
                  type="button" 
                  onClick={() => { setIsStudentsModalOpen(false); setAssociatedStudents([]); setAllStudents([]); }}
                  className="btn-secondary"
                  style={{ fontSize: '13px', padding: '8px 16px' }}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* MODAL SECUNDARIO DE SELECCIÓN DE ESTUDIANTE SIN TUTOR */}
      {isStudentSelectModalOpen && (
        <ModalPortal>
          <div className="modal-overlay animate-fade-in" style={{ zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div className="glass-panel modal-dialog" style={{ maxWidth: '600px', width: '100%', maxHeight: '85vh', display: 'flex', flexDirection: 'column', padding: '24px' }}>
              <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--color-border)', paddingBottom: '12px' }}>
                <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '18px', fontWeight: '700', margin: 0 }}>
                  <FaGraduationCap style={{ color: 'var(--color-primary)' }} />
                  <span>Seleccionar Estudiante Sin Tutor</span>
                </h3>
                <button 
                  onClick={() => { setIsStudentSelectModalOpen(false); setStudentSearchQuery(''); }} 
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
                  placeholder="Buscar estudiante por nombre, código QR o ruta escolar..."
                  value={studentSearchQuery}
                  onChange={(e) => setStudentSearchQuery(e.target.value)}
                  style={{ paddingLeft: '38px', fontSize: '13.5px' }}
                  autoFocus
                />
              </div>

              <div className="modal-body" style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
                {(() => {
                  const unassignedStudents = allStudents.filter(s => !s.padreId || (typeof s.padreId === 'object' && !s.padreId._id));
                  const search = studentSearchQuery.toLowerCase().trim();
                  const filtered = unassignedStudents.filter(s => {
                    if (!search) return true;
                    const name = (s.nombre || '').toLowerCase();
                    const qr = (s.codigoQR || '').toLowerCase();
                    const routeName = (s.rutaId?.nombre || '').toLowerCase();
                    return name.includes(search) || qr.includes(search) || routeName.includes(search);
                  });

                  if (unassignedStudents.length === 0) {
                    return (
                      <div style={{ textAlign: 'center', padding: '36px 20px', color: 'var(--color-text-secondary)', background: 'rgba(255,255,255,0.01)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--color-border)' }}>
                        <FaExclamationTriangle style={{ fontSize: '28px', color: 'var(--color-warning)', marginBottom: '10px' }} />
                        <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-text)', marginBottom: '4px' }}>
                          No hay estudiantes sin tutor disponibles
                        </div>
                        <div style={{ fontSize: '12.5px' }}>
                          Todos los alumnos registrados ya tienen un padre o tutor familiar asignado en la plataforma.
                        </div>
                      </div>
                    );
                  }

                  if (filtered.length === 0) {
                    return (
                      <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: '13.5px' }}>
                        No se encontraron estudiantes que coincidan con la búsqueda.
                      </div>
                    );
                  }

                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {filtered.map(student => (
                        <div 
                          key={student._id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '12px 16px',
                            borderRadius: 'var(--radius-md)',
                            background: 'rgba(255, 255, 255, 0.02)',
                            border: '1px solid var(--color-border)',
                            transition: 'all 0.2s'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div className="avatar-circle" style={{ width: '36px', height: '36px', fontSize: '13px' }}>
                              {getInitials(student.nombre)}
                            </div>
                            <div>
                              <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-text)' }}>{student.nombre}</div>
                              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                                Ruta: {student.rutaId?.nombre || 'Sin Ruta'} | <span style={{ fontFamily: 'monospace' }}>QR: {student.codigoQR}</span>
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleAssignStudent(student)}
                            disabled={linking}
                            className="btn-primary"
                            style={{ padding: '6px 14px', fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '6px' }}
                          >
                            {linking ? <FaSyncAlt className="spin" /> : <FaPlus />} Asignar
                          </button>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
}
