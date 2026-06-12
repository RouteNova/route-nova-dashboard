import React from 'react';

export default function StatisticCard({ title, value, icon, color = 'var(--color-primary)', trend }) {
  return (
    <div 
      className="glass-panel" 
      style={{ 
        padding: '24px', 
        boxShadow: 'var(--shadow-card)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-md)',
        transition: 'transform 0.2s, box-shadow 0.2s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.boxShadow = 'var(--shadow-card)';
      }}
    >
      {/* Luz ambiental en la esquina */}
      <div style={{
        position: 'absolute',
        top: '-15px',
        right: '-15px',
        width: '60px',
        height: '60px',
        borderRadius: '50%',
        background: color,
        opacity: 0.05,
        filter: 'blur(15px)',
        pointerEvents: 'none'
      }} />

      <div>
        <h3 style={{ 
          fontFamily: 'var(--font-heading)', 
          fontSize: '14.5px', 
          color: 'var(--color-text-secondary)', 
          fontWeight: '500',
          margin: 0
        }}>
          {title}
        </h3>
        
        <div style={{ 
          fontSize: '32px', 
          fontWeight: '800', 
          marginTop: '6px', 
          fontFamily: 'var(--font-heading)',
          color: 'var(--color-text)',
          lineHeight: '1'
        }}>
          {value}
        </div>

        {trend && (
          <div style={{ 
            fontSize: '12px', 
            fontWeight: '600', 
            marginTop: '8px',
            color: trend.type === 'up' ? '#34D399' : trend.type === 'down' ? '#F87171' : 'var(--color-text-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <span>{trend.type === 'up' ? '▲' : trend.type === 'down' ? '▼' : '•'}</span>
            <span>{trend.text}</span>
          </div>
        )}
      </div>

      <div style={{
        width: '46px',
        height: '46px',
        borderRadius: '10px',
        background: `rgba(255, 255, 255, 0.02)`,
        border: '1px solid var(--color-border)',
        color: color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '20px'
      }}>
        {icon}
      </div>
    </div>
  );
}
