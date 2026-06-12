import React, { useEffect, useRef } from 'react';
import { 
  FaTimes, 
  FaCalendarAlt, 
  FaBus, 
  FaUserTie, 
  FaClock, 
  FaMapMarkerAlt, 
  FaPhoneAlt, 
  FaRoute,
  FaCheckCircle,
  FaQrcode,
  FaInfoCircle
} from 'react-icons/fa';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { 
  translateEventType, 
  getEventBadgeStyle, 
  getEventIcon 
} from './EventTable';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || 'pk.eyJ1IjoiZnJhbmNpc2NvMDgyIiwiYSI6ImNtcWI0eXJkMDBkZm0yc3F5bGNkMDdudW8ifQ.hUD-NrHEMSqRfWiNmJs6hA';
mapboxgl.accessToken = MAPBOX_TOKEN;

export default function EventDetail({ event, onClose }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  
  const shortId = `EVT-${(event?._id || event?.id || '').slice(-4).toUpperCase()}`;

  // Cargar el mapa si hay localización
  useEffect(() => {
    if (!event || !mapContainerRef.current) return;

    const lat = event.location?.latitude;
    const lng = event.location?.longitude;

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

    // Crear marcador de evento
    const el = document.createElement('div');
    el.style.width = '24px';
    el.style.height = '24px';
    el.style.borderRadius = '50%';
    el.style.background = 'rgba(37, 99, 235, 0.2)';
    el.style.border = '2px solid #2563EB';
    el.style.display = 'flex';
    el.style.alignItems = 'center';
    el.style.justifyContent = 'center';
    el.style.color = '#2563EB';
    el.style.fontSize = '11px';
    el.style.boxShadow = '0 0 8px rgba(37, 99, 235, 0.4)';
    el.innerHTML = '📍';

    new mapboxgl.Marker({ element: el })
      .setLngLat([parseFloat(lng), parseFloat(lat)])
      .addTo(map);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [event]);

  if (!event) return null;

  const hasLocation = event.location?.latitude !== undefined && event.location?.longitude !== undefined;

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' a las ' + 
           date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  // Retorna render adicional según el tipo de evento
  const renderSpecializedDetails = () => {
    switch (event.type) {
      case 'student_boarded':
        return (
          <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', background: 'rgba(16, 185, 129, 0.03)', borderLeft: '4px solid #10B981' }}>
            <h5 style={{ margin: 0, fontSize: '13px', color: '#10B981', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700' }}>
              <FaCheckCircle /> Verificación de Abordaje Estudiantil
            </h5>
            <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span>Estudiante: <strong style={{ color: 'var(--color-text)' }}>{event.student?.nombre || 'N/A'}</strong></span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-text-secondary)', fontSize: '12px' }}>
                <FaQrcode /> Método de Validación: Escaneo de Credencial (Código QR)
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-text-secondary)', fontSize: '12px' }}>
                🟢 Estado: Confirmado a Bordo
              </span>
            </div>
          </div>
        );
      case 'student_dropped':
        return (
          <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', background: 'rgba(6, 182, 212, 0.03)', borderLeft: '4px solid #06B6D4' }}>
            <h5 style={{ margin: 0, fontSize: '13px', color: '#06B6D4', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700' }}>
              <FaCheckCircle /> Verificación de Descenso Estudiantil
            </h5>
            <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span>Estudiante: <strong style={{ color: 'var(--color-text)' }}>{event.student?.nombre || 'N/A'}</strong></span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-text-secondary)', fontSize: '12px' }}>
                📍 Parada: Zona Residencial / Escuela (Destino)
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-text-secondary)', fontSize: '12px' }}>
                🔵 Estado: Descendido Seguro
              </span>
            </div>
          </div>
        );
      case 'route_finished':
        return (
          <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', background: 'rgba(239, 68, 68, 0.03)', borderLeft: '4px solid #EF4444' }}>
            <h5 style={{ margin: 0, fontSize: '13px', color: '#EF4444', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700' }}>
              🏁 Cierre del Recorrido Escolar
            </h5>
            <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: 0 }}>
              {event.description || 'El recorrido ha sido marcado como finalizado por el conductor. Autobús de regreso en base.'}
            </p>
          </div>
        );
      case 'route_deviated':
        return (
          <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', background: 'rgba(245, 158, 11, 0.03)', borderLeft: '4px solid #F59E0B' }}>
            <h5 style={{ margin: 0, fontSize: '13px', color: '#F59E0B', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700' }}>
              ⚠️ Desvío Crítico de Trayecto
            </h5>
            <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: 0 }}>
              El autobús ha salido de la polilínea programada de la ruta por una distancia superior a la tolerancia definida. Alerta emitida al centro de monitoreo.
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1050 }}>
      <div className="glass-panel modal-dialog" style={{ maxWidth: '600px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        {/* Cabecera */}
        <div className="modal-header">
          <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            Auditoría de Evento {shortId}
          </h3>
          <button onClick={onClose} className="modal-close-btn" aria-label="Cerrar modal de detalle">
            <FaTimes />
          </button>
        </div>

        {/* Cuerpo */}
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }}>
          
          {/* Tipo de Evento y Fecha */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '20px', display: 'flex', alignItems: 'center' }}>
                {getEventIcon(event.type)}
              </span>
              <span 
                style={{
                  display: 'inline-block',
                  padding: '4px 12px',
                  borderRadius: '100px',
                  fontSize: '13px',
                  fontWeight: '700',
                  ...getEventBadgeStyle(event.type)
                }}
              >
                {translateEventType(event.type)}
              </span>
            </div>
            <span style={{ fontSize: '12.5px', color: 'var(--color-text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '6px', height: '28px' }}>
              <FaCalendarAlt /> {formatDate(event.createdAt)}
            </span>
          </div>

          {/* Mensaje descriptivo */}
          <div style={{ background: 'rgba(0, 0, 0, 0.01)', padding: '12px', borderRadius: '6px', border: '1px solid var(--color-border)', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
            <FaInfoCircle style={{ color: 'var(--color-primary)', fontSize: '14px', marginTop: '3px', flexShrink: 0 }} />
            <span style={{ fontSize: '13.5px', color: 'var(--color-text)', lineHeight: '1.4' }}>
              {event.description || 'Evento registrado automáticamente por la aplicación del conductor.'}
            </span>
          </div>

          {/* Detalles de Auditoría Especializados */}
          {renderSpecializedDetails()}

          {/* Conductor y Vehículo */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {/* Conductor */}
            <div className="glass-panel" style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <FaUserTie /> Conductor a Cargo:
              </span>
              <span style={{ fontSize: '13.5px', fontWeight: '700', color: 'var(--color-text)' }}>
                {event.driver?.usuarioId?.nombre || 'N/A'}
              </span>
              {event.driver?.telefono && (
                <span style={{ color: 'var(--color-text-secondary)', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <FaPhoneAlt /> {event.driver?.telefono}
                </span>
              )}
            </div>

            {/* Vehículo y Ruta */}
            <div className="glass-panel" style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <FaRoute /> Ruta & Autobús:
              </span>
              <span style={{ fontSize: '13.5px', fontWeight: '700', color: 'var(--color-text)' }}>
                {event.route?.nombre || 'N/A'}
              </span>
              <span style={{ color: 'var(--color-text-secondary)', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <FaBus /> Patente: {event.route?.autobusId?.patente || 'N/A'} ({event.route?.autobusId?.modelo || 'N/A'})
              </span>
            </div>
          </div>

          {/* Ubicación GPS del Suceso */}
          {hasLocation ? (
            <div>
              <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', display: 'block', marginBottom: '6px', fontWeight: '600' }}>
                <FaMapMarkerAlt /> Ubicación GPS en el Mapa:
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
                Coordenadas: Lat: {event.location?.latitude}, Lng: {event.location?.longitude}
              </span>
            </div>
          ) : (
            <div style={{ background: 'rgba(0, 0, 0, 0.02)', padding: '10px', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: 'var(--color-text-secondary)' }}>
              📍 <i>Este evento no contiene coordenadas de geolocalización específicas.</i>
            </div>
          )}

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
