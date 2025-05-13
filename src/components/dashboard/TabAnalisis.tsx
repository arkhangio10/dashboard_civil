// src/components/dashboard/TabAnalisis.tsx
import React, { useMemo, useState } from 'react';
import { ReportDetail } from '../../hooks/useKPIData';
import LineChart from '../charts/LineChart';
import BarChart from '../charts/BarChart';
import './TabAnalisis.scss';

interface TabAnalisisProps {
  reports: ReportDetail[];
  loading: boolean;
}

interface Prediction {
  fecha: string;
  valor: number;
}

const TabAnalisis: React.FC<TabAnalisisProps> = ({ reports, loading }) => {
  // Estado para controlar la visualización
  const [showPredictions, setShowPredictions] = useState(false);
  const [predictionDays, setPredictionDays] = useState(30);
  const [selectedMetric, setSelectedMetric] = useState('avance');

  // Datos de tendencia de avance
  const avanceTendencia = useMemo(() => {
    if (loading || reports.length === 0) {
      return { labels: [], valores: [] };
    }

    // Agrupar datos por fecha
    const datosPorFecha: {
      [key: string]: {
        fecha: Date;
        sumAvance: number;
        countAvance: number;
        totalMetradoE: number;
        costo: number;
      };
    } = {};

    reports.forEach(report => {
      const fecha = new Date(report.fecha);
      const fechaStr = fecha.toISOString().split('T')[0];
      
      if (!datosPorFecha[fechaStr]) {
        datosPorFecha[fechaStr] = {
          fecha,
          sumAvance: 0,
          countAvance: 0,
          totalMetradoE: 0,
          costo: 0
        };
      }
      
      // Calcular avance
      report.actividades.forEach(act => {
        const metradoP = parseFloat(String(act.metradoP)) || 0;
        const metradoE = parseFloat(String(act.metradoE)) || 0;
        
        if (metradoP > 0) {
          datosPorFecha[fechaStr].sumAvance += (metradoE / metradoP) * 100;
          datosPorFecha[fechaStr].countAvance++;
        }
        
        datosPorFecha[fechaStr].totalMetradoE += metradoE;
      });
      
      // Calcular costo
      const costosPorCategoria: {[key: string]: number} = {
        'OPERARIO': 23.00,
        'OFICIAL': 18.09,
        'PEON': 16.38
      };
      
      report.manoObra.forEach(trab => {
        if (!trab.categoria || !Array.isArray(trab.horas)) return;
        
        const categoria = trab.categoria;
        const totalHoras = trab.horas.reduce((sum, h) => sum + (parseFloat(h) || 0), 0);
        
        const costoPorHora = costosPorCategoria[categoria] || 18.00;
        datosPorFecha[fechaStr].costo += totalHoras * costoPorHora;
      });
    });

    // Ordenar por fecha (ascendente)
    const datosOrdenados = Object.values(datosPorFecha).sort((a, b) => a.fecha.getTime() - b.fecha.getTime());
    
    return {
      labels: datosOrdenados.map(d => d.fecha.toLocaleDateString('es-ES')),
      valores: datosOrdenados.map(d => {
        if (selectedMetric === 'avance') {
          return d.countAvance > 0 ? d.sumAvance / d.countAvance : 0;
        } else if (selectedMetric === 'metrado') {
          return d.totalMetradoE;
        } else {
          // Costo
          return d.costo;
        }
      })
    };
  }, [reports, loading, selectedMetric]);

  // Calcular predicciones basadas en regresión lineal simple
  const predicciones = useMemo(() => {
    if (!showPredictions || loading || avanceTendencia.valores.length < 5) {
      return [];
    }

    // Datos para regresión
    const x = Array.from({ length: avanceTendencia.valores.length }, (_, i) => i);
    const y = avanceTendencia.valores;
    
    // Calcular regresión lineal
    // y = mx + b
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
    const n = x.length;
    
    for (let i = 0; i < n; i++) {
      sumX += x[i];
      sumY += y[i];
      sumXY += x[i] * y[i];
      sumX2 += x[i] * x[i];
    }
    
    const m = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const b = (sumY - m * sumX) / n;
    
    // Generar predicciones
    const predicciones: Prediction[] = [];
    const ultimaFecha = new Date(reports[reports.length - 1].fecha);
    
    for (let i = 1; i <= predictionDays; i++) {
      const nextDate = new Date(ultimaFecha);
      nextDate.setDate(nextDate.getDate() + i);
      
      const valorPredicho = m * (n + i - 1) + b;
      
      predicciones.push({
        fecha: nextDate.toLocaleDateString('es-ES'),
        valor: valorPredicho > 0 ? valorPredicho : 0
      });
    }
    
    return predicciones;
  }, [showPredictions, predictionDays, avanceTendencia, reports, loading]);

  // Calcular correlaciones entre variables
  const correlaciones = useMemo(() => {
    if (loading || reports.length < 5) {
      return [];
    }

    const vars = [
      { nombre: 'Num. Trabajadores', valor: [] as number[] },
      { nombre: 'Horas Totales', valor: [] as number[] },
      { nombre: 'Avance', valor: [] as number[] },
      { nombre: 'Costo', valor: [] as number[] }
    ];
    
    // Recopilar datos por reporte
    reports.forEach(report => {
      // Contar trabajadores únicos
      const trabajadoresUnicos = new Set<string>();
      report.manoObra.forEach(trab => {
        if (trab.trabajador) {
          trabajadoresUnicos.add(trab.trabajador);
        }
      });
      vars[0].valor.push(trabajadoresUnicos.size);
      
      // Calcular horas totales
      let horasTotales = 0;
      report.manoObra.forEach(trab => {
        if (Array.isArray(trab.horas)) {
          horasTotales += trab.horas.reduce((sum, h) => sum + (parseFloat(h) || 0), 0);
        }
      });
      vars[1].valor.push(horasTotales);
      
      // Calcular avance promedio
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
      vars[2].valor.push(countAvance > 0 ? sumAvance / countAvance : 0);
      
      // Calcular costo
      let costo = 0;
      const costosPorCategoria: {[key: string]: number} = {
        'OPERARIO': 23.00,
        'OFICIAL': 18.09,
        'PEON': 16.38
      };
      
      report.manoObra.forEach(trab => {
        if (!trab.categoria || !Array.isArray(trab.horas)) return;
        
        const categoria = trab.categoria;
        const totalHoras = trab.horas.reduce((sum, h) => sum + (parseFloat(h) || 0), 0);
        
        const costoPorHora = costosPorCategoria[categoria] || 18.00;
        costo += totalHoras * costoPorHora;
      });
      vars[3].valor.push(costo);
    });
    
    // Calcular correlaciones entre todas las variables
    const correlations: { var1: string; var2: string; correlation: number }[] = [];
    
    for (let i = 0; i < vars.length; i++) {
      for (let j = i + 1; j < vars.length; j++) {
        const x = vars[i].valor;
        const y = vars[j].valor;
        
        // Calcular correlación de Pearson
        let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
        const n = Math.min(x.length, y.length);
        
        for (let k = 0; k < n; k++) {
          sumX += x[k];
          sumY += y[k];
          sumXY += x[k] * y[k];
          sumX2 += x[k] * x[k];
          sumY2 += y[k] * y[k];
        }
        
        const correlation = 
          (n * sumXY - sumX * sumY) / 
          (Math.sqrt(n * sumX2 - sumX * sumX) * Math.sqrt(n * sumY2 - sumY * sumY));
        
        correlations.push({
          var1: vars[i].nombre,
          var2: vars[j].nombre,
          correlation: isNaN(correlation) ? 0 : correlation
        });
      }
    }
    
    // Ordenar por correlación absoluta descendente
    return correlations.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));
  }, [reports, loading]);

  // Datos para productividad por categoría
  const productividadPorCategoria = useMemo(() => {
    if (loading || reports.length === 0) {
      return { categorias: [], productividad: [], metradoTotal: [] };
    }

    // Agrupar datos por categoría
    const datosPorCategoria: {
      [key: string]: {
        horasTotales: number;
        metradoTotal: number;
      };
    } = {};
    
    reports.forEach(report => {
      report.manoObra.forEach((trab, trabIndex) => {
        if (!trab.categoria || !Array.isArray(trab.horas)) return;
        
        const categoria = trab.categoria;
        
        if (!datosPorCategoria[categoria]) {
          datosPorCategoria[categoria] = {
            horasTotales: 0,
            metradoTotal: 0
          };
        }
        
        // Calcular horas totales
        const horasTrab = trab.horas.reduce((sum, h) => sum + (parseFloat(h) || 0), 0);
        datosPorCategoria[categoria].horasTotales += horasTrab;
        
        // Asignar metrado proporcional
        report.actividades.forEach((act, actIndex) => {
          const metradoE = parseFloat(String(act.metradoE)) || 0;
          const horasEnActividad = parseFloat(trab.horas[actIndex]) || 0;
          
          if (metradoE <= 0 || horasEnActividad <= 0) return;
          
          // Calcular horas totales de todos los trabajadores en esta actividad
          const horasTotalesActividad = report.manoObra.reduce((sum, worker) => {
            if (Array.isArray(worker.horas) && worker.horas[actIndex]) {
              return sum + (parseFloat(worker.horas[actIndex]) || 0);
            }
            return sum;
          }, 0);
          
          if (horasTotalesActividad > 0) {
            // Proporción de horas del trabajador en esta actividad
            const proporcion = horasEnActividad / horasTotalesActividad;
            // Metrado proporcional
            const metradoProporcional = metradoE * proporcion;
            
            datosPorCategoria[categoria].metradoTotal += metradoProporcional;
          }
        });
      });
    });
    
    // Calcular productividad (metrado/hora) por categoría
    const categorias = Object.keys(datosPorCategoria);
    const productividad = categorias.map(cat => {
      const datos = datosPorCategoria[cat];
      return datos.horasTotales > 0 ? datos.metradoTotal / datos.horasTotales : 0;
    });
    const metradoTotal = categorias.map(cat => datosPorCategoria[cat].metradoTotal);
    
    return {
      categorias,
      productividad,
      metradoTotal
    };
  }, [reports, loading]);

  // Si está cargando, mostrar placeholders
  if (loading) {
    return (
      <div className="tab-pane fade show active">
        <div className="loading-container">
          <div className="loader"></div>
          <p>Cargando datos para análisis...</p>
        </div>
      </div>
    );
  }

  // Si no hay datos suficientes, mostrar mensaje
  if (reports.length < 5) {
    return (
      <div className="tab-pane fade show active">
        <div className="alert alert-info">
          Se necesitan al menos 5 reportes para realizar análisis avanzados. Por favor, amplíe el rango de fechas o modifique los filtros.
        </div>
      </div>
    );
  }

  // Métricas disponibles para predicción
  const metricOptions = [
    { value: 'avance', label: 'Avance (%)' },
    { value: 'metrado', label: 'Metrado Ejecutado' },
    { value: 'costo', label: 'Costo' }
  ];

  // Título basado en la métrica seleccionada
  const getMetricTitle = () => {
    const option = metricOptions.find(opt => opt.value === selectedMetric);
    return option ? option.label : 'Avance (%)';
  };

  return (
    <div className="tab-pane fade show active" id="analytics">
      <div className="row mb-4">
        <div className="col-md-12">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5>Análisis Predictivo</h5>
              <div className="d-flex">
                <select 
                  className="form-select me-2"
                  value={selectedMetric}
                  onChange={(e) => setSelectedMetric(e.target.value)}
                >
                  {metricOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <div className="form-check form-switch me-3 d-flex align-items-center">
                  <input 
                    className="form-check-input me-2" 
                    type="checkbox" 
                    id="showPredictions"
                    checked={showPredictions}
                    onChange={(e) => setShowPredictions(e.target.checked)}
                  />
                  <label className="form-check-label" htmlFor="showPredictions">
                    Mostrar Predicciones
                  </label>
                </div>
                {showPredictions && (
                  <select 
                    className="form-select"
                    value={predictionDays}
                    onChange={(e) => setPredictionDays(Number(e.target.value))}
                  >
                    <option value="7">7 días</option>
                    <option value="15">15 días</option>
                    <option value="30">30 días</option>
                    <option value="60">60 días</option>
                    <option value="90">90 días</option>
                  </select>
                )}
              </div>
            </div>
            <div className="card-body">
              <div className="chart-container" style={{ height: '350px' }}>
                <LineChart 
                  labels={[
                    ...avanceTendencia.labels,
                    ...(showPredictions ? predicciones.map(p => p.fecha) : [])
                  ]}
                  datasets={[
                    {
                      label: `${getMetricTitle()} Histórico`,
                      data: avanceTendencia.valores,
                      borderColor: 'rgba(24, 78, 142, 1)',
                      backgroundColor: 'rgba(24, 78, 142, 0.1)',
                      fill: true
                    },
                    ...(showPredictions ? [{
                      label: `${getMetricTitle()} Predicción`,
                      data: [
                        ...Array(avanceTendencia.valores.length).fill(null),
                        ...predicciones.map(p => p.valor)
                      ],
                      borderColor: 'rgba(220, 53, 69, 1)',
                      backgroundColor: 'rgba(220, 53, 69, 0.1)',
                      borderDash: [5, 5],
                      pointRadius: 4,
                      fill: true
                    }] : [])
                  ]}
                  yAxisTitle={getMetricTitle()}
                  beginAtZero={true}
                />
              </div>
              {showPredictions && (
                <div className="mt-3 alert alert-info">
                  <i className="fas fa-info-circle me-2"></i>
                  Las predicciones se basan en regresión lineal simple y deben considerarse como una tendencia aproximada, no como valores exactos.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div className="row">
        <div className="col-md-6">
          <div className="card mb-4">
            <div className="card-header">
              <h5>Correlación entre Variables</h5>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table mb-0">
                  <thead>
                    <tr>
                      <th>Variable 1</th>
                      <th>Variable 2</th>
                      <th>Correlación</th>
                    </tr>
                  </thead>
                  <tbody>
                    {correlaciones.map((corr, index) => {
                      // Determinar clase según correlación
                      let corrClass = '';
                      const absCorr = Math.abs(corr.correlation);
                      if (absCorr >= 0.7) {
                        corrClass = 'text-success fw-bold';
                      } else if (absCorr >= 0.4) {
                        corrClass = 'text-warning';
                      } else {
                        corrClass = 'text-secondary';
                      }
                      
                      return (
                        <tr key={index}>
                          <td>{corr.var1}</td>
                          <td>{corr.var2}</td>
                          <td className={corrClass}>
                            {corr.correlation.toFixed(3)} {' '}
                            {corr.correlation > 0 ? 
                              <i className="fas fa-arrow-up text-success"></i> : 
                              <i className="fas fa-arrow-down text-danger"></i>
                            }
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="p-3">
                <div className="correlation-legend">
                  <div className="d-flex align-items-center mb-2">
                    <div className="correlation-strong me-2"></div>
                    <span>Correlación Fuerte (≥ 0.7): Fuerte relación entre variables</span>
                  </div>
                  <div className="d-flex align-items-center mb-2">
                    <div className="correlation-medium me-2"></div>
                    <span>Correlación Media (0.4 - 0.7): Relación moderada</span>
                  </div>
                  <div className="d-flex align-items-center">
                    <div className="correlation-weak me-2"></div>
                    <span>Correlación Débil (< 0.4): Poca o ninguna relación</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-md-6">
          <div className="card mb-4">
            <div className="card-header">
              <h5>Productividad por Categoría</h5>
            </div>
            <div className="card-body">
              <div className="chart-container" style={{ height: '300px' }}>
                <BarChart 
                  labels={productividadPorCategoria.categorias}
                  datasets={[
                    {
                      label: 'Productividad (Und/Hora)',
                      data: productividadPorCategoria.productividad,
                      backgroundColor: 'rgba(40, 167, 69, 0.7)'
                    }
                  ]}
                  yAxisTitle="Productividad"
                  beginAtZero={true}
                />
              </div>
              <div className="mt-3">
                <h6>Interpretación:</h6>
                <p className="mb-0">
                  La productividad se calcula como la cantidad de unidades de metrado ejecutado por hora de trabajo. 
                  A mayor valor, mayor eficiencia en términos de producción por hora.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="row">
        <div className="col-md-12">
          <div className="card mb-4">
            <div className="card-header">
              <h5>Conclusiones del Análisis</h5>
            </div>
            <div className="card-body">
              <div className="analysis-insights">
                <h6><i className="fas fa-chart-line me-2"></i>Tendencias</h6>
                <p>
                  La tendencia general muestra {
                    avanceTendencia.valores.length > 1 && 
                    avanceTendencia.valores[avanceTendencia.valores.length - 1] > avanceTendencia.valores[0] ? 
                      'un aumento' : 'una disminución'
                  } en el {getMetricTitle().toLowerCase()} durante el período analizado.
                  {showPredictions && predicciones.length > 0 && ` Se proyecta que esta tendencia ${
                    predicciones[predicciones.length - 1].valor > predicciones[0].valor ? 
                      'continuará al alza' : 'continuará a la baja'
                  } durante los próximos ${predictionDays} días.`}
                </p>
                
                <h6><i className="fas fa-users me-2"></i>Mano de Obra</h6>
                <p>
                  {(() => {
                    const maxProdIndex = productividadPorCategoria.productividad.indexOf(
                      Math.max(...productividadPorCategoria.productividad)
                    );
                    const maxProdCategoria = productividadPorCategoria.categorias[maxProdIndex];
                    
                    return `La categoría con mayor productividad es "${maxProdCategoria}" con ${
                      productividadPorCategoria.productividad[maxProdIndex].toFixed(2)
                    } unidades por hora.`;
                  })()}
                  
                  {correlaciones.length > 0 && correlaciones[0].correlation > 0.6 && 
                    ` Se observa una fuerte correlación entre ${correlaciones[0].var1} y ${correlaciones[0].var2} (${
                      correlaciones[0].correlation.toFixed(2)
                    }), lo que sugiere una relación significativa entre estas variables.`
                  }
                </p>
                
                <h6><i className="fas fa-lightbulb me-2"></i>Recomendaciones</h6>
                <ul>
                  <li>
                    <strong>Optimización de Recursos:</strong> {
                      productividadPorCategoria.productividad.some(p => p > 1) ?
                        'Considere aumentar la asignación de recursos hacia las categorías con mayor productividad para maximizar la eficiencia.' :
                        'La productividad general es baja. Considere revisar los procesos de trabajo y la asignación de tareas.'
                    }
                  </li>
                  <li>
                    <strong>Planificación:</strong> {
                      avanceTendencia.valores.length > 3 && 
                      avanceTendencia.valores.slice(-3).every((val, i, arr) => i === 0 || val >= arr[i-1]) ?
                        'Mantenga la estrategia actual, dado que se observa una tendencia positiva en los indicadores clave.' :
                        'Evalúe ajustar la estrategia actual, considerando que los indicadores muestran posibles áreas de mejora.'
                    }
                  </li>
                  <li>
                    <strong>Monitoreo Continuo:</strong> Continúe monitoreando especialmente la relación entre {
                      correlaciones.length > 0 ? 
                        `${correlaciones[0].var1.toLowerCase()} y ${correlaciones[0].var2.toLowerCase()}` : 
                        'horas trabajadas y avance'
                    } para identificar oportunidades de mejora.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TabAnalisis;