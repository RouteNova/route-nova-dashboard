import React from 'react';

export default function DashboardGrid({ children }) {
  // Desestructuramos los hijos para colocarlos en el layout
  const [statsSection, middleSection, chartsSection, bottomSection] = React.Children.toArray(children);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '20px' }}>
      
      {/* 1. Fila de Tarjetas Resumen */}
      <div>
        {statsSection}
      </div>

      {/* 2. Fila del Medio (Rutas en curso / Monitoreo rápido) */}
      {middleSection && (
        <div>
          {middleSection}
        </div>
      )}

      {/* 3. Recharts Graphics */}
      {chartsSection && (
        <div>
          {chartsSection}
        </div>
      )}

      {/* 4. Fila Inferior (Indicadores Operativos + Bitácora Reciente) */}
      {bottomSection && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
          gap: '24px',
          alignItems: 'start'
        }}>
          {bottomSection.props && bottomSection.props.children ? bottomSection.props.children : bottomSection}
        </div>
      )}

    </div>
  );
}
