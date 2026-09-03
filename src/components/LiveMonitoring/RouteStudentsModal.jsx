import React, { useState, useEffect, useMemo } from 'react';
import { FaTimes, FaSearch, FaGraduationCap, FaCheckCircle, FaClock, FaSignOutAlt, FaPhone, FaEnvelope, FaMapMarkerAlt, FaSyncAlt, FaUserTie, FaBus, FaRoute } from 'react-icons/fa';
import { io } from 'socket.io-client';
import { studentService, routeService } from '../../services/api';

export default function RouteStudentsModal({ isOpen, onClose, routeData, initialTab = 'ALL' }) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [students, setStudents] = useState([]);
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const routeId = useMemo(() => {
    if (!routeData) return null;
    if (typeof routeData === 'string') return routeData;
    if (typeof routeData.route === 'string') return routeData.route;
    return routeData?.route?.id || routeData?.route?._id || routeData?._id || routeData?.id || null;
  }, [routeData]);

  const routeName = routeData?.nombre || routeData?.route?.nombre || 'Ruta Escolar';
  const driverName = routeData?.conductor?.nombre || routeData?.conductorId?.nombre || routeData?.conductorId?.usuarioId?.nombre || 'Sin asignar';
  const busPlate = routeData?.autobus?.patente || routeData?.autobus?.codigo || routeData?.autobusId?.patente || 'S/C';

  useEffect(() => {
    if (isOpen && routeId) {
      setActiveTab(initialTab);
      fetchData();
    }
  }, [isOpen, routeId, initialTab]);

  // Suscribirse a eventos de Sockets en tiempo real para la ruta
  useEffect(() => {
    if (!isOpen || !routeId) return;

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const socketUrl = apiUrl.replace(/\/api\/?$/, '');
    const socket = io(socketUrl, { transports: ['websocket'] });

    socket.emit('join_route', { routeId });

    const handleStudentBoarded = (data) => {
      const sId = data?.studentId || data?.student || data?.estudianteId;
      if (sId) {
        setEvents(prev => [
          ...prev,
          {
            type: 'student_boarded',
            student: sId,
            createdAt: data.timestamp || new Date().toISOString(),
            location: data.location
          }
        ]);
      }
    };

    const handleStudentDropped = (data) => {
      const sId = data?.studentId || data?.student || data?.estudianteId;
      if (sId) {
        setEvents(prev => [
          ...prev,
          {
            type: 'student_dropped',
            student: sId,
            createdAt: data.timestamp || new Date().toISOString(),
            location: data.location
          }
        ]);
      }
    };

    socket.on('student_boarded', handleStudentBoarded);
    socket.on('student_dropped', handleStudentDropped);

    return () => {
      socket.emit('leave_route', { routeId });
      socket.off('student_boarded', handleStudentBoarded);
      socket.off('student_dropped', handleStudentDropped);
      socket.disconnect();
    };
  }, [isOpen, routeId]);

  const fetchData = async () => {
    if (!routeId) return;
    try {
      setIsLoading(true);
      
      // 1. Obtener lista de estudiantes asignados a la ruta
      const studentsRes = await studentService.getStudents({ rutaId: routeId });
      const studentList = Array.isArray(studentsRes) ? studentsRes : (studentsRes?.data || []);

      // 2. Obtener eventos recientes de transporte para esta ruta
      let eventList = [];
      try {
        const eventsRes = await routeService.getRouteEvents(routeId);
        const parsedEvents = Array.isArray(eventsRes) ? eventsRes : (eventsRes?.data || []);
        
        // También intentar obtener monitoreo para capturar eventos de la sesión
        const monRes = await routeService.getRouteMonitoring(routeId);
        const monData = Array.isArray(monRes) ? monRes[0] : (monRes?.data || monRes || {});
        const monEvents = monData?.eventosRecientes || [];
        
        eventList = [...parsedEvents, ...monEvents];
      } catch (err) {
        console.warn('No se pudieron obtener eventos de transporte:', err);
      }

      setStudents(studentList);
      setEvents(eventList);
    } catch (error) {
      console.error('Error al cargar alumnos de la ruta en monitoreo:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Mapear el estado más reciente de cada estudiante
  const studentsWithStatus = useMemo(() => {
    const statusMap = new Map();
    const sortedEvents = [...events].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    const extractId = (val) => {
      if (!val) return null;
      if (typeof val === 'object') {
        return val._id ? val._id.toString() : val.id ? val.id.toString() : null;
      }
      return val.toString();
    };

    sortedEvents.forEach(e => {
      const sId = extractId(e.student || e.estudianteId || e.studentId);
      if (sId) {
        if (e.type === 'student_boarded') {
          statusMap.set(sId, { status: 'boarded', timestamp: e.createdAt, location: e.location });
        } else if (e.type === 'student_dropped') {
          statusMap.set(sId, { status: 'dropped', timestamp: e.createdAt, location: e.location });
        }
      }
    });

    return students.map(s => {
      const studentIdStr = extractId(s._id || s.id);
      const info = statusMap.get(studentIdStr) || { status: 'waiting', timestamp: null };
      return {
        ...s,
        boardingStatus: info.status,
        lastEventTime: info.timestamp
      };
    });
  }, [students, events]);

  // Conteos
  const stats = useMemo(() => {
    let total = studentsWithStatus.length;
    let boarded = 0;
    let waiting = 0;
    let dropped = 0;

    studentsWithStatus.forEach(s => {
      if (s.boardingStatus === 'boarded') boarded++;
      else if (s.boardingStatus === 'dropped') dropped++;
      else waiting++;
    });

    return { total, boarded, waiting, dropped };
  }, [studentsWithStatus]);

  // Alumnos filtrados por Pestaña y Buscador
  const filteredStudents = useMemo(() => {
    return studentsWithStatus.filter(s => {
      if (activeTab === 'WAITING' && s.boardingStatus !== 'waiting') return false;
      if (activeTab === 'BOARDED' && s.boardingStatus !== 'boarded') return false;
      if (activeTab === 'DROPPED' && s.boardingStatus !== 'dropped') return false;

      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase().trim();
        const nameMatch = s.nombre?.toLowerCase().includes(q);
        const carnetMatch = s.carnet?.toLowerCase().includes(q);
        const parentMatch = s.padreId?.nombre?.toLowerCase().includes(q);
        return nameMatch || carnetMatch || parentMatch;
      }

      return true;
    });
  }, [studentsWithStatus, activeTab, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay animate-fade-in" style={{ zIndex: 11000 }}>
      <div 
        className="modal-container glass-panel" 
        style={{ 
          maxWidth: '750px', 
          width: '95%', 
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '24px',
          background: 'var(--color-card)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
          border: '1px solid var(--color-border)',
          gap: '16px'
        }}
      >
        {/* Cabecera */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: '12px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FaGraduationCap style={{ color: 'var(--color-primary)' }} /> Alumnos Asignados y Estado de Abordaje
            </h3>
            <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
              <span><FaRoute style={{ color: '#3B82F6' }} /> <strong>{routeName}</strong></span>
              <span><FaUserTie style={{ color: '#10B981' }} /> Conductor: <strong>{driverName}</strong></span>
              <span><FaBus style={{ color: '#F59E0B' }} /> Autobús: <strong>{busPlate}</strong></span>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="btn-secondary" 
            style={{ borderRadius: '50%', width: '32px', height: '32px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            title="Cerrar ventana"
          >
            <FaTimes />
          </button>
        </div>

        {/* Barra de Filtros y Buscador */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Buscador */}
          <div style={{ position: 'relative', width: '100%' }}>
            <FaSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)', fontSize: '13px' }} />
            <input
              type="text"
              className="input-field"
              placeholder="Buscar por alumno, carnet o tutor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '34px', fontSize: '13px', width: '100%', borderRadius: 'var(--radius-md)' }}
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer' }}
              >
                <FaTimes />
              </button>
            )}
          </div>

          {/* Botones de Pestañas de Filtro */}
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
            <button
              onClick={() => setActiveTab('ALL')}
              className={`btn-tab ${activeTab === 'ALL' ? 'active' : ''}`}
              style={{
                padding: '6px 14px',
                borderRadius: '100px',
                fontSize: '12px',
                fontWeight: '700',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                border: '1px solid var(--color-border)',
                background: activeTab === 'ALL' ? 'var(--color-primary)' : 'var(--color-surface)',
                color: activeTab === 'ALL' ? '#FFF' : 'var(--color-text-secondary)',
                cursor: 'pointer'
              }}
            >
              Todos ({stats.total})
            </button>

            <button
              onClick={() => setActiveTab('WAITING')}
              style={{
                padding: '6px 14px',
                borderRadius: '100px',
                fontSize: '12px',
                fontWeight: '700',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                border: '1px solid rgba(245, 158, 11, 0.4)',
                background: activeTab === 'WAITING' ? '#F59E0B' : 'rgba(245, 158, 11, 0.1)',
                color: activeTab === 'WAITING' ? '#FFF' : '#F59E0B',
                cursor: 'pointer'
              }}
            >
              <FaClock /> Pendientes ({stats.waiting})
            </button>

            <button
              onClick={() => setActiveTab('BOARDED')}
              style={{
                padding: '6px 14px',
                borderRadius: '100px',
                fontSize: '12px',
                fontWeight: '700',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                background: activeTab === 'BOARDED' ? '#10B981' : 'rgba(16, 185, 129, 0.1)',
                color: activeTab === 'BOARDED' ? '#FFF' : '#10B981',
                cursor: 'pointer'
              }}
            >
              <FaCheckCircle /> A Bordo ({stats.boarded})
            </button>

            <button
              onClick={() => setActiveTab('DROPPED')}
              style={{
                padding: '6px 14px',
                borderRadius: '100px',
                fontSize: '12px',
                fontWeight: '700',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                border: '1px solid rgba(59, 130, 246, 0.4)',
                background: activeTab === 'DROPPED' ? '#3B82F6' : 'rgba(59, 130, 246, 0.1)',
                color: activeTab === 'DROPPED' ? '#FFF' : '#3B82F6',
                cursor: 'pointer'
              }}
            >
              <FaSignOutAlt /> Entregados ({stats.dropped})
            </button>
          </div>
        </div>

        {/* Listado de Tarjetas */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '4px' }}>
          {isLoading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
              <FaSyncAlt className="spin" style={{ fontSize: '24px', marginBottom: '8px' }} />
              <p style={{ margin: 0, fontSize: '14px' }}>Cargando registros de estudiantes en vivo...</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
              <FaGraduationCap style={{ fontSize: '36px', opacity: 0.4, marginBottom: '8px' }} />
              <p style={{ fontSize: '14px', fontWeight: '700', margin: '0 0 4px 0', color: 'var(--color-text)' }}>
                No hay estudiantes en esta categoría
              </p>
              <p style={{ fontSize: '12px', margin: 0 }}>
                {searchQuery ? 'Prueba cambiando los términos de búsqueda.' : 'No existen registros que coincidan con la pestaña seleccionada.'}
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '12px' }}>
              {filteredStudents.map((s) => {
                const status = s.boardingStatus;
                
                let badgeBg = 'rgba(245, 158, 11, 0.12)';
                let badgeBorder = 'rgba(245, 158, 11, 0.3)';
                let badgeColor = '#F59E0B';
                let badgeLabel = 'PENDIENTE';
                let StatusIcon = FaClock;

                if (status === 'boarded') {
                  badgeBg = 'rgba(16, 185, 129, 0.12)';
                  badgeBorder = 'rgba(16, 185, 129, 0.3)';
                  badgeColor = '#10B981';
                  badgeLabel = 'A BORDO';
                  StatusIcon = FaCheckCircle;
                } else if (status === 'dropped') {
                  badgeBg = 'rgba(59, 130, 246, 0.12)';
                  badgeBorder = 'rgba(59, 130, 246, 0.3)';
                  badgeColor = '#3B82F6';
                  badgeLabel = 'ENTREGADO';
                  StatusIcon = FaSignOutAlt;
                }

                const tutorName = s.padreId?.nombre || 'Tutor no asignado';
                const tutorEmail = s.padreId?.correo || s.padreId?.email;
                const tutorPhone = s.padreId?.telefono;

                return (
                  <div 
                    key={s._id} 
                    className="glass-panel"
                    style={{
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-border)',
                      background: 'var(--color-surface)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}
                  >
                    {/* Fila Estudiante y Badge */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--color-text)', display: 'block' }}>
                          {s.nombre}
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                          Carnet: <strong>{s.carnet || 'N/A'}</strong>
                        </span>
                      </div>

                      <span style={{
                        fontSize: '10px',
                        fontWeight: '800',
                        padding: '3px 8px',
                        borderRadius: '100px',
                        background: badgeBg,
                        border: `1px solid ${badgeBorder}`,
                        color: badgeColor,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <StatusIcon style={{ fontSize: '10px' }} /> {badgeLabel}
                      </span>
                    </div>

                    {/* Dirección */}
                    {s.direccion && (
                      <div style={{ fontSize: '11.5px', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <FaMapMarkerAlt style={{ color: 'var(--color-primary)' }} />
                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.direccion}</span>
                      </div>
                    )}

                    {/* Tutor Responsable */}
                    <div style={{ background: 'var(--color-card)', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', fontSize: '11px' }}>
                      <span style={{ color: 'var(--color-text-secondary)', fontSize: '9.5px', fontWeight: '700', textTransform: 'uppercase', display: 'block' }}>
                        Tutor / Padre:
                      </span>
                      <span style={{ fontWeight: '700', color: 'var(--color-text)', display: 'block', margin: '2px 0' }}>
                        {tutorName}
                      </span>
                      <div style={{ display: 'flex', gap: '10px', color: 'var(--color-text-secondary)', flexWrap: 'wrap', marginTop: '2px' }}>
                        {tutorPhone && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <FaPhone style={{ color: '#10B981', fontSize: '10px' }} /> {tutorPhone}
                          </span>
                        )}
                        {tutorEmail && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <FaEnvelope style={{ color: '#3B82F6', fontSize: '10px' }} /> {tutorEmail}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Hora del último evento */}
                    {s.lastEventTime && (
                      <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)', textAlign: 'right', fontStyle: 'italic' }}>
                        Hora de registro: {new Date(s.lastEventTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
