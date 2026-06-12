import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { FaBus, FaFlag, FaTimes } from 'react-icons/fa';

// Clave Mapbox (Access Token)
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || 'pk.eyJ1IjoiZnJhbmNpc2NvMDgyIiwiYSI6ImNtcWI0eXJkMDBkZm0yc3F5bGNkMDdudW8ifQ.hUD-NrHEMSqRfWiNmJs6hA';
mapboxgl.accessToken = MAPBOX_TOKEN;

export default function MapView({ activeRoutes, selectedRoute, onSelectRoute }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  
  // Guardamos referencias para marcadores y capas para actualizarlos dinámicamente
  const busMarkersRef = useRef({});
  const routeMarkersRef = useRef([]);

  // 1. Inicializar el mapa
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/navigation-night-v1', // Estilo de mapa oscuro premium (navigation-night-v1 es el oficial)
      center: [-69.931, 18.486], // Centro por defecto
      zoom: 12,
      attributionControl: false
    });

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // 2. Controlar marcadores de autobuses activos, trayectos polilínea e hitos
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Helper para realizar el ajuste de cámara en base a coordenadas
    const adjustCamera = (coords) => {
      if (coords.length === 0) return;
      const bounds = new mapboxgl.LngLatBounds();
      coords.forEach(coord => bounds.extend(coord));
      map.fitBounds(bounds, { padding: 60, duration: 1500 });
    };

    const runMapUpdates = () => {
      // --- TRANSICIONES Y ACTUALIZACIÓN DE AUTOBUSES ---
      const activeIds = new Set();
      const cameraCoords = [];

      activeRoutes.forEach(r => {
        if (!r.ultimaUbicacion?.latitud || !r.ultimaUbicacion?.longitud) return;

        const routeId = r.route.id;
        activeIds.add(routeId);

        const lng = parseFloat(r.ultimaUbicacion.longitud);
        const lat = parseFloat(r.ultimaUbicacion.latitud);
        cameraCoords.push([lng, lat]);

        const isSelected = selectedRoute && selectedRoute.route?.id === routeId;

        // Si el marcador ya existe, actualizar su posición con animación suave
        if (busMarkersRef.current[routeId]) {
          const markerObj = busMarkersRef.current[routeId];
          markerObj.marker.setLngLat([lng, lat]);
          
          // Actualizar el estilo del elemento DOM si cambió su selección
          const element = markerObj.element;
          const iconDiv = element.querySelector('.bus-icon-wrapper');
          if (iconDiv) {
            iconDiv.style.backgroundColor = isSelected ? '#EF4444' : '#2563EB';
          }
        } else {
          // Crear elemento DOM personalizado para el marcador
          const el = document.createElement('div');
          el.className = 'custom-mapbox-marker';
          el.style.display = 'flex';
          el.style.flexDirection = 'column';
          el.style.alignItems = 'center';
          el.style.cursor = 'pointer';

          // Estructura interna
          el.innerHTML = `
            <div class="bus-icon-wrapper" style="
              background-color: ${isSelected ? '#EF4444' : '#2563EB'};
              color: white;
              width: 36px;
              height: 36px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify class: center;
              justify-content: center;
              font-size: 16px;
              box-shadow: 0 4px 10px rgba(0,0,0,0.35);
              border: 2px solid white;
              transition: background-color 0.3s;
            ">
              🚌
            </div>
            <div style="
              background: rgba(15, 23, 42, 0.9);
              color: white;
              padding: 2px 6px;
              border-radius: 4px;
              font-size: 9px;
              font-weight: 700;
              margin-top: 4px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.2);
              border: 1px solid rgba(255,255,255,0.1);
              white-space: nowrap;
            ">
              ${r.autobus?.patente ? r.autobus.patente.slice(-4) : '🚌'}
            </div>
          `;

          // Popup detallado al hacer click
          const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
            <div style="color: #1E293B; font-family: sans-serif; padding: 4px; min-width: 165px;">
              <h4 style="margin: 0 0 6px 0; font-weight: 800; font-size: 13px; border-bottom: 1px solid #E2E8F0; padding-bottom: 4px;">
                ${r.route?.nombre}
              </h4>
              <div style="display: flex; flex-direction: column; gap: 3px; font-size: 11px;">
                <div><b>Autobús:</b> ${r.autobus?.patente}</div>
                <div><b>Modelo:</b> ${r.autobus?.modelo}</div>
                <div><b>Conductor:</b> ${r.conductor?.nombre || 'N/A'}</div>
                <div><b>A Bordo:</b> ${r.estudiantesStats?.aBordo} alumnos</div>
              </div>
            </div>
          `);

          // Crear e inyectar el marcador en el mapa
          const marker = new mapboxgl.Marker({ element: el })
            .setLngLat([lng, lat])
            .setPopup(popup)
            .addTo(map);

          // Click handler para enfocar ruta
          el.addEventListener('click', (e) => {
            e.stopPropagation();
            if (onSelectRoute) {
              onSelectRoute(routeId);
            }
          });

          busMarkersRef.current[routeId] = { marker, element: el };
        }
      });

      // Eliminar marcadores de autobuses que ya no están activos
      Object.keys(busMarkersRef.current).forEach(routeId => {
        if (!activeIds.has(routeId)) {
          busMarkersRef.current[routeId].marker.remove();
          delete busMarkersRef.current[routeId];
        }
      });

      // --- DIBUJAR TRAYECTO (POLILÍNEA) Y PARADAS DE LA RUTA ENFOCADA ---
      // Limpiar paradas anteriores
      routeMarkersRef.current.forEach(m => m.remove());
      routeMarkersRef.current = [];

      const rawPoints = selectedRoute?.puntosProgramados || selectedRoute?.route?.puntosRuta || [];
      const sourceId = 'route-path-source';
      const layerId = 'route-path-layer';

      if (rawPoints.length > 0) {
        const pathCoords = rawPoints.map(p => [parseFloat(p.longitud), parseFloat(p.latitud)]);
        pathCoords.forEach(c => cameraCoords.push(c));

        // Actualizar o crear Source de GeoJSON
        const geojson = {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: pathCoords
          }
        };

        if (map.getSource(sourceId)) {
          map.getSource(sourceId).setData(geojson);
        } else {
          map.addSource(sourceId, {
            type: 'geojson',
            data: geojson
          });

          map.addLayer({
            id: layerId,
            type: 'line',
            source: sourceId,
            layout: {
              'line-join': 'round',
              'line-cap': 'round'
            },
            paint: {
              'line-color': '#10B981', // Verde esmeralda
              'line-width': 5,
              'line-opacity': 0.8
            }
          });
        }

        // Crear marcadores de Hito de Inicio (A) e Hito de Escuela (B)
        const startPt = pathCoords[0];
        const endPt = pathCoords[pathCoords.length - 1];

        // Inicio (A)
        const elStart = document.createElement('div');
        elStart.style.background = '#22C55E';
        elStart.style.color = 'white';
        elStart.style.padding = '4px 8px';
        elStart.style.borderRadius = '100px';
        elStart.style.fontSize = '10px';
        elStart.style.fontWeight = '700';
        elStart.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
        elStart.innerHTML = '🏁 Inicio (A)';
        const startMarker = new mapboxgl.Marker({ element: elStart, anchor: 'bottom' })
          .setLngLat(startPt)
          .addTo(map);
        routeMarkersRef.current.push(startMarker);

        // Fin (B)
        const elEnd = document.createElement('div');
        elEnd.style.background = '#EF4444';
        elEnd.style.color = 'white';
        elEnd.style.padding = '4px 8px';
        elEnd.style.borderRadius = '100px';
        elEnd.style.fontSize = '10px';
        elEnd.style.fontWeight = '700';
        elEnd.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
        elEnd.innerHTML = '🏫 Escuela (B)';
        const endMarker = new mapboxgl.Marker({ element: elEnd, anchor: 'bottom' })
          .setLngLat(endPt)
          .addTo(map);
        routeMarkersRef.current.push(endMarker);

        // Paradas intermedias
        pathCoords.slice(1, -1).forEach((pt, idx) => {
          const elStop = document.createElement('div');
          elStop.style.width = '10px';
          elStop.style.height = '10px';
          elStop.style.borderRadius = '50%';
          elStop.style.background = '#F59E0B';
          elStop.style.border = '2px solid white';
          elStop.style.boxShadow = '0 1px 3px rgba(0,0,0,0.2)';
          elStop.title = `Parada ${idx + 1}`;

          const stopMarker = new mapboxgl.Marker({ element: elStop, anchor: 'center' })
            .setLngLat(pt)
            .addTo(map);
          routeMarkersRef.current.push(stopMarker);
        });
      } else {
        // Si no hay ruta seleccionada, remover trayecto visual
        if (map.getLayer(layerId)) map.removeLayer(layerId);
        if (map.getSource(sourceId)) map.removeSource(sourceId);
      }

      // Enfocar cámara sobre los marcadores dibujados
      adjustCamera(cameraCoords);
    };

    // Asegurarse de que el estilo del mapa ya cargó antes de añadir capas y fuentes
    if (map.isStyleLoaded()) {
      runMapUpdates();
    } else {
      map.once('style.load', runMapUpdates);
    }

  }, [activeRoutes, selectedRoute]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: '400px' }}>
      <div 
        ref={mapContainerRef} 
        style={{ width: '100%', height: '100%', borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--color-border)' }}
      />
    </div>
  );
}
