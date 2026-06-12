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
  FaCheckCircle
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
            <h4 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: '800', color: 'var(--color-text)' }}>
              {incident.title || translateType(incident.type)}
            </h4>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <span className="role-badge conductor" style={{ fontSize: '11px', padding: '3px 8px' }}>
                Tipo: {translateType(incident.type)}
              </span>
              <span style={{ fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--color-text-secondary)' }}>
                <FaClock /> {formatDate(incident.createdAt)}
              </span>
            </div>
          </div>

          {/* Badges de Gravedad y Estado Actual */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', background: 'rgba(0, 0, 0, 0.02)', padding: '12px', borderRadius: '8px' }}>
            <div>
              <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>Gravedad:</span>
              <span style={{ display: 'inline-block', padding: '4px 12px', borderRadius: '12px', fontSize: '12px', ...getSeverityStyle(incident.severity) }}>
                {translateSeverity(incident.severity)}
              </span>
            </div>
            <div>
              <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px' }}>Estado Actual:</span>
              <span style={{ display: 'inline-block', padding: '4px 12px', borderRadius: '12px', fontSize: '12px', ...getStatusStyle(incident.status) }}>
                {translateStatus(incident.status)}
              </span>
            </div>
          </div>

          {/* Descripción */}
          <div>
            <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '4px', fontWeight: '600' }}>Descripción:</span>
            <div style={{ background: 'var(--color-background)', padding: '12px', borderRadius: '6px', border: '1px solid var(--color-border)', fontSize: '13.5px', color: 'var(--color-text)', lineHeight: '1.5' }}>
              {incident.description || 'Sin descripción detallada registrada.'}
            </div>
          </div>

          {/* Grid de Ruta, Conductor y Vehículo */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {/* Conductor */}
            <div className="glass-panel" style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <h5 style={{ margin: 0, fontSize: '12.5px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-primary)' }}>
                <FaUserTie /> Conductor Reportante
              </h5>
              <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontWeight: '600' }}>{incident.driver?.usuarioId?.nombre || 'N/A'}</span>
                {incident.driver?.usuarioId?.correo && (
                  <span style={{ color: 'var(--color-text-secondary)', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <FaEnvelope /> {incident.driver?.usuarioId?.correo}
                  </span>
                )}
                {incident.driver?.telefono && (
                  <span style={{ color: 'var(--color-text-secondary)', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <FaPhoneAlt /> {incident.driver?.telefono}
                  </span>
                )}
              </div>
            </div>

            {/* Autobús y Ruta */}
            <div className="glass-panel" style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <h5 style={{ margin: 0, fontSize: '12.5px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-primary)' }}>
                <FaBus /> Vehículo & Ruta
              </h5>
              <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <FaRoute style={{ color: 'var(--color-text-secondary)' }} /> {incident.route?.nombre || 'Ruta Escolar'}
                </span>
                <span style={{ color: 'var(--color-text-secondary)', fontSize: '12px' }}>
                  Autobús: {incident.route?.autobusId?.patente || 'N/A'} ({incident.route?.autobusId?.modelo || 'N/A'})
                </span>
              </div>
            </div>
          </div>

          {/* Ubicación y Mapa */}
          {hasLocation ? (
            <div>
              <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '6px', fontWeight: '600' }}>
                <FaMapMarkerAlt /> Ubicación GPS en el Mapa:
              </span>
              <div 
                ref={mapContainerRef} 
                style={{ 
                  width: '100%', 
                  height: '200px', 
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
            <div style={{ background: 'rgba(0, 0, 0, 0.02)', padding: '10px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
              📍 <i>Esta incidencia no cuenta con coordenadas GPS específicas asociadas.</i>
            </div>
          )}

          {/* Selector de cambio de estado */}
          <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '11px', color: 'var(--color-text-secondary)', fontWeight: '600' }} htmlFor="incident-status-select">
                Cambiar Estado de Incidencia:
              </label>
              <select
                id="incident-status-select"
                value={incident.status}
                onChange={handleStatusChange}
                disabled={updatingStatus}
                className="input-field"
                style={{ padding: '6px 12px', fontSize: '13px', height: '36px', width: '180px', margin: 0 }}
              >
                <option value="open">Pendiente</option>
                <option value="in_progress">En revisión</option>
                <option value="resolved">Resuelta</option>
                <option value="closed">Cerrada</option>
              </select>
            </div>

            {updatingStatus && (
              <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div className="spinner" style={{ width: '14px', height: '14px', borderWidth: '2px' }}></div>
                Actualizando estado...
              </span>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="modal-footer" style={{ borderTop: '1px solid var(--color-border)' }}>
          <button onClick={onClose} className="btn-secondary" style={{ padding: '8px 20px' }}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
