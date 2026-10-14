import React, { useEffect, useRef } from 'react';
import { 
  FaTimes, 
  FaExclamationTriangle, 
  FaBus, 
  FaUserTie, 
  FaClock, 
  FaMapMarkerAlt, 
  FaPhoneAlt, 
  FaEnvelope,
  FaRoute,
  FaCheckCircle,
  FaSyncAlt,
  FaUndo
} from 'react-icons/fa';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { 
  translateType, 
  translateSeverity, 
  translateStatus, 
  getSeverityStyle, 
  getStatusStyle 
} from './IncidentTable';
import ModalPortal from '../common/ModalPortal';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || 'pk.eyJ1IjoiZnJhbmNpc2NvMDgyIiwiYSI6ImNtcWI0eXJkMDBkZm0yc3F5bGNkMDdudW8ifQ.hUD-NrHEMSqRfWiNmJs6hA';
mapboxgl.accessToken = MAPBOX_TOKEN;

export default function IncidentDetail({ incident, onClose, onChangeStatus, updatingStatus }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  
  const shortId = `INC-${(incident?._id || incident?.id || '').slice(-4).toUpperCase()}`;

  // Cargar el mapa si hay localización
  useEffect(() => {
    if (!incident || !mapContainerRef.current) return;

    const lat = incident.location?.latitude;
    const lng = incident.location?.longitude;

    if (lat === undefined || lng === undefined || isNaN(lat) || isNaN(lng)) return;

    // Inicializar mapa
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [parseFloat(lng), parseFloat(lat)],
      zoom: 14,
      attributionControl: false
    });

    mapInstanceRef.current = map;

    // Crear un elemento personalizado para el marcador de alerta
    const el = document.createElement('div');
    el.style.width = '30px';
    el.style.height = '30px';
    el.style.borderRadius = '50%';
    el.style.background = 'rgba(239, 68, 68, 0.2)';
    el.style.border = '2px solid #EF4444';
    el.style.display = 'flex';
    el.style.alignItems = 'center';
    el.style.justifyContent = 'center';
    el.style.color = '#EF4444';
    el.style.fontSize = '14px';
    el.style.boxShadow = '0 0 10px rgba(239, 68, 68, 0.5)';
    el.innerHTML = '⚠️';

    new mapboxgl.Marker({ element: el })
      .setLngLat([parseFloat(lng), parseFloat(lat)])
      .addTo(map);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [incident]);

  if (!incident) return null;

  const hasLocation = incident.location?.latitude !== undefined && incident.location?.longitude !== undefined;

  // Manejar cambio de estado
  const handleStatusChange = (e) => {
    onChangeStatus(incident._id || incident.id, e.target.value);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' + 
           date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <ModalPortal>
      <div className="modal-overlay" style={{ zIndex: 1050 }}>
        <div className="glass-panel modal-dialog" style={{ maxWidth: '600px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
          {/* Cabecera */}
          <div className="modal-header">
            <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FaExclamationTriangle style={{ color: 'var(--color-danger)' }} /> Detalles de la Incidencia {shortId}
            </h3>
            <button onClick={onClose} className="modal-close-btn" aria-label="Cerrar modal de detalle">
              <FaTimes />
            </button>
          </div>

          {/* Cuerpo del Modal con Scroll */}
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }}>
            
            {/* Título y Tipo */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: '800', color: 'var(--color-text)' }}>
                  {incident.title || translateType(incident.type)}
                </h4>
                <span 
                  style={{
                    display: 'inline-block',
                    padding: '4px 12px',
                    borderRadius: '16px',
                    fontSize: '12px',
                    fontWeight: '700',
                    ...getStatusStyle(incident.status)
                  }}
                >
                  {translateStatus(incident.status)}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
                <span 
                  style={{
                    display: 'inline-block',
                    padding: '3px 10px',
                    borderRadius: '100px',
                    fontSize: '12px',
                    fontWeight: '700',
                    ...getSeverityStyle(incident.severity)
                  }}
                >
                  Prioridad: {translateSeverity(incident.severity)}
                </span>
                <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <FaClock /> {formatDate(incident.createdAt)}
                </span>
              </div>
            </div>

            {/* Descripción */}
            <div style={{ background: 'rgba(0, 0, 0, 0.01)', padding: '12px', borderRadius: '6px', border: '1px solid var(--color-border)' }}>
              <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px', fontWeight: '600' }}>
                Descripción Reportada:
              </span>
              <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--color-text)', lineHeight: '1.5' }}>
                {incident.description || 'Sin descripción detallada enviada.'}
              </p>
            </div>

            {/* Conductor y Vehículo */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {/* Conductor */}
              <div className="glass-panel" style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <FaUserTie /> Conductor Reportante:
                </span>
                <span style={{ fontSize: '13.5px', fontWeight: '700', color: 'var(--color-text)' }}>
                  {incident.driver?.usuarioId?.nombre || 'N/A'}
                </span>
                {incident.driver?.telefono && (
                  <span style={{ color: 'var(--color-text-secondary)', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <FaPhoneAlt /> {incident.driver?.telefono}
                  </span>
                )}
              </div>

              {/* Vehículo y Ruta */}
              <div className="glass-panel" style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <FaRoute /> Ruta & Autobús:
                </span>
                <span style={{ fontSize: '13.5px', fontWeight: '700', color: 'var(--color-text)' }}>
                  {incident.route?.nombre || 'N/A'}
                </span>
                <span style={{ color: 'var(--color-text-secondary)', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <FaBus /> Patente: {incident.route?.autobusId?.patente || 'N/A'} ({incident.route?.autobusId?.modelo || 'N/A'})
                </span>
              </div>
            </div>

            {/* Ubicación GPS */}
            {hasLocation ? (
              <div>
                <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '6px', fontWeight: '600' }}>
                  <FaMapMarkerAlt /> Geolocalización del Incidente:
                </span>
                <div 
                  ref={mapContainerRef} 
                  style={{ 
                    width: '100%', 
                    height: '180px', 
                    borderRadius: '6px', 
                    border: '1px solid var(--color-border)',
                    overflow: 'hidden'
                  }}
                />
                <span style={{ fontSize: '10px', color: 'var(--color-text-secondary)', display: 'block', marginTop: '4px', textAlign: 'right' }}>
                  Coordenadas: Lat: {incident.location?.latitude}, Lng: {incident.location?.longitude}
                </span>
              </div>
            ) : (
              <div style={{ background: 'rgba(0, 0, 0, 0.02)', padding: '10px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: 'var(--color-text-secondary)' }}>
                📍 <i>Sin datos GPS reportados para esta incidencia.</i>
              </div>
            )}

            {/* Gestión del Estado de Resolución */}
            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <label style={{ fontSize: '13px', fontWeight: '700', color: 'var(--color-text)', margin: 0 }}>
                  Gestión y Resolución Operativa:
                </label>
                {updatingStatus && (
                  <span style={{ fontSize: '12px', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div className="spinner" style={{ width: '13px', height: '13px', borderWidth: '2px' }}></div>
                    Guardando cambios...
                  </span>
                )}
              </div>

              {/* Botones de acción rápida con 1 clic */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                {incident.status !== 'resolved' && (
                  <button
                    type="button"
                    onClick={() => onChangeStatus(incident._id || incident.id, 'resolved')}
                    disabled={updatingStatus}
                    style={{
                      background: '#10B981',
                      border: '1px solid #10B981',
                      color: '#FFFFFF',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '7px',
                      fontWeight: '700',
                      padding: '8px 14px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '12.5px',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 2px 6px rgba(16, 185, 129, 0.25)'
                    }}
                  >
                    <FaCheckCircle /> Marcar como Resuelta
                  </button>
                )}

                {incident.status !== 'in_progress' && incident.status !== 'resolved' && incident.status !== 'closed' && (
                  <button
                    type="button"
                    onClick={() => onChangeStatus(incident._id || incident.id, 'in_progress')}
                    disabled={updatingStatus}
                    className="btn-secondary"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '7px',
                      fontWeight: '600',
                      padding: '8px 14px',
                      borderRadius: '8px',
                      fontSize: '12.5px'
                    }}
                  >
                    <FaSyncAlt /> Poner En Revisión
                  </button>
                )}

                {incident.status === 'resolved' && (
                  <button
                    type="button"
                    onClick={() => onChangeStatus(incident._id || incident.id, 'closed')}
                    disabled={updatingStatus}
                    className="btn-secondary"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '7px',
                      fontWeight: '600',
                      padding: '8px 14px',
                      borderRadius: '8px',
                      fontSize: '12.5px'
                    }}
                  >
                    🔒 Cerrar Definitivamente
                  </button>
                )}

                {(incident.status === 'resolved' || incident.status === 'closed') && (
                  <button
                    type="button"
                    onClick={() => onChangeStatus(incident._id || incident.id, 'open')}
                    disabled={updatingStatus}
                    className="btn-secondary"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '7px',
                      fontWeight: '600',
                      padding: '8px 14px',
                      borderRadius: '8px',
                      fontSize: '12.5px'
                    }}
                  >
                    <FaUndo /> Reabrir a Pendiente
                  </button>
                )}
              </div>

              {/* Selector detallado de estado */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', fontWeight: '600' }}>
                  O cambiar estado manualmente:
                </span>
                <select
                  value={incident.status || 'open'}
                  onChange={handleStatusChange}
                  disabled={updatingStatus}
                  className="input-field"
                  style={{ 
                    fontWeight: '700',
                    cursor: 'pointer',
                    fontSize: '13px',
                    height: '40px',
                    ...getStatusStyle(incident.status)
                  }}
                >
                  <option value="open">🟡 Pendiente (Reportada / Abierta)</option>
                  <option value="in_progress">🔵 En Revisión (En Atención Operativa)</option>
                  <option value="resolved">🟢 Resuelta (Solucionada en Ruta)</option>
                  <option value="closed">⚪ Cerrada (Archivada)</option>
                </select>
              </div>
            </div>

          </div>

          {/* Footer */}
          <div className="modal-footer" style={{ borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button onClick={onClose} className="btn-secondary" style={{ padding: '8px 20px' }}>
              Cerrar
            </button>
            {incident.status !== 'resolved' && incident.status !== 'closed' && (
              <button
                type="button"
                onClick={() => onChangeStatus(incident._id || incident.id, 'resolved')}
                disabled={updatingStatus}
                style={{
                  background: '#10B981',
                  border: '1px solid #10B981',
                  color: '#FFFFFF',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontWeight: '700',
                  padding: '8px 18px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '13px'
                }}
              >
                <FaCheckCircle /> Marcar como Resuelta
              </button>
            )}
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
