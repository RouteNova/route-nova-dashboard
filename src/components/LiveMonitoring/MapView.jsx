import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { FaBus, FaFlag, FaTimes, FaCompass, FaRoute, FaUserTie, FaGraduationCap } from 'react-icons/fa';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as turf from '@turf/turf';

// Clave Mapbox (Access Token)
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN || 'pk.eyJ1IjoiZnJhbmNpc2NvMDgyIiwiYSI6ImNtcWI0eXJkMDBkZm0yc3F5bGNkMDdudW8ifQ.hUD-NrHEMSqRfWiNmJs6hA';
mapboxgl.accessToken = MAPBOX_TOKEN;

const apiBaseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');
const busModelUrl = `${apiBaseUrl}/public/bus.glb`;

// Colores para dibujar múltiples rutas en curso
const ROUTE_COLORS = [
  '#3B82F6', // Azul
  '#10B981', // Verde esmeralda
  '#F59E0B', // Amarillo/Ambar
  '#EF4444', // Rojo/Carmesí
  '#EC4899', // Rosa/Magenta
  '#8B5CF6', // Violeta/Morado
  '#06B6D4', // Cian
  '#F97316', // Naranja
  '#14B8A6', // Teal
  '#6366F1'  // Indigo
];

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

export default function MapView({ activeRoutes, selectedRoute, onSelectRoute, onClose }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  
  // Guardamos referencias para marcadores y capas para actualizarlos dinámicamente
  const busMarkersRef = useRef({});
  const routeMarkersRef = useRef([]);

  // Estados de control 3D y calles
  const [is3DActive, setIs3DActive] = useState(false);
  const [streetMatchedCoords, setStreetMatchedCoords] = useState([]);
  const [showAllRoutes, setShowAllRoutes] = useState(true);
  const [currentSpeed, setCurrentSpeed] = useState(0);

  // Refs de apoyo para evitar closures obsoletos en WebGL
  const is3DActiveRef = useRef(is3DActive);
  const lastSelectedRouteCoordsRef = useRef(null);
  const lastSelectedRouteHeadingRef = useRef(0);
  const lastDeviationQueryRef = useRef(null);
  const lastLocationTimestampRef = useRef(Date.now());

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

          // Cambiar color del autobús de azul a amarillo escolar modificando los píxeles de la textura
          this.busModel.traverse((child) => {
            if (child.isMesh && child.material) {
              const materials = Array.isArray(child.material) ? child.material : [child.material];
              materials.forEach(mat => {
                if (mat.map && mat.map.image) {
                  const img = mat.map.image;
                  try {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width || img.naturalWidth || 128;
                    canvas.height = img.height || img.naturalHeight || 128;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0);

                    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const data = imgData.data;

                    let hasBlue = false;
                    for (let i = 0; i < data.length; i += 4) {
                      const r = data[i];
                      const g = data[i+1];
                      const b = data[i+2];

                      // Detectar azul predominante en la paleta
                      if (b > r * 1.3 && b > g * 1.1) {
                        // Cambiar a amarillo escolar (#FFB300 -> R:255, G:179, B:0)
                        data[i] = 255;
                        data[i+1] = 179;
                        data[i+2] = 0;
                        hasBlue = true;
                      }
                    }

                    if (hasBlue) {
                      ctx.putImageData(imgData, 0, 0);
                      const newTexture = new THREE.CanvasTexture(canvas);
                      newTexture.wrapS = mat.map.wrapS;
                      newTexture.wrapT = mat.map.wrapT;
                      newTexture.flipY = mat.map.flipY;
                      mat.map = newTexture;
                      mat.needsUpdate = true;
                    }
                  } catch (e) {
                    console.error('Error modifying texture canvas in MapView:', e);
                  }
                }
              });
            }
          });

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

      const modelTransform = {
        translateX: modelAsMercatorCoordinate.x,
        translateY: modelAsMercatorCoordinate.y,
        translateZ: modelAsMercatorCoordinate.z,
        rotateX: modelRotate[0],
        rotateY: modelRotate[1],
        rotateZ: modelRotate[2],
        scale: modelAsMercatorCoordinate.meterInMercatorCoordinateUnits()
      };

      if (this.busModel) {
        const scale = modelTransform.scale * 3;
        this.busModel.scale.set(scale, scale, scale);
        this.busModel.rotation.y = THREE.MathUtils.degToRad(-this.currentModelHeading) + Math.PI;
      }

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
            1,
            -1,
            1
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
      if (map) {
        if (next) {
          if (selectedRoute) {
            const currentPoint = lastSelectedRouteCoordsRef.current;
            const heading = lastSelectedRouteHeadingRef.current || 0;
            if (currentPoint) {
              let cameraCenter = currentPoint;
              try {
                cameraCenter = turf.destination(
                  turf.point(currentPoint),
                  0.05, // 50 metros adelante
                  heading,
                  { units: 'kilometers' }
                ).geometry.coordinates;
              } catch (err) {
                console.error(err);
              }
              map.easeTo({
                pitch: 65,
                bearing: heading,
                center: cameraCenter,
                zoom: 18,
                duration: 1000
              });
            }
          } else {
            // Sin ruta seleccionada: inclinar el mapa globalmente para ver edificios 3D
            map.easeTo({
              pitch: 50,
              bearing: -10,
              zoom: map.getZoom() < 13 ? 14 : map.getZoom(),
              duration: 1000
            });
          }
        } else {
          map.easeTo({
            pitch: 0,
            bearing: 0,
            duration: 1000
          });
          
          if (selectedRoute && lastSelectedRouteCoordsRef.current && streetMatchedCoords.length > 0) {
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

      // Fuente y Capa para Geocercas de Paradas
      if (!map.getSource('geofence-stops-source')) {
        map.addSource('geofence-stops-source', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [] }
        });
      }
      if (!map.getLayer('geofence-stops-layer')) {
        map.addLayer({
          id: 'geofence-stops-layer',
          type: 'circle',
          source: 'geofence-stops-source',
          paint: {
            'circle-radius': ['interpolate', ['linear'], ['zoom'], 10, 8, 15, 25, 18, 65],
            'circle-color': ['get', 'color'],
            'circle-opacity': 0.18,
            'circle-stroke-width': 2,
            'circle-stroke-color': ['get', 'strokeColor']
          }
        });
      }

      // Fuente y Capa para Radar de Proximidad del Autobús
      if (!map.getSource('bus-radar-source')) {
        map.addSource('bus-radar-source', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [] }
        });
      }
      if (!map.getLayer('bus-radar-layer')) {
        map.addLayer({
          id: 'bus-radar-layer',
          type: 'circle',
          source: 'bus-radar-source',
          paint: {
            'circle-radius': ['interpolate', ['linear'], ['zoom'], 10, 12, 15, 38, 18, 110],
            'circle-color': '#10B981',
            'circle-opacity': 0.12,
            'circle-stroke-width': 2,
            'circle-stroke-color': '#059669',
            'circle-stroke-opacity': 0.6
          }
        });
      }

      // --- DIBUJAR TODAS LAS RUTAS SI EL MODO MULTI-RUTA ESTÁ ACTIVO ---
      const allRoutesSourceId = 'all-routes-source';
      const allRoutesLayerId = 'all-routes-layer';

      if (showAllRoutes && activeRoutes.length > 0) {
        const geojson = {
          type: 'FeatureCollection',
          features: activeRoutes.map((r, index) => {
            const rawPoints = r.puntosProgramados || r.route?.puntosRuta || [];
            const pathCoords = rawPoints.map(p => [parseFloat(p.longitud), parseFloat(p.latitud)]);
            const color = ROUTE_COLORS[index % ROUTE_COLORS.length];
            return {
              type: 'Feature',
              properties: {
                routeId: r.route?.id,
                color: color,
                nombre: r.route?.nombre
              },
              geometry: {
                type: 'LineString',
                coordinates: pathCoords
              }
            };
          }).filter(f => f.geometry.coordinates.length > 0)
        };

        if (map.getSource(allRoutesSourceId)) {
          map.getSource(allRoutesSourceId).setData(geojson);
        } else {
          map.addSource(allRoutesSourceId, {
            type: 'geojson',
            data: geojson
          });

          map.addLayer({
            id: allRoutesLayerId,
            type: 'line',
            source: allRoutesSourceId,
            layout: {
              'line-join': 'round',
              'line-cap': 'round'
            },
            paint: {
              'line-color': ['get', 'color'],
              'line-width': 4,
              'line-opacity': 0.75
            }
          });
        }
      } else {
        // Limpiar capa multi-ruta si está desactivada o no hay rutas
        if (map.getLayer(allRoutesLayerId)) map.removeLayer(allRoutesLayerId);
        if (map.getSource(allRoutesSourceId)) map.removeSource(allRoutesSourceId);
      }

      if (!map.getLayer('3d-model')) {
        map.addLayer(customLayerRef.current);
        map.on('rotate', () => {
          const layer = customLayerRef.current;
          if (layer && layer.busModel) {
            layer.busModel.rotation.y = THREE.MathUtils.degToRad(-map.getBearing()) + Math.PI;
          }
        });
      }

      // --- TRANSICIONES Y ACTUALIZACIÓN DE AUTOBUSES ---
      const activeIds = new Set();
      const cameraCoords = [];

      activeRoutes.forEach((r, index) => {
        if (!r.ultimaUbicacion?.latitud || !r.ultimaUbicacion?.longitud) return;

        const routeId = r.route.id;
        activeIds.add(routeId);

        const lng = parseFloat(r.ultimaUbicacion.longitud);
        const lat = parseFloat(r.ultimaUbicacion.latitud);
        cameraCoords.push([lng, lat]);

        const isSelected = selectedRoute && selectedRoute.route?.id === routeId;
        const show2D = !isSelected || !is3DActiveRef.current;

        const routeColor = ROUTE_COLORS[index % ROUTE_COLORS.length];
        const markerBgColor = showAllRoutes ? routeColor : (isSelected ? '#EF4444' : '#2563EB');

        // Si el marcador ya existe, actualizar su posición
        if (busMarkersRef.current[routeId]) {
          const markerObj = busMarkersRef.current[routeId];
          markerObj.marker.setLngLat([lng, lat]);
          
          const element = markerObj.element;
          const iconDiv = element.querySelector('.bus-icon-wrapper');
          if (iconDiv) {
            iconDiv.style.backgroundColor = markerBgColor;
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
              background-color: ${markerBgColor};
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

      const rawPoints = selectedRoute?.puntosProgramados || selectedRoute?.route?.puntosRuta || selectedRoute?.puntosRuta || [];
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

        // Actualizar geocercas en paradas
        const geofenceFeatures = pathCoords.map((pt) => {
          let isNearBus = false;
          if (lastSelectedRouteCoordsRef.current) {
            try {
              const dist = turf.distance(
                turf.point(pt),
                turf.point(lastSelectedRouteCoordsRef.current),
                { units: 'meters' }
              );
              if (dist <= 200) isNearBus = true;
            } catch (e) {}
          }
          return {
            type: 'Feature',
            geometry: { type: 'Point', coordinates: pt },
            properties: {
              color: isNearBus ? 'rgba(16, 185, 129, 0.35)' : 'rgba(59, 130, 246, 0.15)',
              strokeColor: isNearBus ? '#10B981' : '#3B82F6'
            }
          };
        });

        if (map.getSource('geofence-stops-source')) {
          map.getSource('geofence-stops-source').setData({
            type: 'FeatureCollection',
            features: geofenceFeatures
          });
        }

        // --- MANEJAR TELEMETRÍA 3D Y CÁLCULO DE DESVÍOS ---
        const selectedActive = activeRoutes.find(r => r.route?.id === selectedRoute.route?.id);

        if (selectedActive?.ultimaUbicacion?.latitud) {
          const selectedLng = parseFloat(selectedActive.ultimaUbicacion.longitud);
          const selectedLat = parseFloat(selectedActive.ultimaUbicacion.latitud);
          const currentPoint = [selectedLng, selectedLat];

          // Actualizar radar de posición del autobús
          if (map.getSource('bus-radar-source')) {
            map.getSource('bus-radar-source').setData({
              type: 'FeatureCollection',
              features: [{
                type: 'Feature',
                geometry: { type: 'Point', coordinates: currentPoint }
              }]
            });
          }

          // 1. Calcular rumbo dinámico y velocidad real basada en distancia y tiempo
          const now = Date.now();
          const timeDeltaSec = (now - lastLocationTimestampRef.current) / 1000;
          lastLocationTimestampRef.current = now;

          const prevPoint = lastSelectedRouteCoordsRef.current;
          let heading = lastSelectedRouteHeadingRef.current || 0;
          let displacementHeading = heading;
          if (prevPoint && (prevPoint[0] !== selectedLng || prevPoint[1] !== selectedLat)) {
            try {
              const p1 = turf.point(prevPoint);
              const p2 = turf.point(currentPoint);
              const distanceMovedMeters = turf.distance(p1, p2, { units: 'kilometers' }) * 1000;
              if (distanceMovedMeters > 0.2) {
                let calculatedBearing = turf.bearing(p1, p2);
                if (calculatedBearing < 0) {
                  calculatedBearing += 360;
                }
                displacementHeading = calculatedBearing;
                const effectiveTimeDelta = (timeDeltaSec > 0.05 && timeDeltaSec < 10) ? timeDeltaSec : 0.5;
                const calcSpeed = Math.round((distanceMovedMeters / effectiveTimeDelta) * 3.6);
                setCurrentSpeed(calcSpeed);
              } else {
                setCurrentSpeed(0);
              }
            } catch (e) {
              console.error('Error calculating heading & speed:', e);
            }
          }

          // Preferir la dirección de la calle/ruta para mantener el bus orientado en el sentido de la vía (un poco de preferencia, blend = 0.35)
          let finalHeading = displacementHeading;
          const officialCoords = streetMatchedCoords.length > 0 ? streetMatchedCoords : (rawPoints.map(p => [parseFloat(p.longitud), parseFloat(p.latitud)]));
          if (officialCoords.length >= 2) {
            try {
              const snapped = turf.nearestPointOnLine(turf.lineString(officialCoords), turf.point(currentPoint));
              const index = snapped.properties.index;
              if (index !== undefined && index < officialCoords.length - 1) {
                const p1 = turf.point(officialCoords[index]);
                const p2 = turf.point(officialCoords[index + 1]);
                let routeSegmentHeading = turf.bearing(p1, p2);
                if (routeSegmentHeading < 0) {
                  routeSegmentHeading += 360;
                }

                const distanceMeters = turf.pointToLineDistance(turf.point(currentPoint), turf.lineString(officialCoords), { units: 'meters' });
                if (distanceMeters <= 50) {
                  // Blend: preferir 35% la dirección de la ruta y 65% la dirección del desplazamiento
                  let diff = routeSegmentHeading - displacementHeading;
                  diff = ((diff + 180) % 360) - 180;
                  if (Math.abs(diff) <= 90) {
                    finalHeading = displacementHeading + diff * 0.35;
                  }
                }
              }
            } catch (e) {
              console.error('Error matching heading to route segment in MapView:', e);
            }
          }

          heading = finalHeading;
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
                0.05, // 50 metros adelante
                heading,
                { units: 'kilometers' }
              ).geometry.coordinates;
            } catch (err) {
              console.error(err);
            }
            map.easeTo({
              center: cameraCenter,
              bearing: heading,
              pitch: 65,
              zoom: 18,
              duration: 2500
            });
          }

          // 4. Evaluar desviación del camino vial oficial
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

        if (map.getSource('geofence-stops-source')) {
          map.getSource('geofence-stops-source').setData({
            type: 'FeatureCollection',
            features: []
          });
        }

        if (map.getSource('bus-radar-source')) {
          map.getSource('bus-radar-source').setData({
            type: 'FeatureCollection',
            features: []
          });
        }
      }

      // Si el modo multi-ruta está activo y no hay ruta seleccionada, englobar todos los puntos de todas las rutas activas
      if (showAllRoutes && !selectedRoute) {
        activeRoutes.forEach(r => {
          const rawPoints = r.puntosProgramados || r.route?.puntosRuta || [];
          rawPoints.forEach(p => {
            cameraCoords.push([parseFloat(p.longitud), parseFloat(p.latitud)]);
          });
        });
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

  }, [activeRoutes, selectedRoute, streetMatchedCoords, showAllRoutes]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: '400px' }}>
      <div 
        ref={mapContainerRef} 
        style={{ width: '100%', height: '100%', borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--color-border)' }}
      />
      
      {/* Controles flotantes del mapa */}
      {activeRoutes.length > 0 && (
        <div style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          {/* Botón Ver todas las rutas */}
          <button
            onClick={() => setShowAllRoutes(prev => !prev)}
            style={{
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
              backgroundColor: showAllRoutes ? '#3B82F6' : 'rgba(15, 23, 42, 0.95)',
              color: '#ffffff'
            }}
            title={showAllRoutes ? "Ver solo ruta seleccionada" : "Ver todas las rutas a la vez"}
          >
            <FaRoute style={{ fontSize: '16px' }} />
            <span>{showAllRoutes ? 'Ver Individual' : 'Ver Todas las Rutas'}</span>
          </button>

          {/* Botón flotante para alternar vista 3D */}
          <button
            onClick={handleToggle3D}
            style={{
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
        </div>
      )}

      {/* HUD TELEMETRÍA Y DETALLE DE RUTA EN VIVO */}
      {selectedRoute && (() => {
        const isRouteActive = (selectedRoute.estado === 'en_curso' || selectedRoute.route?.estado === 'en_curso');
        const busName = selectedRoute.autobus?.nombre || selectedRoute.autobus?.modelo || selectedRoute.autobusId?.nombre || selectedRoute.autobusId?.modelo || 'Autobús';
        const busCode = selectedRoute.autobus?.codigo || selectedRoute.autobus?.patente || selectedRoute.autobusId?.codigo || selectedRoute.autobusId?.patente || 'S/C';
        const driverName = selectedRoute.conductor?.nombre || selectedRoute.conductorId?.nombre || selectedRoute.conductorId?.usuarioId?.nombre || 'Sin asignar';
        const stats = selectedRoute.estudiantesStats || {};
        const esperandoCount = stats.esperando ?? 0;
        const aBordoCount = stats.aBordo ?? 0;
        const completadoCount = stats.descendidos ?? stats.completado ?? 0;

        const getEtaDisplay = () => {
          if (!isRouteActive) return 'Sin iniciar';
          const val = selectedRoute.eta ?? selectedRoute.route?.eta;
          if (val !== undefined && val !== null && val !== '') {
            if (val === 0) return '< 1 min';
            return `${val} min`;
          }
          return 'Calculando...';
        };

        const getDistanceDisplay = () => {
          const d = selectedRoute.distanciaRestante ?? selectedRoute.route?.distanciaRestante;
          if (d !== undefined && d !== null && d !== '') {
            return `${d} km`;
          }
          const totalD = selectedRoute.distanciaTotal ?? selectedRoute.route?.distanciaTotal;
          if (totalD !== undefined && totalD !== null && totalD !== '') {
            return `${totalD} km`;
          }
          return 'N/D';
        };

        return (
          <div 
            className="glass-panel animate-fade-in"
            style={{
              position: 'absolute',
              bottom: '20px',
              left: '20px',
              zIndex: 10,
              padding: '14px 16px',
              maxWidth: '330px',
              width: 'calc(100% - 40px)',
              background: 'rgba(15, 23, 42, 0.92)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.45)',
              color: '#ffffff',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}
          >
            {/* Cabecera del HUD con botón Ocultar/Cerrar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ overflow: 'hidden', flex: 1, paddingRight: '6px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: '800', margin: 0, color: '#fff', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                  <FaRoute style={{ color: 'var(--color-primary)' }} /> {selectedRoute.nombre || selectedRoute.route?.nombre || 'Ruta Escolar'}
                </h4>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', display: 'block', marginTop: '2px' }}>
                  <FaBus style={{ fontSize: '10px', marginRight: '4px', color: '#3B82F6' }} />
                  {busName} - {busCode}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className={`status-badge ${isRouteActive ? 'active' : ''}`} style={{ fontSize: '10px', whiteSpace: 'nowrap' }}>
                  {isRouteActive ? 'EN CURSO' : 'SIN INICIAR'}
                </span>
                {onClose && (
                  <button 
                    onClick={onClose}
                    style={{
                      background: 'rgba(255, 255, 255, 0.12)',
                      border: 'none',
                      color: 'rgba(255, 255, 255, 0.85)',
                      borderRadius: '50%',
                      width: '22px',
                      height: '22px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      fontSize: '11px',
                      transition: 'all 0.2s ease',
                      marginLeft: '2px'
                    }}
                    title="Ocultar tarjeta"
                  >
                    <FaTimes />
                  </button>
                )}
              </div>
            </div>

            {/* Conductor */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: 'rgba(255,255,255,0.85)', background: 'rgba(255,255,255,0.03)', padding: '6px 10px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <FaUserTie style={{ color: '#3B82F6', fontSize: '12px' }} />
              <span>Conductor: <strong>{driverName}</strong></span>
            </div>

            {/* Estado de Abordaje */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: 'var(--radius-md)',
              padding: '8px 10px',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              <div style={{ fontSize: '10px', fontWeight: '700', color: 'rgba(255, 255, 255, 0.65)', display: 'flex', alignItems: 'center', gap: '5px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                <FaGraduationCap style={{ color: '#8B5CF6' }} /> Estado de Abordaje
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', textAlign: 'center' }}>
                <div style={{ background: 'rgba(0, 0, 0, 0.25)', padding: '4px', borderRadius: '4px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <div style={{ fontSize: '14px', fontWeight: '800', color: '#60A5FA' }}>{esperandoCount}</div>
                  <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.6)', fontWeight: '600' }}>Esperando</div>
                </div>
                <div style={{ background: 'rgba(0, 0, 0, 0.25)', padding: '4px', borderRadius: '4px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <div style={{ fontSize: '14px', fontWeight: '800', color: '#A78BFA' }}>{aBordoCount}</div>
                  <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.6)', fontWeight: '600' }}>A Bordo</div>
                </div>
                <div style={{ background: 'rgba(0, 0, 0, 0.25)', padding: '4px', borderRadius: '4px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <div style={{ fontSize: '14px', fontWeight: '800', color: '#34D399' }}>{completadoCount}</div>
                  <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.6)', fontWeight: '600' }}>Completado</div>
                </div>
              </div>
            </div>

            {/* Velocímetro e Indicadores principales */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.06)' }}>
              {/* Velocímetro */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRight: '1px solid rgba(255,255,255,0.1)', paddingRight: '6px' }}>
                <span style={{ fontSize: '9.5px', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '700' }}>Velocidad</span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px', margin: '2px 0' }}>
                  <span style={{ fontSize: '22px', fontWeight: '900', color: (isRouteActive && currentSpeed > 45) ? '#EF4444' : '#10B981', fontFamily: 'monospace' }}>
                    {isRouteActive ? currentSpeed : 0}
                  </span>
                  <span style={{ fontSize: '10px', fontWeight: '700', color: 'rgba(255,255,255,0.6)' }}>km/h</span>
                </div>
                <span style={{ fontSize: '9px', color: isRouteActive ? (currentSpeed > 3 ? '#10B981' : '#F59E0B') : 'rgba(255,255,255,0.4)', fontWeight: '700' }}>
                  {isRouteActive ? (currentSpeed > 3 ? '🟢 En Movimiento' : '🟡 En Parada') : '💤 Detenido'}
                </span>
              </div>

              {/* ETA y Distancia */}
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '6px', paddingLeft: '4px' }}>
                <div>
                  <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.5)', display: 'block', textTransform: 'uppercase', fontWeight: '700' }}>Tiempo Estimado</span>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: isRouteActive ? '#fff' : 'rgba(255,255,255,0.6)' }}>
                    {getEtaDisplay()}
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.5)', display: 'block', textTransform: 'uppercase', fontWeight: '700' }}>Dist. Restante</span>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--color-primary)' }}>
                    {getDistanceDisplay()}
                  </span>
                </div>
              </div>
            </div>

            {/* Pie del HUD - Geocerca y Paradas */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10px', color: 'rgba(255,255,255,0.65)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10B981', display: 'inline-block', boxShadow: '0 0 6px #10B981' }}></span>
                Geocerca: <b style={{ color: '#fff' }}>150m (Seguridad)</b>
              </span>
              <span>
                Paradas: <b style={{ color: '#fff' }}>{(selectedRoute.puntosProgramados || selectedRoute.route?.puntosRuta || selectedRoute.puntosRuta || []).length}</b>
              </span>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
