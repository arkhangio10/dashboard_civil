// src/components/dashboard/KPICards.tsx
import React from 'react';
import KpiCard from '../common/KpiCard/KpiCard';
import { KPIMetrics } from '../../hooks/useKPIData';

interface KPICardsProps {
  metrics: KPIMetrics;
  loading: boolean;
}

const KPICards: React.FC<KPICardsProps> = ({ metrics, loading }) => {
  // Mostrar placeholders durante la carga
  if (loading) {
    return (
      <div className="row mb-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="col-md-3 col-sm-6 mb-3 mb-md-0">
            <div className="card stat-card">
              <div className="stat-icon placeholder-glow">
                <span className="placeholder col-8"></span>
              </div>
              <div className="stat-value placeholder-glow">
                <span className="placeholder col-6"></span>
              </div>
              <div className="stat-label placeholder-glow">
                <span className="placeholder col-4"></span>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="row mb-4">
      {/* Primera fila de KPIs */}
      <div className="col-md-3 col-sm-6 mb-3 mb-md-0">
        <KpiCard
          title="Total Reportes"
          value={metrics.totalReportes}
          icon="fa-file-alt"
        />
      </div>
      <div className="col-md-3 col-sm-6 mb-3 mb-md-0">
        <KpiCard
          title="Actividades"
          value={metrics.totalActividades}
          icon="fa-tasks"
        />
      </div>
      <div className="col-md-3 col-sm-6 mb-3 mb-sm-0">
        <KpiCard
          title="Trabajadores"
          value={metrics.totalTrabajadores}
          icon="fa-users"
        />
      </div>
      <div className="col-md-3 col-sm-6">
        <KpiCard
          title="Avance Promedio"
          value={`${metrics.avancePromedio.toFixed(1)}%`}
          icon="fa-percentage"
        />
      </div>

      {/* Segunda fila de KPIs para costos */}
      <div className="col-md-3 col-sm-6 mb-3 mb-md-0">
        <KpiCard
          title="Costo Total"
          value={`S/ ${metrics.costoTotal.toFixed(2)}`}
          icon="fa-money-bill-wave"
          color="#3949ab"
        />
      </div>
      <div className="col-md-3 col-sm-6 mb-3 mb-md-0">
        <KpiCard
          title="Costo Mano de Obra"
          value={`S/ ${metrics.costoManoObra.toFixed(2)}`}
          icon="fa-hand-holding-usd"
          color="#3949ab"
        />
      </div>
      <div className="col-md-3 col-sm-6 mb-3 mb-sm-0">
        <KpiCard
          title="Costo Promedio/Unidad"
          value={`S/ ${metrics.costoPromedioPorUnidad.toFixed(2)}`}
          icon="fa-balance-scale"
          color="#3949ab"
        />
      </div>
      <div className="col-md-3 col-sm-6">
        <KpiCard
          title="Índice de Eficiencia"
          value={`${metrics.indiceEficiencia.toFixed(1)}%`}
          icon="fa-chart-line"
          color="#3949ab"
        />
      </div>
    </div>
  );
};

export default KPICards;