// src/components/dashboard/TabVisión.tsx
import React, { useMemo } from 'react';
import { ReportDetail } from '../../hooks/useKPIData';
import LineChart from '../charts/LineChart';
import DoughnutChart from '../charts/DoughnutChart';
import BarChart from '../charts/BarChart';
import './TabVisión.scss';

interface TabVisiónProps {
  reports: ReportDetail[];
  loading: boolean;
}

const TabVisión: React.FC<TabVisiónProps> = ({ reports, loading }) => {
  // Función para obtener número de semana del año
  const getWeekNumber = (date: Date): number => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  };

  // Datos para gráfico de Avance por Semana
  const avanceData = useMemo(() => {
    if (loading || reports.length === 0) {
      return { labels: [], avances: [] };
    }

    // Agrupar datos por semana
    const avancePorSemana: {
      [key: string]: {
        sumAvance: number;
        countAvance: number;
        weekNumber: number;
        year: number;
      };
    } = {};

    reports.forEach(report => {
      const reportDate = new Date(report.fecha);
      // Obtener número de semana del año
      const weekNumber = getWeekNumber(reportDate);
      const weekLabel = `Sem ${weekNumber} (${reportDate.getFullYear()})`;
      
      if (!avancePorSemana[weekLabel]) {
        avancePorSemana[weekLabel] = {
          sumAvance: 0,
          countAvance: 0,
          weekNumber,
          year: reportDate.getFullYear()
        };
      }
      
      report.actividades.forEach(act => {
        const metradoP = parseFloat(String(act.metradoP)) || 0;
        const metradoE = parseFloat(String(act.metradoE)) || 0;
        
        if (metradoP > 0) {
          avancePorSemana[weekLabel].sumAvance += (metradoE / metradoP) * 100;
          avancePorSemana[weekLabel].countAvance++;
        }
      });
    });

    // Calcular avance promedio por semana
    const chartData = Object.entries(avancePorSemana)
      .map(([weekLabel, data]) => ({
        weekLabel,
        avance: data.countAvance > 0 ? data.sumAvance / data.countAvance : 0,
        weekNumber: data.weekNumber,
        year: data.year
      }))
      .sort((a, b) => {
        // Ordenar por año y luego por número de semana
        if (a.year !== b.year) {
          return a.year - b.year;
        }
        return a.weekNumber - b.weekNumber;
      });

    return {
      labels: chartData.map(data => data.weekLabel),
      avances: chartData.map(data => data.avance)
    };
  }, [reports, loading]);

  // Datos para gráfico de distribución de categorías
  const categoriasData = useMemo(() => {
    if (loading || reports.length === 0) {
      return { labels: [], data: [] };
    }

    // Agrupar datos por categoría
    const horasPorCategoria: { [key: string]: number } = {};
    
    reports.forEach(report => {
      report.manoObra.forEach(trab => {
        if (!trab.categoria || !Array.isArray(trab.horas)) return;
        
        const categoria = trab.categoria;
        const totalHoras = trab.horas.reduce((sum, h) => sum + (parseFloat(h) || 0), 0);
        
        if (!horasPorCategoria[categoria]) {
          horasPorCategoria[categoria] = 0;
        }
        
        horasPorCategoria[categoria] += totalHoras;
      });
    });

    // Convertir a arrays para el gráfico
    const categorias = Object.keys(horasPorCategoria);
    const horas = Object.values(horasPorCategoria);

    return {
      labels: categorias,
      data: horas
    };
  }, [reports, loading]);

  // Datos para gráfico de subcontratistas por avance
  const subcontratistasData = useMemo(() => {
    if (loading || reports.length === 0) {
      return { labels: [], avances: [], reportes: [], costos: [] };
    }

    // Agrupar datos por subcontratista
    const datosPorSubcontratista: {
      [key: string]: {
        sumAvance: number;
        countAvance: number;
        reportes: number;
        costo: number;
      };
    } = {};

    reports.forEach(report => {
      const subcontratista = report.subcontratistaBloque || 'Sin especificar';
      
      if (!datosPorSubcontratista[subcontratista]) {
        datosPorSubcontratista[subcontratista] = {
          sumAvance: 0,
          countAvance: 0,
          reportes: 0,
          costo: 0
        };
      }
      
      datosPorSubcontratista[subcontratista].reportes++;
      
      // Calcular avance por actividades
      report.actividades.forEach(act => {
        const metradoP = parseFloat(String(act.metradoP)) || 0;
        const metradoE = parseFloat(String(act.metradoE)) || 0;
        
        if (metradoP > 0) {
          datosPorSubcontratista[subcontratista].sumAvance += (metradoE / metradoP) * 100;
          datosPorSubcontratista[subcontratista].countAvance++;
        }
      });
      
      // Calcular costo por mano de obra
      const costosPorCategoria: { [key: string]: number } = {
        'OPERARIO': 23.00,
        'OFICIAL': 18.09,
        'PEON': 16.38
      };
      
      report.manoObra.forEach(trab => {
        if (!trab.categoria || !Array.isArray(trab.horas)) return;
        
        const categoria = trab.categoria;
        const totalHoras = trab.horas.reduce((sum, h) => sum + (parseFloat(h) || 0), 0);
        
        const costoPorHora = costosPorCategoria[categoria] || 18.00;
        datosPorSubcontratista[subcontratista].costo += totalHoras * costoPorHora;
      });
    });

    // Calcular avance promedio y ordenar por avance
    const subcontratistas = Object.keys(datosPorSubcontratista);
    const avances = subcontratistas.map(sub => {
      const datos = datosPorSubcontratista[sub];
      return datos.countAvance > 0 ? datos.sumAvance / datos.countAvance : 0;
    });
    const reportesCounts = subcontratistas.map(sub => datosPorSubcontratista[sub].reportes);
    const costos = subcontratistas.map(sub => datosPorSubcontratista[sub].costo);

    // Ordenar los arrays por avance (descendente)
    const indices = avances.map((_, idx) => idx);
    indices.sort((a, b) => avances[b] - avances[a]);
    
    return {
      labels: indices.map(i => subcontratistas[i]),
      avances: indices.map(i => avances[i]),
      reportes: indices.map(i => reportesCounts[i]),
      costos: indices.map(i => costos[i])
    };
  }, [reports, loading]);

  // Datos para tabla de top actividades
  const topActividades = useMemo(() => {
    if (loading || reports.length === 0) {
      return [];
    }

    // Agrupar datos por actividad
    const actividadesStats: {
      [key: string]: {
        metradoP: number;
        metradoE: number;
        costo: number;
        reportes: number;
        unidad: string;
      };
    } = {};
    
    reports.forEach(report => {
      report.actividades.forEach((act, actIndex) => {
        if (!act.proceso) return;
        
        const actividad = act.proceso;
        const metradoP = parseFloat(String(act.metradoP)) || 0;
        const metradoE = parseFloat(String(act.metradoE)) || 0;
        const unidad = act.und || '';
        
        if (!actividadesStats[actividad]) {
          actividadesStats[actividad] = {
            metradoP: 0,
            metradoE: 0,
            costo: 0,
            reportes: 0,
            unidad
          };
        }
        
        actividadesStats[actividad].metradoP += metradoP;
        actividadesStats[actividad].metradoE += metradoE;
        actividadesStats[actividad].reportes++;
        
        // Calcular costo para esta actividad
        const costosPorCategoria: { [key: string]: number } = {
          'OPERARIO': 23.00,
          'OFICIAL': 18.09,
          'PEON': 16.38
        };
        
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

    // Calcular avance y costo por unidad
    const actividades = Object.entries(actividadesStats).map(([nombre, stats]) => {
      const avance = stats.metradoP > 0 ? (stats.metradoE / stats.metradoP) * 100 : 0;
      const costoPorUnidad = stats.metradoE > 0 ? stats.costo / stats.metradoE : 0;
      
      return {
        nombre,
        unidad: stats.unidad,
        metradoP: stats.metradoP,
        metradoE: stats.metradoE,
        avance,
        costoPorUnidad,
        costo: stats.costo
      };
    });

    // Ordenar por metrado ejecutado (descendente)
    return actividades.sort((a, b) => b.metradoE - a.metradoE).slice(0, 5);
  }, [reports, loading]);

  // Si está cargando, mostrar placeholders
  if (loading) {
    return (
      <div className="tab-pane fade show active">
        <div className="loading-container">
          <div className="loader"></div>
          <p>Cargando datos...</p>
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
    <div className="tab-pane fade show active" id="overview">
      <div className="row">
        <div className="col-md-8">
          <div className="card mb-4">
            <div className="card-header">
              <h5>Tendencia de Avance por Semana</h5>
            </div>
            <div className="card-body">
              <div className="chart-container">
                <LineChart 
                  labels={avanceData.labels} 
                  datasets={[
                    {
                      label: 'Avance Promedio (%)',
                      data: avanceData.avances,
                      borderColor: 'rgba(24, 78, 142, 1)',
                      backgroundColor: 'rgba(24, 78, 142, 0.1)'
                    }
                  ]}
                  yAxisTitle="Avance (%)"
                  beginAtZero={true}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card mb-4">
            <div className="card-header">
              <h5>Distribución de Categorías</h5>
            </div>
            <div className="card-body">
              <div className="chart-container" style={{ height: '220px' }}>
                <DoughnutChart 
                  labels={categoriasData.labels} 
                  data={categoriasData.data}
                  colors={categoriasData.labels.map(cat => {
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
              <h5>Subcontratistas/Bloques por Avance</h5>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table mb-0">
                  <thead>
                    <tr>
                      <th>Subcontratista/Bloque</th>
                      <th>Reportes</th>
                      <th>Avance</th>
                      <th>Costo Est.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subcontratistasData.labels.map((subcontratista, index) => {
                      // Determinar clase según el avance
                      let avanceClass = '';
                      const avance = subcontratistasData.avances[index];
                      if (avance >= 80) {
                        avanceClass = 'text-success';
                      } else if (avance >= 50) {
                        avanceClass = 'text-warning';
                      } else {
                        avanceClass = 'text-danger';
                      }
                      
                      return (
                        <tr key={subcontratista}>
                          <td>{subcontratista}</td>
                          <td>{subcontratistasData.reportes[index]}</td>
                          <td className={avanceClass}>{avance.toFixed(1)}%</td>
                          <td>S/ {subcontratistasData.costos[index].toFixed(2)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card mb-4">
            <div className="card-header">
              <h5>Top Actividades</h5>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table mb-0">
                  <thead>
                    <tr>
                      <th>Actividad</th>
                      <th>UND</th>
                      <th>Avance</th>
                      <th>Metrado E/P</th>
                      <th>Costo/UND</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topActividades.map((actividad) => {
                      // Determinar clase según el avance
                      let avanceClass = '';
                      if (actividad.avance >= 80) {
                        avanceClass = 'text-success';
                      } else if (actividad.avance >= 50) {
                        avanceClass = 'text-warning';
                      } else {
                        avanceClass = 'text-danger';
                      }
                      
                      return (
                        <tr key={actividad.nombre}>
                          <td>{actividad.nombre}</td>
                          <td>{actividad.unidad}</td>
                          <td className={avanceClass}>{actividad.avance.toFixed(1)}%</td>
                          <td>{actividad.metradoE.toFixed(2)}/{actividad.metradoP.toFixed(2)}</td>
                          <td>S/ {actividad.costoPorUnidad.toFixed(2)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="row">
        <div className="col-12">
          <div className="card mb-4">
            <div className="card-header">
              <h5>Resumen de Productividad Semanal</h5>
            </div>
            <div className="card-body">
              <div className="chart-container">
                <BarChart 
                  labels={avanceData.labels}
                  datasets={[
                    {
                      label: 'Productividad Semanal',
                      data: avanceData.avances,
                      backgroundColor: 'rgba(57, 73, 171, 0.7)'
                    }
                  ]}
                  yAxisTitle="Productividad (%)"
                  beginAtZero={true}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TabVisión;