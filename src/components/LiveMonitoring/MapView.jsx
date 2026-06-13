import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { FaBus, FaFlag, FaTimes, FaCompass } from 'react-icons/fa';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as turf from '@turf/turf';

// Clave Mapbox (Access Token)
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || 'pk.eyJ1IjoiZnJhbmNpc2NvMDgyIiwiYSI6ImNtcWI0eXJkMDBkZm0yc3F5bGNkMDdudW8ifQ.hUD-NrHEMSqRfWiNmJs6hA';
mapboxgl.accessToken = MAPBOX_TOKEN;

const apiBaseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');
const busModelUrl = `${apiBaseUrl}/public/bus.glb`;

// Consultar la API de Direcciones de Mapbox para obtener la geometría adaptada a calles reales
async function fetchStreetMatchedRoute(points) {
  if (points.length < 2) return points;
  try {
    const slicePoints = points.slice(0, 25);
    const waypoints = slicePoints.map(p => p.join(',')).join(';');
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${waypoints}?geometries=geojson&overview=full&access_token=${mapboxgl.accessToken}`;
    
    const response = await fetch(url);
    const data = await response.json();
    if (data.routes && data.routes.length > 0) {
      return data.routes[0].geometry.coordinates;
    }
  } catch (e) {
    console.error('Error fetching street matched route:', e);
  }
  return points; // Fallback
}

export default function MapView({ activeRoutes, selectedRoute, onSelectRoute }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  
  // Guardamos referencias para marcadores y capas para actualizarlos dinámicamente
  const busMarkersRef = useRef({});
  const routeMarkersRef = useRef([]);

  // Estados de control 3D y calles
  const [is3DActive, setIs3DActive] = useState(false);
  const [streetMatchedCoords, setStreetMatchedCoords] = useState([]);

  // Refs de apoyo para evitar closures obsoletos en WebGL
  const is3DActiveRef = useRef(is3DActive);
  const lastSelectedRouteCoordsRef = useRef(null);
  const lastSelectedRouteHeadingRef = useRef(0);
  const lastDeviationQueryRef = useRef(null);

  useEffect(() => {
    is3DActiveRef.current = is3DActive;
  }, [is3DActive]);

  // Si se limpia la ruta seleccionada, apagar modo 3D
  useEffect(() => {
    if (!selectedRoute) {
      setIs3DActive(false);
      const layer = customLayerRef.current;
      if (layer) {
        layer.currentModelLngLat = null;
        layer.targetModelLngLat = null;
      }
    }
  }, [selectedRoute]);

  // Consultar streets matching cuando cambie la ruta seleccionada
  useEffect(() => {
    if (!selectedRoute) {
      setStreetMatchedCoords([]);
      return;
    }
    const rawPoints = selectedRoute.puntosProgramados || selectedRoute.route?.puntosRuta || [];
    if (rawPoints.length < 2) {
      setStreetMatchedCoords(rawPoints.map(p => [parseFloat(p.longitud), parseFloat(p.latitud)]));
      return;
    }
    
    let isSubscribed = true;
    const fetchCoords = async () => {
      const pathCoords = rawPoints.map(p => [parseFloat(p.longitud), parseFloat(p.latitud)]);
      const matched = await fetchStreetMatchedRoute(pathCoords);
      if (isSubscribed) {
        setStreetMatchedCoords(matched);
      }
    };
    
    fetchCoords();
    return () => {
      isSubscribed = false;
    };
  }, [selectedRoute?.route?.id]);

  // Capa personalizada de Three.js para renderizar el autobús 3D
  const customLayerRef = useRef({
    id: '3d-model',
    type: 'custom',
    renderingMode: '3d',
    currentModelLngLat: null,
    targetModelLngLat: null,
    currentModelHeading: 0,
    targetModelHeading: 0,
    busModel: null,
    onAdd: function (mapInstance, gl) {
      this.camera = new THREE.Camera();
      this.scene = new THREE.Scene();

      // Configuración de luces
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
      this.scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight.position.set(0, -70, 100).normalize();
      this.scene.add(directionalLight);

      const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.5);
      directionalLight2.position.set(0, 70, 100).normalize();
      this.scene.add(directionalLight2);

      // Cargar el modelo del autobús 3D
      const loader = new GLTFLoader();
      loader.load(
        busModelUrl,
        (gltf) => {
          this.busModel = gltf.scene;
          this.busModel.scale.set(10, 10, 10);
          this.busModel.visible = is3DActiveRef.current;
          this.scene.add(this.busModel);
          console.log('3D Bus model loaded successfully in dashboard MapView');
          mapInstance.triggerRepaint();
        },
        undefined,
        (error) => {
          console.error('Error loading 3D model in MapView:', error);
        }
      );

      this.map = mapInstance;

      this.renderer = new THREE.WebGLRenderer({
        canvas: mapInstance.getCanvas(),
        context: gl,
        antialias: true
      });
      this.renderer.autoClear = false;
    },
    render: function (gl, matrix) {
      if (!this.busModel || !this.currentModelLngLat) return;

      // Forzar visibilidad sincronizada con el estado 3D
      this.busModel.visible = is3DActiveRef.current;

      let needsRepaint = false;
      const lerpFactor = 0.08;

      if (this.targetModelLngLat) {
        const deltaLng = this.targetModelLngLat[0] - this.currentModelLngLat[0];
        const deltaLat = this.targetModelLngLat[1] - this.currentModelLngLat[1];

        if (Math.abs(deltaLng) > 0.0000001 || Math.abs(deltaLat) > 0.0000001) {
          this.currentModelLngLat[0] += deltaLng * lerpFactor;
          this.currentModelLngLat[1] += deltaLat * lerpFactor;
          needsRepaint = true;
        } else {
          this.currentModelLngLat[0] = this.targetModelLngLat[0];
          this.currentModelLngLat[1] = this.targetModelLngLat[1];
        }

        let diffHeading = this.targetModelHeading - this.currentModelHeading;
        diffHeading = ((diffHeading + 180) % 360) - 180;
        if (diffHeading < -180) diffHeading += 360;

        if (Math.abs(diffHeading) > 0.1) {
          this.currentModelHeading += diffHeading * lerpFactor;
          this.currentModelHeading = (this.currentModelHeading + 360) % 360;
          needsRepaint = true;
        } else {
          this.currentModelHeading = this.targetModelHeading;
        }
      }

      const modelAsMercatorCoordinate = mapboxgl.MercatorCoordinate.fromLngLat(
        this.currentModelLngLat,
        0
      );

      const modelRotate = [Math.PI / 2, 0, 0];
      const rad = (this.currentModelHeading * Math.PI) / 180;

      const modelTransform = {
        translateX: modelAsMercatorCoordinate.x,
        translateY: modelAsMercatorCoordinate.y,
        translateZ: modelAsMercatorCoordinate.z,
        rotateX: modelRotate[0],
        rotateY: modelRotate[1],
        rotateZ: -rad,
        scale: modelAsMercatorCoordinate.meterInMercatorCoordinateUnits()
      };

      const rotationX = new THREE.Matrix4().makeRotationAxis(
        new THREE.Vector3(1, 0, 0),
        modelTransform.rotateX
      );
      const rotationY = new THREE.Matrix4().makeRotationAxis(
        new THREE.Vector3(0, 1, 0),
        modelTransform.rotateY
      );
      const rotationZ = new THREE.Matrix4().makeRotationAxis(
        new THREE.Vector3(0, 0, 1),
        modelTransform.rotateZ
      );

      const m = new THREE.Matrix4().fromArray(matrix);
      const l = new THREE.Matrix4()
        .makeTranslation(
          modelTransform.translateX,
          modelTransform.translateY,
          modelTransform.translateZ
        )
        .scale(
          new THREE.Vector3(
            modelTransform.scale,
            -modelTransform.scale,
            modelTransform.scale
          )
        )
        .multiply(rotationX)
        .multiply(rotationY)
        .multiply(rotationZ);

      this.camera.projectionMatrix = m.multiply(l);
      this.renderer.resetState();
      this.renderer.render(this.scene, this.camera);

      if (needsRepaint) {
        this.map.triggerRepaint();
      }
    },
    onRemove: function (map, gl) {
      if (this.renderer) {
        this.renderer.dispose();
      }
    }
  });

  // Sincronizar visibilidad de la capa 3D cuando cambie el estado
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    
    const layer = customLayerRef.current;
    if (layer && layer.busModel) {
      layer.busModel.visible = is3DActive;
      map.triggerRepaint();
    }

    // Ocultar o mostrar el marcador 2D del autobús seleccionado
    if (selectedRoute?.route?.id) {
      const selectedId = selectedRoute.route.id;
      const markerObj = busMarkersRef.current[selectedId];
      if (markerObj && markerObj.element) {
        markerObj.element.style.display = is3DActive ? 'none' : 'flex';
      }
    }
  }, [is3DActive, selectedRoute?.route?.id]);

  // Alternar vista 3D tipo Uber (cámara descentrada)
  const handleToggle3D = () => {
    setIs3DActive(prev => {
      const next = !prev;
      const map = mapInstanceRef.current;
      if (map && selectedRoute) {
        if (next) {
          const currentPoint = lastSelectedRouteCoordsRef.current;
          const heading = lastSelectedRouteHeadingRef.current || 0;
          if (currentPoint) {
            let cameraCenter = currentPoint;
            try {
              cameraCenter = turf.destination(
                turf.point(currentPoint),
                0.03, // 30 metros adelante
                heading,
                { units: 'kilometers' }
              ).geometry.coordinates;
            } catch (err) {
              console.error(err);
            }
            map.easeTo({
              pitch: 60,
              bearing: heading,
              center: cameraCenter,
              zoom: 17,
              duration: 1000
            });
          }
        } else {
          map.easeTo({
            pitch: 0,
            bearing: 0,
            duration: 1000
          });
          
          if (lastSelectedRouteCoordsRef.current && streetMatchedCoords.length > 0) {
            const bounds = new mapboxgl.LngLatBounds();
            bounds.extend(lastSelectedRouteCoordsRef.current);
            streetMatchedCoords.forEach(coord => bounds.extend(coord));
            map.fitBounds(bounds, { padding: 60, duration: 1200 });
          }
        }
      }
      return next;
    });
  };

  // 1. Inicializar el mapa
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/navigation-night-v1', // Estilo de mapa oscuro premium
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
      if (coords.length === 0 || is3DActiveRef.current) return; // No auto-ajustar en vista 3D
      const bounds = new mapboxgl.LngLatBounds();
      coords.forEach(coord => bounds.extend(coord));
      map.fitBounds(bounds, { padding: 60, duration: 1500 });
    };

    const runMapUpdates = () => {
      // Registrar capas adicionales si el estilo se cargó
      if (!map.getLayer('3d-buildings')) {
        const layers = map.getStyle().layers;
        const labelLayerId = layers.find(
          (layer) => layer.type === 'symbol' && layer.layout['text-field']
        )?.id;

        map.addLayer({
          'id': '3d-buildings',
          'source': 'composite',
          'source-layer': 'building',
          'filter': ['==', 'extrude', 'true'],
          'type': 'fill-extrusion',
          'minzoom': 15,
          'paint': {
            'fill-extrusion-color': '#4b5563', // Gris building elegante
            'fill-extrusion-height': [
              'interpolate',
              ['linear'],
              ['zoom'],
              15,
              0,
              15.05,
              ['get', 'height']
            ],
            'fill-extrusion-base': [
              'interpolate',
              ['linear'],
              ['zoom'],
              15,
              0,
              15.05,
              ['get', 'min_height']
            ],
            'fill-extrusion-opacity': 0.5
          }
        }, labelLayerId);
      }

      if (!map.getSource('alternative-route')) {
        map.addSource('alternative-route', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: []
          }
        });
      }

      if (!map.getLayer('alternative-route')) {
        map.addLayer({
          id: 'alternative-route',
          type: 'line',
          source: 'alternative-route',
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': '#F59E0B',
            'line-width': 5,
            'line-dasharray': [2, 2],
            'line-opacity': 0.9
          }
        });
      }

      if (!map.getLayer('3d-model')) {
        map.addLayer(customLayerRef.current);
      }

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
        const show2D = !isSelected || !is3DActiveRef.current;

        // Si el marcador ya existe, actualizar su posición
        if (busMarkersRef.current[routeId]) {
          const markerObj = busMarkersRef.current[routeId];
          markerObj.marker.setLngLat([lng, lat]);
          
          const element = markerObj.element;
          const iconDiv = element.querySelector('.bus-icon-wrapper');
          if (iconDiv) {
            iconDiv.style.backgroundColor = isSelected ? '#EF4444' : '#2563EB';
          }
          element.style.display = show2D ? 'flex' : 'none';
        } else {
          // Crear elemento DOM personalizado para el marcador
          const el = document.createElement('div');
          el.className = 'custom-mapbox-marker';
          el.style.display = show2D ? 'flex' : 'none';
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
      routeMarkersRef.current.forEach(m => m.remove());
      routeMarkersRef.current = [];

      const rawPoints = selectedRoute?.puntosProgramados || selectedRoute?.route?.puntosRuta || [];
      const sourceId = 'route-path-source';
      const layerId = 'route-path-layer';

      if (rawPoints.length > 0) {
        const pathCoords = rawPoints.map(p => [parseFloat(p.longitud), parseFloat(p.latitud)]);
        const lineCoords = streetMatchedCoords.length > 0 ? streetMatchedCoords : pathCoords;
        lineCoords.forEach(c => cameraCoords.push(c));

        // Actualizar o crear Source de GeoJSON
        const geojson = {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: lineCoords
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

        // --- MANEJAR TELEMETRÍA 3D Y CÁLCULO DE DESVÍOS ---
        const selectedActive = activeRoutes.find(r => r.route?.id === selectedRoute.route?.id);
        if (selectedActive?.ultimaUbicacion?.latitud) {
          const selectedLng = parseFloat(selectedActive.ultimaUbicacion.longitud);
          const selectedLat = parseFloat(selectedActive.ultimaUbicacion.latitud);
          const currentPoint = [selectedLng, selectedLat];

          // 1. Calcular rumbo dinámico
          const prevPoint = lastSelectedRouteCoordsRef.current;
          let heading = lastSelectedRouteHeadingRef.current || 0;
          if (prevPoint && (prevPoint[0] !== selectedLng || prevPoint[1] !== selectedLat)) {
            try {
              const p1 = turf.point(prevPoint);
              const p2 = turf.point(currentPoint);
              let calculatedBearing = turf.bearing(p1, p2);
              if (calculatedBearing < 0) {
                calculatedBearing += 360;
              }
              heading = calculatedBearing;
            } catch (e) {
              console.error('Error calculating heading:', e);
            }
          }
          lastSelectedRouteCoordsRef.current = currentPoint;
          lastSelectedRouteHeadingRef.current = heading;

          // 2. Actualizar objetivo de la capa 3D
          const layer = customLayerRef.current;
          if (layer) {
            if (!layer.currentModelLngLat) {
              layer.currentModelLngLat = [...currentPoint];
              layer.currentModelHeading = heading;
            }
            layer.targetModelLngLat = [...currentPoint];
            layer.targetModelHeading = heading;
            map.triggerRepaint();
          }

          // 3. Controlar la cámara Uber si Modo 3D está activo
          if (is3DActiveRef.current) {
            let cameraCenter = currentPoint;
            try {
              cameraCenter = turf.destination(
                turf.point(currentPoint),
                0.03, // 30 metros adelante
                heading,
                { units: 'kilometers' }
              ).geometry.coordinates;
            } catch (err) {
              console.error(err);
            }
            map.easeTo({
              center: cameraCenter,
              bearing: heading,
              pitch: 60,
              zoom: 17,
              duration: 1000
            });
          }

          // 4. Evaluar desviación del camino vial oficial
          const officialCoords = streetMatchedCoords.length > 0 ? streetMatchedCoords : pathCoords;
          if (officialCoords.length >= 2) {
            try {
              const currentPt = turf.point(currentPoint);
              const pathLine = turf.lineString(officialCoords);
              const distanceMeters = turf.pointToLineDistance(currentPt, pathLine, { units: 'meters' });

              if (distanceMeters > 100) {
                const destination = officialCoords[officialCoords.length - 1];
                const lastQueryKey = `${currentPoint.join(',')};${destination.join(',')}`;

                if (lastDeviationQueryRef.current !== lastQueryKey) {
                  lastDeviationQueryRef.current = lastQueryKey;
                  const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${currentPoint.join(',')};${destination.join(',')}?geometries=geojson&overview=full&access_token=${mapboxgl.accessToken}`;
                  
                  fetch(url)
                    .then(res => res.json())
                    .then(data => {
                      if (data.routes && data.routes.length > 0) {
                        const alternativeCoords = data.routes[0].geometry.coordinates;
                        if (map.getSource('alternative-route')) {
                          map.getSource('alternative-route').setData({
                            type: 'Feature',
                            properties: {},
                            geometry: {
                              type: 'LineString',
                              coordinates: alternativeCoords
                            }
                          });
                        }
                      }
                    })
                    .catch(err => console.error(err));
                }
              } else {
                lastDeviationQueryRef.current = null;
                if (map.getSource('alternative-route')) {
                  map.getSource('alternative-route').setData({
                    type: 'FeatureCollection',
                    features: []
                  });
                }
              }
            } catch (err) {
              console.error(err);
            }
          }
        }
      } else {
        // Limpiar trayectos e incidencias si no hay ruta seleccionada
        if (map.getLayer(layerId)) map.removeLayer(layerId);
        if (map.getSource(sourceId)) map.removeSource(sourceId);
        lastSelectedRouteCoordsRef.current = null;
        lastSelectedRouteHeadingRef.current = 0;
        lastDeviationQueryRef.current = null;

        if (map.getSource('alternative-route')) {
          map.getSource('alternative-route').setData({
            type: 'FeatureCollection',
            features: []
          });
        }
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

  }, [activeRoutes, selectedRoute, streetMatchedCoords]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: '400px' }}>
      <div 
        ref={mapContainerRef} 
        style={{ width: '100%', height: '100%', borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--color-border)' }}
      />
      
      {/* Botón flotante para alternar vista 3D */}
      {selectedRoute && (
        <button
          onClick={handleToggle3D}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            borderRadius: '20px',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: '700',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            backgroundColor: is3DActive ? '#10B981' : 'rgba(15, 23, 42, 0.95)',
            color: '#ffffff'
          }}
          title={is3DActive ? "Desactivar vista 3D tipo Uber" : "Activar vista 3D tipo Uber"}
        >
          <FaCompass 
            style={{ 
              fontSize: '16px',
              transition: 'transform 0.5s ease',
              transform: is3DActive ? 'rotate(45deg)' : 'none'
            }} 
          />
          <span>{is3DActive ? 'Vista 2D' : 'Vista 3D Uber'}</span>
        </button>
      )}
    </div>
  );
}
