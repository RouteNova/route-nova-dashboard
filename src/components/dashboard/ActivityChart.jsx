import React from 'react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend 
} from 'recharts';

export default function ActivityChart({ dailyTransportData = [], incidentsByTypeData = [], routeStatusData = [] }) {
  // Colores para el gráfico de torta
  const COLORS = ['#10B981', '#2563EB', '#F59E0B', '#EF4444'];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: 'rgba(15, 23, 42, 0.95)',
          border: '1px solid var(--color-border)',
          padding: '10px 14px',
          borderRadius: '8px',
          boxShadow: 'var(--shadow-lg)',
          color: '#ffffff',
          fontSize: '12px'
        }}>
          <p style={{ margin: '0 0 4px 0', fontWeight: '700' }}>{label}</p>
          {payload.map((item, idx) => (
            <p key={idx} style={{ margin: 0, color: item.color || item.fill }}>
              {item.name}: <strong>{item.value}</strong>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const CustomPieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const item = payload[0];
      return (
        <div style={{
          background: 'rgba(15, 23, 42, 0.95)',
          border: '1px solid var(--color-border)',
          padding: '10px 14px',
          borderRadius: '8px',
          boxShadow: 'var(--shadow-lg)',
          color: '#ffffff',
          fontSize: '12px'
        }}>
          <p style={{ margin: 0, fontWeight: '700', color: item.payload.color }}>
            {item.name}: <strong>{item.value}</strong> ({item.payload.percentage || 0}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Fila superior de gráficos (Línea + Barras) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '24px'
      }}>
        
        {/* Gráfico de Línea: Transporte Diario */}
        <div className="glass-panel" style={{ padding: '24px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '15.5px', fontWeight: '700', color: 'var(--color-text)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            📈 Transporte Diario (Estudiantes Transportados)
          </h3>
          <div style={{ width: '100%', height: '240px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyTransportData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <XAxis dataKey="name" stroke="var(--color-text-secondary)" style={{ fontSize: '11px' }} tickLine={false} />
                <YAxis stroke="var(--color-text-secondary)" style={{ fontSize: '11px' }} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="Estudiantes" 
                  stroke="var(--color-primary)" 
                  strokeWidth={3} 
                  activeDot={{ r: 6 }} 
                  name="Estudiantes"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico de Barras: Incidencias por Tipo */}
        <div className="glass-panel" style={{ padding: '24px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '15.5px', fontWeight: '700', color: 'var(--color-text)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            📊 Incidencias por Tipo de Novedad
          </h3>
          <div style={{ width: '100%', height: '240px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={incidentsByTypeData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <XAxis dataKey="name" stroke="var(--color-text-secondary)" style={{ fontSize: '11px' }} tickLine={false} />
                <YAxis stroke="var(--color-text-secondary)" style={{ fontSize: '11px' }} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="Cantidad" fill="var(--color-warning)" radius={[4, 4, 0, 0]} name="Incidencias">
                  {incidentsByTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || 'var(--color-warning)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Fila inferior (Distribución de Rutas - Circular / Donut) */}
      <div className="glass-panel" style={{ padding: '24px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
        <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '15.5px', fontWeight: '700', color: 'var(--color-text)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          🍩 Distribución de Estado de las Rutas
        </h3>
        
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-around',
          gap: '24px'
        }}>
          {/* Gráfico Circular */}
          <div style={{ width: '220px', height: '220px', position: 'relative' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip content={<CustomPieTooltip />} />
                <Pie
                  data={routeStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {routeStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            
            {/* Texto central del Donut */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              pointerEvents: 'none'
            }}>
              <div style={{ fontSize: '24px', fontWeight: '800', fontFamily: 'var(--font-heading)', color: 'var(--color-text)' }}>
                {routeStatusData.reduce((acc, d) => acc + d.value, 0)}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', fontWeight: '600' }}>
                Rutas Totales
              </div>
            </div>
          </div>

          {/* Leyendas descriptivas al costado */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {routeStatusData.map((data, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: COLORS[idx % COLORS.length]
                }} />
                <span style={{ fontSize: '13.5px', color: 'var(--color-text)' }}>
                  <strong>{data.name}</strong>: {data.value} recorridos ({data.percentage}%)
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
