# RouteNova Dashboard — Panel Web de Administración y Monitoreo

Panel web interactivo para la gestión y monitoreo en tiempo real del transporte escolar **RouteNova**, desarrollado con React 19 y Vite. Ofrece telemetría en vivo, visualización geoespacial con Mapbox GL, modelo 3D de autobús escolar en Three.js, gestión de flota, estudiantes y reporte de incidencias.

---

## 🛠️ Stack Tecnológico

- **Framework**: React 19 con React Router DOM v7.
- **Herramienta de Construcción**: Vite 8 con Hot Module Replacement (HMR).
- **Mapas y Geoespacial**:
  - Mapbox GL JS v3.
  - Turf.js para cálculos geométricos y polígonos de geovalla.
  - Segmentación automática de rutas largas (evitando la limitación de 25 waypoints de Mapbox Directions API).
- **Gráficos 3D**: Three.js para renderizado interactivo del modelo del autobús.
- **Estilos y Componentes**: CSS moderno, React Icons y gráficos analíticos con Recharts.
- **Comunicación en Tiempo Real**: Socket.IO Client v4.
- **Reportes**: Exportación de reportes tabulares con `xlsx` y PDF con `jspdf`/`html2canvas`.

---

## 🚀 Inicio Rápido Local

### 1. Requisitos Previos
- Node.js >= 20.0.0
- npm >= 10.0.0

### 2. Instalación de Dependencias
```bash
npm install
```

### 3. Configuración de Variables de Entorno
Copia el archivo `.env.example`:
```bash
cp .env.example .env
```

Contenido del archivo:
```ini
# URL de la API del Backend de RouteNova
VITE_API_URL=http://localhost:5000/api

# Nombre visible en la barra de navegación
VITE_APP_NAME=RouteNova Dashboard

# Token de acceso público a Mapbox GL
VITE_MAPBOX_ACCESS_TOKEN=pk.tu_token_mapbox_aqui
```

### 4. Ejecución en Desarrollo
```bash
npm run dev
```
La aplicación estará disponible de forma predeterminada en `http://localhost:5173`.

### 5. Compilación para Producción
```bash
npm run build
```
Genera la carpeta `dist/` optimizada para despliegue estático (CloudFront, S3, Nginx o Netlify/Vercel).

---

## 🖥️ Módulos y Funcionalidades

1. **Monitoreo en Vivo (Live Monitoring)**:
   - Seguimiento en tiempo real de unidades activas mediante WebSocket.
   - Cálculo dinámico de ETA y distancia restante.
   - Detección visual de desvío de ruta y paradas completadas.
2. **Gestión de Rutas Escolares**:
   - Creación y edición de trazados con waypoints ilimitados mediante chunking geoespacial de 24 puntos.
   - Asignación de conductor y vehículo de transporte.
3. **Gestión de Estudiantes y Tutores**:
   - Registro de alumnos con vinculación a rutas escolares y tutores legales.
   - Generación de carnets con códigos QR para el escaneo de abordaje.
4. **Centro de Incidencias**:
   - Recepción en tiempo real de alertas de tráfico, averías mecánicas y emergencias reportadas por conductores.
   - Gestión de estados de resolución (`reported`, `in_progress`, `resolved`).
