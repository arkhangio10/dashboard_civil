// src/components/dashboard/TabManoObra.tsx
import React, { useMemo } from 'react';
import { ReportDetail } from '../../hooks/useKPIData';
import BarChart from '../charts/BarChart';
import DoughnutChart from '../charts/DoughnutChart';
import LineChart from '../charts/LineChart';
import './TabManoObra.scss';

interface TabManoObraProps {
  reports: ReportDetail[];
  loading: boolean;
}

const TabManoObra: React.FC<TabManoObraProps> = ({ reports, loading }) => {
  // Costos por categoría (en soles por hora)
  const costosPorCategoria: {[key: string]: number} = {
    'OPERARIO': 23.00,
    'OFICIAL': 18.09,
    'PEON': 16.38
  };

  // Datos para gráfico de horas por categoría
  const horasPorCategoriaData = useMemo(() => {
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

    // Ordenar por cantidad de horas (descendente)
    const sortedData = Object.entries(horasPorCategoria)
      .sort((a, b) => b[1] - a[1]);
    
    return {
      labels: sortedData.map(d => d[0]),
      data: sortedData.map(d => d[1])
    };
  }, [reports, loading]);

  // Datos para la tabla de resumen por categoría
  const categoriaSummaryData = useMemo(() => {
    if (loading || reports.length === 0) {
      return [];
    }

    // Agrupar datos por categoría
    const categoriaStats: {
      [key: string]: {
        trabajadores: Set<string>;
        horasTotales: number;
        costo: number;
      };
    } = {};
    
    reports.forEach(report => {
      report.manoObra.forEach(trab => {
        if (!trab.categoria || !Array.isArray(trab.horas)) return;
        
        const categoria = trab.categoria;
        const totalHoras = trab.horas.reduce((sum, h) => sum + (parseFloat(h) || 0), 0);
        
        if (!categoriaStats[categoria]) {
          categoriaStats[categoria] = {
            trabajadores: new Set<string>(),
            horasTotales: 0,
            costo: 0
          };
        }
        
        if (trab.trabajador) {
          categoriaStats[categoria].trabajadores.add(trab.trabajador);
        }
        categoriaStats[categoria].horasTotales += totalHoras;
        
        const costoPorHora = costosPorCategoria[categoria] || 18.00;
        categoriaStats[categoria].costo += totalHoras * costoPorHora;
      });
    });

    // Convertir a array para tabla
    const categoriasArray = Object.entries(categoriaStats).map(([categoria, stats]) => {
      const promedioHHPorTrab = stats.trabajadores.size > 0 ? 
        stats.horasTotales / stats.trabajadores.size : 0;
      
      return {
        categoria,
        trabajadores: stats.trabajadores.size,
        horasTotales: stats.horasTotales,
        promedioHHPorTrab,
        costo: stats.costo
      };
    });

    // Ordenar por costo total (descendente)
    return categoriasArray.sort((a, b) => b.costo - a.costo);
  }, [reports, loading]);

  // Datos para tabla de top trabajadores
  const topTrabajadoresData = useMemo(() => {
    if (loading || reports.length === 0) {
      return [];
    }

    // Agrupar datos por trabajador
    const trabajadorStats: {
      [key: string]: {
        categoria: string;
        horasTotales: number;
        reportes: Set<string>;
        actividadHoras: {[key: string]: number};
        metradoAsociado: number;
      };
    } = {};
    
    reports.forEach(report => {
      report.manoObra.forEach(trab => {
        if (!trab.trabajador || !trab.categoria || !Array.isArray(trab.horas)) return;
        
        const trabajador = trab.trabajador;
        const categoria = trab.categoria;
        const totalHoras = trab.horas.reduce((sum, h) => sum + (parseFloat(h) || 0), 0);
        
        if (!trabajadorStats[trabajador]) {
          trabajadorStats[trabajador] = {
            categoria,
            horasTotales: 0,
            reportes: new Set<string>(),
            actividadHoras: {},
            metradoAsociado: 0
          };
        }
        
        trabajadorStats[trabajador].horasTotales += totalHoras;
        trabajadorStats[trabajador].reportes.add(report.id);
        
        // Contabilizar horas por actividad
        report.actividades.forEach((act, idx) => {
          if (!act.proceso) return;
          
          const actividad = act.proceso;
          const horas = parseFloat(trab.horas[idx]) || 0;
          
          if (horas <= 0) return;
          
          if (!trabajadorStats[trabajador].actividadHoras[actividad]) {
            trabajadorStats[trabajador].actividadHoras[actividad] = 0;
          }
          
          trabajadorStats[trabajador].actividadHoras[actividad] += horas;
          
          // Asociar metrado proporcional
          const metradoE = parseFloat(String(act.metradoE)) || 0;
          if (metradoE <= 0) return;
          
          const totalHorasActividad = report.manoObra.reduce((sum, mo) => {
            if (Array.isArray(mo.horas) && mo.horas[idx]) {
              return sum + (parseFloat(mo.horas[idx]) || 0);
            }
            return sum;
          }, 0);
          
          if (totalHorasActividad > 0) {
            const contribucion = horas / totalHorasActividad;
            const metradoContribucion = metradoE * contribucion;
            trabajadorStats[trabajador].metradoAsociado += metradoContribucion;
          }
        });
      });
    });

    // Calcular costo y productividad
    const trabajadores = Object.entries(trabajadorStats).map(([nombre, stats]) => {
      const costoPorHora = costosPorCategoria[stats.categoria] || 18.00;
      const costo = stats.horasTotales * costoPorHora;
      const productividad = stats.horasTotales > 0 ? stats.metradoAsociado / stats.horasTotales : 0;
      
      // Determinar actividad principal
      const actividadPrincipal = Object.entries(stats.actividadHoras)
        .sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
      
      return {
        nombre,
        categoria: stats.categoria,
        horasTotales: stats.horasTotales,
        costo,
        reportes: stats.reportes.size,
        actividadPrincipal,
        productividad
      };
    });

    // Ordenar por horas totales (descendente)
    return trabajadores.sort((a, b) => b.horasTotales - a.horasTotales).slice(0, 20);
  }, [reports, loading]);

  // Datos para gráfico de eficiencia por categoría
  const eficienciaPorCategoriaData = useMemo(() => {
    if (loading || reports.length === 0) {
      return { labels: [], eficiencias: [], productividades: [] };
    }

    // Agrupar datos por categoría
    const categoriaStats: {
      [key: string]: {
        horasTotales: number;
        metradoAsociado: number;
        sumAvance: number;
        countAvance: number;
      };
    } = {};
    
    reports.forEach(report => {
      // Calcular avance por actividad
      const avancePorActividad: {[key: string]: number} = {};
      report.actividades.forEach(act => {
        if (!act.proceso) return;
        
        const metradoP = parseFloat(String(act.metradoP)) || 0;
        const metradoE = parseFloat(String(act.metradoE)) || 0;
        
        if (metradoP > 0) {
          avancePorActividad[act.proceso] = (metradoE / metradoP) * 100;
        }
      });
      
      // Procesar trabajadores
      report.manoObra.forEach(trab => {
        if (!trab.categoria || !Array.isArray(trab.horas)) return;
        
        const categoria = trab.categoria;
        
        if (!categoriaStats[categoria]) {
          categoriaStats[categoria] = {
            horasTotales: 0,
            metradoAsociado: 0,
            sumAvance: 0,
            countAvance: 0
          };
        }
        
        // Procesar horas por actividad
        report.actividades.forEach((act, idx) => {
          if (!act.proceso) return;
          
          const actividad = act.proceso;
          const horas = parseFloat(trab.horas[idx]) || 0;
          
          if (horas <= 0) return;
          
          categoriaStats[categoria].horasTotales += horas;
          
          // Asociar metrado proporcional
          const metradoE = parseFloat(String(act.metradoE)) || 0;
          if (metradoE > 0) {
            const totalHorasActividad = report.manoObra.reduce((sum, mo) => {
              if (Array.isArray(mo.horas) && mo.horas[idx]) {
                return sum + (parseFloat(mo.horas[idx]) || 0);
              }
              return sum;
            }, 0);
            
            if (totalHorasActividad > 0) {
              const contribucion = horas / totalHorasActividad;
              const metradoContribucion = metradoE * contribucion;
              categoriaStats[categoria].metradoAsociado += metradoContribucion;
            }
          }
          
          // Asociar avance
          if (avancePorActividad[actividad]) {
            categoriaStats[categoria].sumAvance += avancePorActividad[actividad];
            categoriaStats[categoria].countAvance++;
          }
        });
      });
    });

    // Calcular eficiencia y productividad
    const categorias = Object.entries(categoriaStats).map(([nombre, stats]) => {
      const productividad = stats.horasTotales > 0 ? stats.metradoAsociado / stats.horasTotales : 0;
      const avancePromedio = stats.countAvance > 0 ? stats.sumAvance / stats.countAvance : 0;
      const costoPorHora = costosPorCategoria[nombre] || 18.00;
      
      // Índice de eficiencia (relación entre avance y costo)
      const eficiencia = avancePromedio > 0 ? (avancePromedio / (costoPorHora * productividad)) * 10 : 0;
      
      return {
        nombre,
        productividad,
        eficiencia
      };
    });

    // Ordenar por eficiencia (descendente)
    categorias.sort((a, b) => b.eficiencia - a.eficiencia);
    
    return {
      labels: categorias.map(c => c.nombre),
      eficiencias: categorias.map(c => c.eficiencia),
      productividades: categorias.map(c => c.productividad)
    };
  }, [reports, loading]);

  // Si está cargando, mostrar placeholders
  if (loading) {
    return (
      <div className="tab-pane fade show active">
        <div className="loading-container">
          <div className="loader"></div>
          <p>Cargando datos de mano de obra...</p>
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
    <div className="tab-pane fade show active" id="workforce">
      <div className="row">
        <div className="col-md-7">
          <div className="card mb-4">
            <div className="card-header">
              <h5>Horas por Categoría de Trabajador</h5>
            </div>
            <div className="card-body">
              <div className="chart-container">
                <BarChart 
                  labels={horasPorCategoriaData.labels}
                  datasets={[
                    {
                      label: 'Horas',
                      data: horasPorCategoriaData.data,
                      backgroundColor: horasPorCategoriaData.labels.map(cat => {
                        if (cat === 'OPERARIO') return 'rgba(40, 167, 69, 0.7)';
                        if (cat === 'OFICIAL') return 'rgba(23, 162, 184, 0.7)';
                        if (cat === 'PEON') return 'rgba(255, 193, 7, 0.7)';
                        return 'rgba(108, 117, 125, 0.7)';
                      })
                    }
                  ]}
                  height={300}
                  yAxisTitle="Horas Totales"
                />
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-5">
          <div className="card mb-4">
            <div className="card-header">
              <h5>Resumen por Categoría</h5>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table mb-0">
                  <thead>
                    <tr>
                      <th>Categoría</th>
                      <th>Trabajadores</th>
                      <th>Horas Totales</th>
                      <th>Promedio HH/Trab.</th>
                      <th>Costo Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categoriaSummaryData.map(cat => (
                      <tr key={cat.categoria}>
                        <td>
                          <span className={`category-badge category-${cat.categoria.toLowerCase().replace(/\s+/g, '')}`}>
                            {cat.categoria}
                          </span>
                        </td>
                        <td>{cat.trabajadores}</td>
                        <td>{cat.horasTotales.toFixed(1)}</td>
                        <td>{cat.promedioHHPorTrab.toFixed(1)}</td>
                        <td>S/ {cat.costo.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="card">
        <div className="card-header">
          <h5>Top Trabajadores</h5>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table mb-0">
              <thead>
                <tr>
                  <th>Trabajador</th>
                  <th>Categoría</th>
                  <th>Horas Totales</th>
                  <th>Costo Est.</th>
                  <th>Reportes</th>
                  <th>Actividad Principal</th>
                  <th>Productividad</th>
                </tr>
              </thead>
              <tbody>
                {topTrabajadoresData.map(trab => {
                  // Determinar clase según la productividad
                  let productividadClass = '';
                  if (trab.productividad > 0.5) {
                    productividadClass = 'productivity-high';
                  } else if (trab.productividad > 0.2) {
                    productividadClass = 'productivity-mid';
                  } else {
                    productividadClass = 'productivity-low';
                  }
                  
                  return (
                    <tr key={trab.nombre}>
                      <td>{trab.nombre}</td>
                      <td>
                        <span className={`category-badge category-${trab.categoria.toLowerCase().replace(/\s+/g, '')}`}>
                          {trab.categoria}
                        </span>
                      </td>
                      <td>{trab.horasTotales.toFixed(1)}</td>
                      <td>S/ {trab.costo.toFixed(2)}</td>
                      <td>{trab.reportes}</td>
                      <td>{trab.actividadPrincipal}</td>
                      <td className={productividadClass}>{trab.productividad.toFixed(2)} u/h</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      <div className="row mt-4">
        <div className="col-12">
          <div className="card mb-4">
            <div className="card-header">
              <h5>Eficiencia por Categoría de Trabajador</h5>
            </div>
            <div className="card-body">
              <div className="chart-container">
                <BarChart 
                  labels={eficienciaPorCategoriaData.labels}
                  datasets={[
                    {
                      label: 'Índice de Eficiencia',
                      data: eficienciaPorCategoriaData.eficiencias,
                      backgroundColor: 'rgba(40, 167, 69, 0.7)'
                    },
                    {
                      label: 'Productividad (u/h)',
                      data: eficienciaPorCategoriaData.productividades,
                      backgroundColor: 'rgba(23, 162, 184, 0.7)'
                    }
                  ]}
                  height={350}
                  yAxisTitle="Valor"
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

export default TabManoObra;