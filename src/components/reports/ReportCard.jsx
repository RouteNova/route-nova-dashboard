import React from 'react';
import { 
  FaGraduationCap, 
  FaExclamationTriangle, 
  FaRoute, 
  FaClipboardList 
} from 'react-icons/fa';

export default function ReportCard({ activeType, onSelect }) {
  const reports = [
    {
      id: 'students',
      title: 'Estudiantes Transportados',
      description: 'Bitácora consolidada de alumnos movilizados en cada jornada escolar, mostrando confirmación de abordaje y descenso.',
      icon: <FaGraduationCap />,
      color: 'var(--color-primary)',
      bgLight: 'rgba(37, 99, 235, 0.1)'
    },
    {
      id: 'incidents',
      title: 'Reporte de Incidencias',
      description: 'Historial detallado de todas las incidencias viales y mecánicas reportadas por conductores, indicando gravedad y estado.',
      icon: <FaExclamationTriangle />,
      color: 'var(--color-danger)',
      bgLight: 'rgba(239, 68, 68, 0.1)'
    },
    {
      id: 'routes',
      title: 'Rutas Completadas',
      description: 'Auditoría cronológica de itinerarios completados, tiempos de ejecución, duración real vs. estimada e incidencias.',
      icon: <FaRoute />,
      color: 'var(--color-success)',
      bgLight: 'rgba(16, 185, 129, 0.1)'
    },
    {
      id: 'boarding',
      title: 'Abordajes y Descensos',
      description: 'Informe detallado del flujo y horario de alumnos que hicieron uso del código QR para abordar y descender en las paradas.',
      icon: <FaClipboardList />,
      color: '#06B6D4',
      bgLight: 'rgba(6, 182, 212, 0.1)'
    }
  ];

  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
      gap: '20px', 
      marginBottom: '32px' 
    }}>
      {reports.map((report) => {
        const isActive = activeType === report.id;
        return (
          <div
            key={report.id}
            onClick={() => onSelect(report.id)}
            className="glass-panel"
            style={{
              padding: '24px',
              cursor: 'pointer',
              border: isActive ? `1.5px solid ${report.color}` : '1px solid var(--color-border)',
              boxShadow: isActive ? `0 0 15px ${report.color}25` : 'var(--shadow-sm)',
              transform: isActive ? 'translateY(-2px)' : 'none',
              transition: 'all 0.25s ease',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Fondo luminoso sutil en la esquina */}
            <div style={{
              position: 'absolute',
              top: '-20px',
              right: '-20px',
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: report.color,
              opacity: isActive ? 0.08 : 0.02,
              filter: 'blur(20px)',
              pointerEvents: 'none'
            }} />

            <div>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: report.bgLight,
                color: report.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
                marginBottom: '16px',
                border: `1px solid ${report.color}20`
              }}>
                {report.icon}
              </div>
              
              <h3 style={{ 
                fontFamily: 'var(--font-heading)', 
                fontWeight: '700', 
                fontSize: '17px', 
                color: 'var(--color-text)', 
                marginBottom: '8px' 
              }}>
                {report.title}
              </h3>
              
              <p style={{ 
                fontSize: '13px', 
                lineHeight: '1.5', 
                color: 'var(--color-text-secondary)',
                marginBottom: '16px' 
              }}>
                {report.description}
              </p>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              fontSize: '12px',
              fontWeight: '600',
              color: isActive ? report.color : 'var(--color-text-secondary)',
              transition: 'color 0.2s'
            }}>
              {isActive ? '✓ Seleccionado' : 'Configurar reporte →'}
            </div>
          </div>
        );
      })}
    </div>
  );
}
