// src/components/common/KpiCard/KpiCard.tsx
import React from 'react';
import './KpiCard.scss';

interface KpiCardProps {
  title: string;
  value: string | number;
  icon: string;
  color?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  icon,
  color = '#184e8e',
  trend
}) => {
  return (
    <div className="card stat-card">
      <div className="stat-icon" style={{ color }}>
        <i className={`fas ${icon}`}></i>
      </div>
      <div className="stat-value">
        {value}
        {trend && (
          <div className={`trend ${trend.isPositive ? 'trend-up' : 'trend-down'}`}>
            <i className={`fas fa-arrow-${trend.isPositive ? 'up' : 'down'}`}></i>
            {trend.value}%
          </div>
        )}
      </div>
      <div className="stat-label">{title}</div>
    </div>
  );
};

export default KpiCard;