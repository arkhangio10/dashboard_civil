// src/components/dashboard/TabCostos.tsx
import React, { useMemo } from 'react';
import { ReportDetail } from '../../hooks/useKPIData';
import LineChart from '../charts/LineChart';
import DoughnutChart from '../charts/DoughnutChart';
import BarChart from '../charts/BarChart';
import './TabCostos.scss';

interface TabCostosProps {
  reports: ReportDetail[];
  loading: boolean;
}

const TabCostos: React.FC<TabCostosProps> = ({ reports, loading }) => {
  // Costos por categoría (en soles por hora)
  const costosPorCategoria: {[key: string]: number} = {
    'OPERARIO': 23.00,
    'OFICIAL': 18.09,
    'PEON': 16.38
  };

  // Datos para la evolución de costos por mes
  const evolucionCostos = useMemo(() => {
    if (loading || reports.length === 0) {
      return { labels: [], costosMO: [] };
    }

    // Agrupar datos por mes
    const costosPorMes: {
      [key: string]: {
        costoMO: number;
        month: number;
        year: number;
      };
    } = {};

    reports.forEach(report => {
      const reportDate = new Date(report.fecha);
      const monthYear = reportDate.toLocaleString('es-ES', { month: 'long', year: 'numeric' });
      
      if (!costosPorMes[monthYear]) {
        costosPorMes[monthYear] = {
          costoMO: 0,
          month: reportDate.getMonth(),
          year: reportDate.getFullYear()
        };
      }
      
      // Calcular costo de mano de obra para este reporte
      report.manoObra.forEach(trab => {
        if (!trab.categoria || !Array.isArray(trab.horas)) return;
        
        const categoria = trab.categoria;
        const totalHoras = trab.horas.reduce((sum, h) => sum + (parseFloat(h) || 0), 0);
        
        const costoPorHora = costosPorCategoria[categoria] || 18.00;
        costosPorMes[monthYear].costoMO += totalHoras * costoPorHora;
      });
    });

    // Ordenar por fecha (ascendente)
    const sortedData = Object.entries(costosPorMes)
      .sort((a, b) => {
        if (a[1].year !== b[1].year) {
          return a[1].year - b[1].year;
        }
        return a[1].month - b[1].month;
      });

    return {
      labels: sortedData.map(d => d[0]),
      costosMO: sortedData.map(d => d[1].costoMO)
    };
  }, [reports, loading]);

  // Datos para la distribución de costos por categoría
  const distribucionCostos = useMemo(() => {
    if (loading || reports.length === 0) {
      return { labels: [], costos: [] };
    }

    // Agrupar costos por categoría
    const costosPorCat: {[key: string]: number} = {};

    reports.forEach(report => {
      report.manoObra.forEach(trab => {
        if (!trab.categoria || !Array.isArray(trab.horas)) return;
        
        const categoria = trab.categoria;
        const totalHoras = trab.horas.reduce((sum, h) => sum + (parseFloat(h) || 0), 0);
        
        if (!costosPorCat[categoria]) {
          costosPorCat[categoria] = 0;
        }
        
        const costoPorHora = costosPorCategoria[categoria] || 18.00;
        costosPorCat[categoria] += totalHoras * costoPorHora;
      });
    });

    return {
      labels: Object.keys(costosPorCat),
      costos: Object.values(costosPorCat)
    };
  }, [reports, loading]);

  // Datos para Top Actividades por Costo
  const topActividadesCosto = useMemo(() => {
    if (loading || reports.length === 0) {
      return [];
    }

    // Agrupar datos por actividad
    const actividadesStats: {
      [key: string]: {
        metradoE: number;
        costo: number;
      };
    } = {};
    
    reports.forEach(report => {
      report.actividades.forEach((act, actIndex) => {
        if (!act.proceso) return;
        
        const actividad = act.proceso;
        const metradoE = parseFloat(String(act.metradoE)) || 0;
        
        if (!actividadesStats[actividad]) {
          actividadesStats[actividad] = {
            metradoE: 0,
            costo: 0
          };
        }
        
        actividadesStats[actividad].metradoE += metradoE;
        
        // Calcular costo para esta actividad
        let costoActividad = 0;
        report.manoObra.forEach(trab => {
          if (!trab.categoria || !Array.isArray(trab.horas) || !trab.horas[actIndex]) return;
          
          const horas = parseFloat(trab.horas[actIndex]) || 0;
          const costoPorHora = costosPorCategoria[trab.categoria] || 18.00;
          costoActividad += horas * costoPorHora;
        });
        
        actividadesStats[actividad].costo += costoActividad;
      });
    });

    // Calcular costo por unidad
    const actividades = Object.entries(actividadesStats).map(([nombre, stats]) => {
      const costoPorUnidad = stats.metradoE > 0 ? stats.costo / stats.metradoE : 0;
      
      return {
        nombre,
        metradoE: stats.metradoE,
        costo: stats.costo,
        costoPorUnidad
      };
    });

    // Calcular costo total
    const costoTotal = actividades.reduce((sum, act) => sum + act.costo, 0);

    // Agregar porcentaje del total
    const actividadesConPorcentaje = actividades.map(act => ({
      ...act,
      porcentaje: costoTotal > 0 ? (act.costo / costoTotal) * 100 : 0
    }));

    // Ordenar por costo total (descendente)
    return actividadesConPorcentaje.sort((a, b) => b.costo - a.costo).slice(0, 10);
  }, [reports, loading]);

  // Datos para Costo por Categoría
  const costosPorCategoriaData = useMemo(() => {
    if (loading || reports.length === 0) {
      return [];
    }

    // Agrupar datos por categoría
    const categoriasStats: {
      [key: string]: {
        horasTotales: number;
        costo: number;
      };
    } = {};
    
    reports.forEach(report => {
      report.manoObra.forEach(trab => {
        if (!trab.categoria || !Array.isArray(trab.horas)) return;
        
        const categoria = trab.categoria;
        const totalHoras = trab.horas.reduce((sum, h) => sum + (parseFloat(h) || 0), 0);
        
        if (!categoriasStats[categoria]) {
          categoriasStats[categoria] = {
            horasTotales: 0,
            costo: 0
          };
        }
        
        categoriasStats[categoria].horasTotales += totalHoras;
        const costoPorHora = costosPorCategoria[categoria] || 18.00;
        categoriasStats[categoria].costo += totalHoras * costoPorHora;
      });
    });

    // Convertir a array para tabla
    const categorias = Object.entries(categoriasStats).map(([nombre, stats]) => {
      const costoPorHora = costosPorCategoria[nombre] || 18.00;
      
      return {
        nombre,
        costoPorHora,
        horasTotales: stats.horasTotales,
        costo: stats.costo
      };
    });

    // Calcular costo total
    const costoTotal = categorias.reduce((sum, cat) => sum + cat.costo, 0);

    // Agregar porcentaje del total
    const categoriasConPorcentaje = categorias.map(cat => ({
      ...cat,
      porcentaje: costoTotal > 0 ? (cat.costo / costoTotal) * 100 : 0
    }));

    // Ordenar por costo total (descendente)
    return categoriasConPorcentaje.sort((a, b) => b.costo - a.costo);
  }, [reports, loading]);

  // Datos para Análisis de Costos vs Avance
  const costosVsAvance = useMemo(() => {
    if (loading || reports.length === 0) {
      return { labels: [], costos: [], avances: [] };
    }

    // Preparar datos para el gráfico
    const datos = reports.map(report => {
      const reportDate = new Date(report.fecha);
      const monthYear = reportDate.toLocaleString('es-ES', { month: 'short', year: 'numeric' });
      
      // Calcular avance promedio para este reporte
      let sumAvance = 0;
      let countAvance = 0;
      
      report.actividades.forEach(act => {
        const metradoP = parseFloat(String(act.metradoP)) || 0;
        const metradoE = parseFloat(String(act.metradoE)) || 0;
        
        if (metradoP > 0) {
          sumAvance += (metradoE / metradoP) * 100;
          countAvance++;
        }
      });
      
      const avgAvance = countAvance > 0 ? sumAvance / countAvance : 0;
      
      // Calcular costo total para este reporte
      let costoReporte = 0;
      report.manoObra.forEach(trab => {
        if (!trab.categoria || !Array.isArray(trab.horas)) return;
        
        const categoria = trab.categoria;
        const totalHoras = trab.horas.reduce((sum, h) => sum + (parseFloat(h) || 0), 0);
        
        const costoPorHora = costosPorCategoria[categoria] || 18.00;
        costoReporte += totalHoras * costoPorHora;
      });
      
      return {
        label: `${report.subcontratistaBloque || 'N/A'} (${monthYear})`,
        avance: avgAvance,
        costo: costoReporte
      };
    });

    return {
      labels: datos.map(d => d.label),
      costos: datos.map(d => d.costo),
      avances: datos.map(d => d.avance)
    };
  }, [reports, loading]);

  // Si está cargando, mostrar placeholders
  if (loading) {
    return (
      <div className="tab-pane fade show active">
        <div className="loading-container">
          <div className="loader"></div>
          <p>Cargando datos de costos...</p>
        </div>
      </div>
    );
  }

  // Si no hay datos, mostrar mensaje
  if (reports.length === 0) {
    return (
      <div className="tab-pane fade show active">
        <div className="alert alert-info">
          No hay datos disponibles para el período seleccionado. Intente modificar los filtros.
        </div>
      </div>
    );
  }

  return (
    <div className="tab-pane fade show active" id="costs">
      <div className="row">
        <div className="col-md-8">
          <div className="card mb-4">
            <div className="card-header">
              <h5>Evolución de Costos</h5>
            </div>
            <div className="card-body">
              <div className="chart-container">
                <LineChart 
                  labels={evolucionCostos.labels} 
                  datasets={[
                    {
                      label: 'Costo Mano de Obra (S/)',
                      data: evolucionCostos.costosMO,
                      borderColor: 'rgba(57, 73, 171, 1)',
                      backgroundColor: 'rgba(57, 73, 171, 0.1)'
                    }
                  ]}
                  yAxisTitle="Costo (S/)"
                />
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card mb-4">
            <div className="card-header">
              <h5>Distribución de Costos</h5>
            </div>
            <div className="card-body">
              <div className="chart-container" style={{ height: '220px' }}>
                <DoughnutChart 
                  labels={distribucionCostos.labels} 
                  data={distribucionCostos.costos}
                  colors={distribucionCostos.labels.map(cat => {
                    if (cat === 'OPERARIO') return 'rgba(40, 167, 69, 0.7)';
                    if (cat === 'OFICIAL') return 'rgba(23, 162, 184, 0.7)';
                    if (cat === 'PEON') return 'rgba(255, 193, 7, 0.7)';
                    return 'rgba(108, 117, 125, 0.7)';
                  })}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="row">
        <div className="col-md-6">
          <div className="card mb-4">
            <div className="card-header">
              <h5>Top Actividades por Costo</h5>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table mb-0">
                  <thead>
                    <tr>
                      <th>Actividad</th>
                      <th>Costo Total</th>
                      <th>Costo/UND</th>
                      <th>Metrado E.</th>
                      <th>% del Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topActividadesCosto.map(act => (
                      <tr key={act.nombre}>
                        <td>{act.nombre}</td>
                        <td>S/ {act.costo.toFixed(2)}</td>
                        <td>S/ {act.costoPorUnidad.toFixed(2)}</td>
                        <td>{act.metradoE.toFixed(2)}</td>
                        <td>{act.porcentaje.toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card mb-4">
            <div className="card-header">
              <h5>Costo por Categoría de Trabajador</h5>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table mb-0">
                  <thead>
                    <tr>
                      <th>Categoría</th>
                      <th>Costo/Hora</th>
                      <th>Horas Totales</th>
                      <th>Costo Total</th>
                      <th>% del Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {costosPorCategoriaData.map(cat => (
                      <tr key={cat.nombre}>
                        <td>
                          <span className={`category-badge category-${cat.nombre.toLowerCase().replace(/\s+/g, '')}`}>
                            {cat.nombre}
                          </span>
                        </td>
                        <td>S/ {cat.costoPorHora.toFixed(2)}</td>
                        <td>{cat.horasTotales.toFixed(1)}</td>
                        <td>S/ {cat.costo.toFixed(2)}</td>
                        <td>{cat.porcentaje.toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="card mb-4">
        <div className="card-header">
          <h5>Análisis de Costos vs Avance</h5>
        </div>
        <div className="card-body">
          <div className="chart-container">
            <BarChart 
              labels={costosVsAvance.labels}
              datasets={[
                {
                  label: 'Costo (S/)',
                  data: costosVsAvance.costos,
                  backgroundColor: 'rgba(57, 73, 171, 0.7)'
                },
                {
                  label: 'Avance (%)',
                  data: costosVsAvance.avances,
                  backgroundColor: 'rgba(40, 167, 69, 0.7)'
                }
              ]}
              yAxisTitle="Valor"
              stacked={false}
              maxBarThickness={30}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TabCostos;