import React, { useState } from 'react';
import { FaFilePdf, FaFileExcel, FaSyncAlt } from 'react-icons/fa';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';

export default function ExportButtons({ 
  reportTitle, 
  data = [], 
  reportType, 
  printableRef 
}) {
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);

  // Mapear los datos de manera plana según el reporte para Excel
  const getFlatDataForExcel = () => {
    switch (reportType) {
      case 'students':
        return data.map(row => ({
          'Estudiante': row.studentName,
          'Ruta': row.routeName,
          'Fecha': row.date ? new Date(row.date).toLocaleDateString() : 'N/A',
          '¿Abordó?': row.boarded ? 'Sí' : 'No',
          '¿Descendió?': row.dropped ? 'Sí' : 'No'
        }));
      case 'incidents':
        const translateIncidentType = (type) => {
          const m = {
            delay: 'Retraso',
            route_deviation: 'Desvío de Ruta',
            vehicle_breakdown: 'Avería de Vehículo',
            medical_emergency: 'Emergencia Médica',
            technical_issue: 'Problema Técnico',
            weather_condition: 'Clima Adverso',
            other: 'Otro'
          };
          return m[type] || type || 'Desconocido';
        };
        const translateIncidentSeverity = (sev) => {
          const m = { low: 'Leve', medium: 'Moderada', high: 'Alta', critical: 'Crítica' };
          return m[sev] || sev || 'Leve';
        };
        const translateIncidentStatus = (st) => {
          const m = { open: 'Pendiente', in_progress: 'En revisión', resolved: 'Resuelta', closed: 'Cerrada' };
          return m[st] || st || 'Pendiente';
        };
        return data.map(row => ({
          'Tipo de Incidencia': translateIncidentType(row.type),
          'Ruta Escolar': row.routeName,
          'Gravedad': translateIncidentSeverity(row.severity),
          'Estado': translateIncidentStatus(row.status),
          'Fecha/Hora Reporte': row.createdAt ? new Date(row.createdAt).toLocaleString() : 'N/A'
        }));
      case 'routes':
        return data.map(row => ({
          'Ruta': row.routeName,
          'Conductor': row.driverName || 'N/A',
          'Autobús (Patente)': row.autobusPatente || 'N/A',
          'Inicio Real': row.startTime ? new Date(row.startTime).toLocaleString() : 'N/A',
          'Finalización Real': row.endTime ? new Date(row.endTime).toLocaleString() : 'N/A',
          'Duración (Minutos)': row.durationMinutes || 0,
          'Cant. Incidencias': row.incidentCount || 0
        }));
      case 'boarding':
        return data.map(row => ({
          'Fecha': row.date ? new Date(row.date).toLocaleDateString() : 'N/A',
          'Estudiante': row.studentName,
          'Hora Abordaje': row.boardedTime ? new Date(row.boardedTime).toLocaleTimeString() : 'N/A',
          'Hora Descenso': row.droppedTime ? new Date(row.droppedTime).toLocaleTimeString() : 'N/A',
          'Ruta': row.routeName
        }));
      default:
        return data;
    }
  };

  const handleExportExcel = () => {
    if (!data || data.length === 0) return;
    setIsExportingExcel(true);
    try {
      const flatData = getFlatDataForExcel();
      const worksheet = XLSX.utils.json_to_sheet(flatData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Reporte');
      
      // Ajustar anchos de columnas en Excel
      const maxLens = {};
      flatData.forEach(row => {
        Object.keys(row).forEach(key => {
          const val = String(row[key] || '');
          maxLens[key] = Math.max(maxLens[key] || key.length, val.length);
        });
      });
      worksheet['!cols'] = Object.keys(maxLens).map(key => ({
        wch: maxLens[key] + 3
      }));

      const dateStr = new Date().toISOString().split('T')[0];
      const filename = `Reporte_${reportType.toUpperCase()}_${dateStr}.xlsx`;
      XLSX.writeFile(workbook, filename);
    } catch (err) {
      console.error('Error al exportar a Excel:', err);
    } finally {
      setIsExportingExcel(false);
    }
  };

  const handleExportPDF = async () => {
    if (!printableRef || !printableRef.current) return;
    setIsExportingPDF(true);
    const element = printableRef.current;

    // Guardar estilos originales
    const originalBg = element.style.background;
    const originalColor = element.style.color;
    const originalShadow = element.style.boxShadow;
    const originalPadding = element.style.padding;

    // Aplicar estilos aptos para impresión (blanco e impecable)
    element.style.background = '#ffffff';
    element.style.color = '#0b0f19';
    element.style.boxShadow = 'none';
    element.style.padding = '30px';

    // Ajustar temporalmente colores de texto claros para legibilidad en PDF
    const textNodes = element.querySelectorAll('*');
    const originalTextColors = [];
    textNodes.forEach((node, idx) => {
      originalTextColors[idx] = node.style.color;
      const compColor = window.getComputedStyle(node).color;
      // Si el color es translúcido o muy claro, ponerlo gris oscuro/negro
      if (compColor.includes('rgba(255, 255, 255') || compColor.includes('rgb(255, 255, 255')) {
        node.style.color = '#0b0f19';
      } else if (node.style.color === 'var(--color-text-secondary)') {
        node.style.color = '#4b5563';
      }
    });

    try {
      const canvas = await html2canvas(element, {
        scale: 2, // Aumenta resolución del render
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false
      });

      // Restaurar estilos originales
      element.style.background = originalBg;
      element.style.color = originalColor;
      element.style.boxShadow = originalShadow;
      element.style.padding = originalPadding;
      textNodes.forEach((node, idx) => {
        node.style.color = originalTextColors[idx];
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgWidth = pdfWidth - 20; // 10mm margenes a los lados
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 10; // Margen superior de 10mm

      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= (pdfHeight - 20);

      // Paginación si el reporte es largo
      while (heightLeft > 0) {
        position = heightLeft - imgHeight + 10;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= (pdfHeight - 20);
      }

      const dateStr = new Date().toISOString().split('T')[0];
      pdf.save(`Reporte_${reportType.toUpperCase()}_${dateStr}.pdf`);
    } catch (err) {
      console.error('Error al generar PDF:', err);
      // Restaurar estilos en caso de falla
      element.style.background = originalBg;
      element.style.color = originalColor;
      element.style.boxShadow = originalShadow;
      element.style.padding = originalPadding;
      textNodes.forEach((node, idx) => {
        node.style.color = originalTextColors[idx];
      });
    } finally {
      setIsExportingPDF(false);
    }
  };

  return (
    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginBottom: '16px' }}>
      <button
        onClick={handleExportPDF}
        disabled={isExportingPDF || isExportingExcel || data.length === 0}
        className="btn-primary"
        style={{
          background: 'linear-gradient(135deg, #EF4444 0%, #B91C1C 100%)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontWeight: '600',
          fontSize: '13.5px',
          padding: '10px 16px',
          margin: 0
        }}
      >
        {isExportingPDF ? (
          <FaSyncAlt className="spin" style={{ animation: 'spin 1s linear infinite' }} />
        ) : (
          <FaFilePdf />
        )}
        Exportar a PDF
      </button>

      <button
        onClick={handleExportExcel}
        disabled={isExportingPDF || isExportingExcel || data.length === 0}
        className="btn-primary"
        style={{
          background: 'linear-gradient(135deg, #10B981 0%, #047857 100%)',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontWeight: '600',
          fontSize: '13.5px',
          padding: '10px 16px',
          margin: 0
        }}
      >
        {isExportingExcel ? (
          <FaSyncAlt className="spin" style={{ animation: 'spin 1s linear infinite' }} />
        ) : (
          <FaFileExcel />
        )}
        Exportar a Excel
      </button>
    </div>
  );
}
