import React, { useState, useEffect, useRef } from 'react';
import { routeService, incidentService, eventService } from '../services/api';
import ReportCard from '../components/reports/ReportCard';
import ReportFilters from '../components/reports/ReportFilters';
import ReportViewer from '../components/reports/ReportViewer';
import ExportButtons from '../components/reports/ExportButtons';

// Mocks realistas para demostración e interactividad offline
const getMockData = () => {
  const today = new Date();
  const formatTime = (daysAgo, hours, minutes) => {
    const d = new Date(today);
    d.setDate(d.getDate() - daysAgo);
    d.setHours(hours, minutes, 0, 0);
    return d.toISOString();
  };

  const mockEvents = [
    // Día 0 (Hoy)
    {
      _id: "evt001",
      type: "student_boarded",
      createdAt: formatTime(0, 7, 15),
      route: { _id: "route1", nombre: "Ruta Colegio Norte" },
      student: { _id: "stud1", nombre: "Ana Pérez" }
    },
    {
      _id: "evt002",
      type: "student_dropped",
      createdAt: formatTime(0, 8, 0),
      route: { _id: "route1", nombre: "Ruta Colegio Norte" },
      student: { _id: "stud1", nombre: "Ana Pérez" }
    },
    {
      _id: "evt003",
      type: "student_boarded",
      createdAt: formatTime(0, 7, 25),
      route: { _id: "route1", nombre: "Ruta Colegio Norte" },
      student: { _id: "stud2", nombre: "Carlos Pérez" }
    },
    {
      _id: "evt004",
      type: "student_dropped",
      createdAt: formatTime(0, 8, 10),
      route: { _id: "route1", nombre: "Ruta Colegio Norte" },
      student: { _id: "stud2", nombre: "Carlos Pérez" }
    },
    // Día 1 (Ayer)
    {
      _id: "evt101",
      type: "student_boarded",
      createdAt: formatTime(1, 7, 10),
      route: { _id: "route1", nombre: "Ruta Colegio Norte" },
      student: { _id: "stud1", nombre: "Ana Pérez" }
    },
    {
      _id: "evt102",
      type: "student_dropped",
      createdAt: formatTime(1, 7, 55),
      route: { _id: "route1", nombre: "Ruta Colegio Norte" },
      student: { _id: "stud1", nombre: "Ana Pérez" }
    },
    {
      _id: "evt103",
      type: "student_boarded",
      createdAt: formatTime(1, 7, 30),
      route: { _id: "route2", nombre: "Ruta Colegio Sur" },
      student: { _id: "stud3", nombre: "Sofía Gómez" }
    },
    {
      _id: "evt104",
      type: "student_dropped",
      createdAt: formatTime(1, 8, 15),
      route: { _id: "route2", nombre: "Ruta Colegio Sur" },
      student: { _id: "stud3", nombre: "Sofía Gómez" }
    },
    // Día 2 (Hace 2 días)
    {
      _id: "evt201",
      type: "student_boarded",
      createdAt: formatTime(2, 7, 12),
      route: { _id: "route1", nombre: "Ruta Colegio Norte" },
      student: { _id: "stud1", nombre: "Ana Pérez" }
    },
    {
      _id: "evt202",
      type: "student_dropped",
      createdAt: formatTime(2, 7, 59),
      route: { _id: "route1", nombre: "Ruta Colegio Norte" },
      student: { _id: "stud1", nombre: "Ana Pérez" }
    },
    {
      _id: "evt203",
      type: "student_boarded",
      createdAt: formatTime(2, 7, 22),
      route: { _id: "route2", nombre: "Ruta Colegio Sur" },
      student: { _id: "stud3", nombre: "Sofía Gómez" }
    }
    // Nota: Sofía no tiene dropping en día 2 (no descendió o sin registrar)
  ];

  const mockIncidents = [
    {
      _id: "inc001",
      type: "delay",
      routeName: "Ruta Colegio Norte",
      routeId: "route1",
      severity: "medium",
      status: "resolved",
      createdAt: formatTime(0, 7, 30)
    },
    {
      _id: "inc002",
      type: "vehicle_breakdown",
      routeName: "Ruta Colegio Sur",
      routeId: "route2",
      severity: "critical",
      status: "in_progress",
      createdAt: formatTime(1, 7, 45)
    },
    {
      _id: "inc003",
      type: "weather_condition",
      routeName: "Ruta Colegio Norte",
      routeId: "route1",
      severity: "low",
      status: "closed",
      createdAt: formatTime(2, 8, 0)
    }
  ];

  const mockRoutesHistory = [
    {
      routeName: "Ruta Colegio Norte",
      routeId: "route1",
      driverName: "Carlos López",
      autobusPatente: "BUS-01",
      startTime: formatTime(0, 7, 0),
      endTime: formatTime(0, 8, 20),
      durationMinutes: 80,
      incidentCount: 1
    },
    {
      routeName: "Ruta Colegio Sur",
      routeId: "route2",
      driverName: "Juan Pérez",
      autobusPatente: "BUS-02",
      startTime: formatTime(1, 7, 15),
      endTime: formatTime(1, 8, 0),
      durationMinutes: 45,
      incidentCount: 1
    },
    {
      routeName: "Ruta Colegio Norte",
      routeId: "route1",
      driverName: "Carlos López",
      autobusPatente: "BUS-01",
      startTime: formatTime(2, 7, 0),
      endTime: formatTime(2, 8, 15),
      durationMinutes: 75,
      incidentCount: 0
    }
  ];

  return { mockEvents, mockIncidents, mockRoutesHistory };
};

export default function ReportsPage() {
  const [activeReport, setActiveReport] = useState('students');
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [usingMocks, setUsingMocks] = useState(false);

  // Estados de datos crudos
  const [eventsData, setEventsData] = useState([]);
  const [incidentsData, setIncidentsData] = useState([]);
  const [routesHistoryData, setRoutesHistoryData] = useState([]);

  // Estados de Filtros
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [routeFilter, setRouteFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Referencia para la hoja imprimible del reporte
  const printableRef = useRef(null);

  useEffect(() => {
    fetchCatalogs();
    loadReportData();
  }, []);

  // Recargar datos al cambiar de reporte
  useEffect(() => {
    loadReportData();
  }, [activeReport]);

  const fetchCatalogs = async () => {
    try {
      const data = await routeService.getRoutes();
      setRoutes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error cargando catalogo de rutas:', err);
      // Fallback
      setRoutes([
        { _id: "route1", nombre: "Ruta Colegio Norte" },
        { _id: "route2", nombre: "Ruta Colegio Sur" }
      ]);
    }
  };

  const loadReportData = async () => {
    setLoading(true);
    try {
      if (activeReport === 'students' || activeReport === 'boarding') {
        const events = await eventService.getEvents();
        const list = Array.isArray(events) ? events : [];
        setEventsData(list);
        if (list.length === 0) {
          triggerMockFallback();
        } else {
          setUsingMocks(false);
        }
      } else if (activeReport === 'incidents') {
        const incidents = await incidentService.getIncidents();
        const list = Array.isArray(incidents) ? incidents : [];
        // Normalizar nombre de rutas
        const normalized = list.map(inc => ({
          ...inc,
          routeName: inc.route?.nombre || 'N/A',
          routeId: inc.route?._id || inc.route
        }));
        setIncidentsData(normalized);
        if (list.length === 0) {
          triggerMockFallback();
        } else {
          setUsingMocks(false);
        }
      } else if (activeReport === 'routes') {
        const routesHistory = await routeService.getRouteHistory();
        const list = Array.isArray(routesHistory) ? routesHistory : [];
        // Normalizar estructura
        const normalized = list.map(rh => ({
          routeName: rh.route?.nombre || 'N/A',
          routeId: rh.route?.id || rh.route?._id,
          driverName: rh.conductor?.nombre || 'N/A',
          autobusPatente: rh.autobus?.patente || 'N/A',
          startTime: rh.tiempos?.inicioReal,
          endTime: rh.tiempos?.finReal,
          durationMinutes: rh.tiempos?.duracionMinutos,
          incidentCount: rh.incidenciasContador || 0
        }));
        setRoutesHistoryData(normalized);
        if (list.length === 0) {
          triggerMockFallback();
        } else {
          setUsingMocks(false);
        }
      }
    } catch (err) {
      console.error(`Error cargando reporte ${activeReport}:`, err);
      triggerMockFallback();
    } finally {
      setLoading(false);
    }
  };

  const triggerMockFallback = () => {
    setUsingMocks(true);
    const mocks = getMockData();
    setEventsData(mocks.mockEvents);
    setIncidentsData(mocks.mockIncidents);
    setRoutesHistoryData(mocks.mockRoutesHistory);
  };

  const handleResetFilters = () => {
    setStartDate('');
    setEndDate('');
    setRouteFilter('');
    setSearchQuery('');
    setSeverityFilter('');
    setStatusFilter('');
  };

  // PARSEADOR: agrupa eventos QR de student_boarded y student_dropped por estudiante, ruta y día
  const getParsedStudentsTransported = () => {
    const tripMap = {};

    eventsData.forEach(evt => {
      if (evt.type !== 'student_boarded' && evt.type !== 'student_dropped') return;
      
      const studentId = evt.student?._id || evt.student?.id || 'unknown';
      const routeId = evt.route?._id || evt.route?.id || 'unknown';
      const studentName = evt.student?.nombre || 'Estudiante';
      const routeName = evt.route?.nombre || 'Ruta';
      
      const dateStr = evt.createdAt ? evt.createdAt.slice(0, 10) : new Date().toISOString().slice(0, 10);
      const key = `${studentId}_${routeId}_${dateStr}`;

      if (!tripMap[key]) {
        tripMap[key] = {
          studentId,
          routeId,
          studentName,
          routeName,
          date: dateStr,
          boarded: false,
          dropped: false,
          boardedTime: null,
          droppedTime: null
        };
      }

      if (evt.type === 'student_boarded') {
        tripMap[key].boarded = true;
        tripMap[key].boardedTime = evt.createdAt;
      } else if (evt.type === 'student_dropped') {
        tripMap[key].dropped = true;
        tripMap[key].droppedTime = evt.createdAt;
      }
    });

    return Object.values(tripMap).sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  // Obtener datos filtrados para renderizar
  const getFilteredReportData = () => {
    let rawList = [];

    if (activeReport === 'students' || activeReport === 'boarding') {
      rawList = getParsedStudentsTransported();
    } else if (activeReport === 'incidents') {
      rawList = incidentsData;
    } else if (activeReport === 'routes') {
      rawList = routesHistoryData;
    }

    return rawList.filter(row => {
      // 1. Filtro de Fecha Desde
      if (startDate) {
        const rowDate = new Date(row.date || row.createdAt || row.startTime);
        const startLimit = new Date(startDate);
        startLimit.setHours(0, 0, 0, 0);
        if (rowDate < startLimit) return false;
      }

      // 2. Filtro de Fecha Hasta
      if (endDate) {
        const rowDate = new Date(row.date || row.createdAt || row.startTime);
        const endLimit = new Date(endDate);
        endLimit.setHours(23, 59, 59, 999);
        if (rowDate > endLimit) return false;
      }

      // 3. Filtro de Ruta
      if (routeFilter) {
        const rId = row.routeId || row.route?._id || row.route;
        if (String(rId) !== String(routeFilter)) return false;
      }

      // 4. Filtro de búsqueda por estudiante
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        if (row.studentName) {
          if (!row.studentName.toLowerCase().includes(q)) return false;
        } else {
          return false;
        }
      }

      // 5. Filtros específicos de incidencias (Gravedad y Estado)
      if (activeReport === 'incidents') {
        if (severityFilter && row.severity !== severityFilter) return false;
        if (statusFilter && row.status !== statusFilter) return false;
      }

      return true;
    });
  };

  const filteredData = getFilteredReportData();
  const currentFilters = {
    startDate,
    endDate,
    routeId: routeFilter,
    search: searchQuery,
    severity: severityFilter,
    status: statusFilter
  };

  const getReportTitle = () => {
    switch (activeReport) {
      case 'students': return 'Reporte_Estudiantes_Transportados';
      case 'incidents': return 'Reporte_Incidencias_Ruta';
      case 'routes': return 'Reporte_Rutas_Completadas';
      case 'boarding': return 'Reporte_Abordajes_Descensos';
      default: return 'Reporte_RouteNova';
    }
  };

  return (
    <div className="animate-slide-up" style={{ padding: '0 0 20px 0' }}>
      {/* Subcabecera descriptiva */}
      <div style={{ marginBottom: '24px' }}>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '15px' }}>
          Configura, filtra y descarga informes de auditoría del servicio de transporte en formato PDF e impresiones oficiales, o consolida hojas de cálculo en formato Microsoft Excel (.xlsx).
        </p>
      </div>

      {/* Tarjetas selectoras de reporte */}
      <ReportCard 
        activeType={activeReport}
        onSelect={setActiveReport}
      />

      {/* Panel de Filtros dinámico */}
      <ReportFilters 
        reportType={activeReport}
        routes={routes}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        routeFilter={routeFilter}
        setRouteFilter={setRouteFilter}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        severityFilter={severityFilter}
        setSeverityFilter={setSeverityFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        onReset={handleResetFilters}
      />

      {/* Banner de visualización simulada */}
      {usingMocks && (
        <div style={{ 
          background: 'rgba(59, 130, 246, 0.08)', 
          border: '1px solid rgba(59, 130, 246, 0.2)', 
          padding: '10px 16px', 
          borderRadius: 'var(--radius-md)', 
          fontSize: '13px', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px', 
          color: '#60A5FA', 
          marginBottom: '16px' 
        }}>
          💡 <b>Visualización Simulada</b>: No se registran eventos activos en la base de datos de auditoría. Mostrando bitácora interactiva de simulación para exportación.
        </div>
      )}

      {/* Controles de Exportación y Visor */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px' }}>
          <div className="spinner" style={{ marginBottom: '16px' }}></div>
          <span style={{ color: 'var(--color-text-secondary)', fontSize: '14px', fontWeight: '500' }}>
            Compilando datos del reporte de auditoría...
          </span>
        </div>
      ) : (
        <>
          {/* Botones de acción */}
          <ExportButtons 
            reportTitle={getReportTitle()}
            data={filteredData}
            reportType={activeReport}
            printableRef={printableRef}
          />

          {/* Previsualización del reporte (Contenedor Capturable) */}
          <ReportViewer 
            reportType={activeReport}
            data={filteredData}
            filters={currentFilters}
            routes={routes}
            printableRef={printableRef}
          />
        </>
      )}
    </div>
  );
}
