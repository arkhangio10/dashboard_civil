// src/components/dashboard/TabActividades.tsx
import React, { useMemo, useState } from 'react';
import { ReportDetail } from '../../hooks/useKPIData';
import BarChart from '../charts/BarChart';
import './TabActividades.scss';

interface TabActividadesProps {
  reports: ReportDetail[];
  loading: boolean;
}

interface ActivityModalData {
  activity: string | null;
  data: ActivityDetail | null;
  show: boolean;
}

interface ActivityDetail {
  nombre: string;
  unidad: string;
  metradoP: number;
  metradoE: number;
  avance: number;
  costo: number;
  costoPorUnidad: number;
  reportes: {
    fecha: string;
    metradoP: number;
    metradoE: number;
    avance: number;
    horas: number;
    costo: number;
    causas?: string;
  }[];
  trabajadores: number;
  horasTotales: number;
  productividad: number;
}

const TabActividades: React.FC<TabActividadesProps> = ({ reports, loading }) => {
  // Estado para el modal de detalles de actividad
  const [modalData, setModalData] = useState<ActivityModalData>({
    activity: null,
    data: null,
    show: false
  });

  // Costos por categoría (en soles por hora)
  const costosPorCategoria: {[key: string]: number} = {
    'OPERARIO': 23.00,
    'OFICIAL': 18.09,
    'PEON': 16.38
  };

  // Datos para la tabla de actividades
  const actividadesData = useMemo(() => {
    if (loading || reports.length === 0) {
      return [];
    }

    // Agrupar datos por actividad
    const actividadesStats: {
      [key: string]: {
        unidad: string;
        metradoP: number;
        metradoE: number;
        costo: number;
        reportes: Set<string>;
        trabajadoresPorReporte: {[key: string]: Set<string>};
        horasTotales: number;
        reportesDetalle: {
          fecha: string;
          metradoP: number;
          metradoE: number;
          avance: number;
          horas: number;
          costo: number;
          causas?: string;
        }[];
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
            unidad,
            metradoP: 0,
            metradoE: 0,
            costo: 0,
            reportes: new Set<string>(),
            trabajadoresPorReporte: {},
            horasTotales: 0,
            reportesDetalle: []
          };
        }
        
        actividadesStats[actividad].metradoP += metradoP;
        actividadesStats[actividad].metradoE += metradoE;
        actividadesStats[actividad].reportes.add(report.id);
        
        // Inicializar conjunto de trabajadores para este reporte si no existe
        if (!actividadesStats[actividad].trabajadoresPorReporte[report.id]) {
          actividadesStats[actividad].trabajadoresPorReporte[report.id] = new Set<string>();
        }
        
        // Calcular costo y horas para esta actividad en este reporte
        let costoActividad = 0;
        let horasActividad = 0;
        
        report.manoObra.forEach(trab => {
          if (!trab.categoria || !Array.isArray(trab.horas) || !trab.horas[actIndex]) return;
          
          const horas = parseFloat(trab.horas[actIndex]) || 0;
          if (horas <= 0) return;
          
          horasActividad += horas;
          actividadesStats[actividad].horasTotales += horas;
          
          // Agregar trabajador al conjunto
          if (trab.trabajador) {
            actividadesStats[actividad].trabajadoresPorReporte[report.id].add(trab.trabajador);
          }
          
          const costoPorHora = costosPorCategoria[trab.categoria] || 18.00;
          costoActividad += horas * costoPorHora;
        });
        
        actividadesStats[actividad].costo += costoActividad;
        
        // Agregar detalle del reporte
        const avance = metradoP > 0 ? (metradoE / metradoP) * 100 : 0;
        
        actividadesStats[actividad].reportesDetalle.push({
          fecha: report.fecha,
          metradoP,
          metradoE,
          avance,
          horas: horasActividad,
          costo: costoActividad,
          causas: act.causas
        });
      });
    });

    // Calcular avance, costo por unidad y contador de trabajadores únicos
    const actividades = Object.entries(actividadesStats).map(([nombre, stats]) => {
      const avance = stats.metradoP > 0 ? (stats.metradoE / stats.metradoP) * 100 : 0;
      const costoPorUnidad = stats.metradoE > 0 ? stats.costo / stats.metradoE : 0;
      
      // Contar trabajadores únicos en todos los reportes
      const trabajadoresUnicos = new Set<string>();
      Object.values(stats.trabajadoresPorReporte).forEach(conjuntoTrabajadores => {
        conjuntoTrabajadores.forEach(trab => trabajadoresUnicos.add(trab));
      });
      
      // Calcular productividad (metrado por hora)
      const productividad = stats.horasTotales > 0 ? stats.metradoE / stats.horasTotales : 0;
      
      // Ordenar reportes por fecha
      const reportesOrdenados = [...stats.reportesDetalle].sort((a, b) => {
        return new Date(b.fecha).getTime() - new Date(a.fecha).getTime();
      });
      
      return {
        nombre,
        unidad: stats.unidad,
        metradoP: stats.metradoP,
        metradoE: stats.metradoE,
        avance,
        costo: stats.costo,
        costoPorUnidad,
        reportes: stats.reportes.size,
        reportesDetalle: reportesOrdenados,
        trabajadores: trabajadoresUnicos.size,
        horasTotales: stats.horasTotales,
        productividad
      };
    });

    // Ordenar por metrado ejecutado (descendente)
    return actividades.sort((a, b) => b.metradoE - a.metradoE);
  }, [reports, loading]);

  // Datos para el gráfico de Avance vs Costo
  const avanceCostoData = useMemo(() => {
    if (loading || reports.length === 0 || actividadesData.length === 0) {
      return { nombres: [], avances: [], costos: [], metrados: [] };
    }

    // Tomar las top 10 actividades por metrado ejecutado
    const topActividades = [...actividadesData].sort((a, b) => b.metradoE - a.metradoE).slice(0, 10);

    return {
      nombres: topActividades.map(act => act.nombre),
      avances: topActividades.map(act => act.avance),
      costos: topActividades.map(act => act.costoPorUnidad),
      metrados: topActividades.map(act => act.metradoE)
    };
  }, [actividadesData, loading]);

  // Datos para el gráfico de Distribución de Metrado por Actividad
  const metradoActividadData = useMemo(() => {
    if (loading || reports.length === 0 || actividadesData.length === 0) {
      return { nombres: [], metrados: [], unidades: [] };
    }

    // Tomar las top 8 actividades por metrado ejecutado
    const topActividades = [...actividadesData].sort((a, b) => b.metradoE - a.metradoE).slice(0, 8);

    return {
      nombres: topActividades.map(act => act.nombre),
      metrados: topActividades.map(act => act.metradoE),
      unidades: topActividades.map(act => act.unidad)
    };
  }, [actividadesData, loading]);

  // Función para ver detalles de una actividad
  const viewActivityDetails = (activityName: string) => {
    const activityData = actividadesData.find(act => act.nombre === activityName);
    
    if (activityData) {
      setModalData({
        activity: activityName,
        data: activityData,
        show: true
      });
    }
  };

  // Función para cerrar el modal
  const closeModal = () => {
    setModalData({
      activity: null,
      data: null,
      show: false
    });
  };

  // Formatear fecha
  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES');
  };

  // Si está cargando, mostrar placeholders
  if (loading) {
    return (
      <div className="tab-pane fade show active">
        <div className="loading-container">
          <div className="loader"></div>
          <p>Cargando datos de actividades...</p>
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
    <div className="tab-pane fade show active" id="activities">
      <div className="card">
        <div className="card-header">
          <h5>Métricas por Actividad</h5>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table mb-0">
              <thead>
                <tr>
                  <th>Actividad</th>
                  <th>UND</th>
                  <th>Metrado P.</th>
                  <th>Metrado E.</th>
                  <th>Avance</th>
                  <th>Costo Est.</th>
                  <th>Costo/UND</th>
                  <th>Reportes</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {actividadesData.map(actividad => {
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
                      <td>{actividad.metradoP.toFixed(2)}</td>
                      <td>{actividad.metradoE.toFixed(2)}</td>
                      <td className={avanceClass}>{actividad.avance.toFixed(1)}%</td>
                      <td>S/ {actividad.costo.toFixed(2)}</td>
                      <td>S/ {actividad.costoPorUnidad.toFixed(2)}</td>
                      <td>{actividad.reportes}</td>
                      <td>
                        <button 
                          className="btn btn-sm btn-primary view-activity"
                          onClick={() => viewActivityDetails(actividad.nombre)}
                        >
                          <i className="fas fa-search"></i>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      <div className="row mt-4">
        <div className="col-md-6">
          <div className="card mb-4">
            <div className="card-header">
              <h5>Avance vs. Costo por Actividad</h5>
            </div>
            <div className="card-body">
              <div className="chart-container">
                <BarChart 
                  labels={avanceCostoData.nombres}
                  datasets={[
                    {
                      label: 'Avance (%)',
                      data: avanceCostoData.avances,
                      backgroundColor: 'rgba(40, 167, 69, 0.7)'
                    },
                    {
                      label: 'Costo/Unidad (S/)',
                      data: avanceCostoData.costos,
                      backgroundColor: 'rgba(220, 53, 69, 0.7)'
                    }
                  ]}
                  height={400}
                  xAxisTitle="Actividades"
                  yAxisTitle="Valor"
                  maxBarThickness={30}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card mb-4">
            <div className="card-header">
              <h5>Distribución de Metrado por Actividad</h5>
            </div>
            <div className="card-body">
              <div className="chart-container">
                <BarChart 
                  labels={metradoActividadData.nombres}
                  datasets={[
                    {
                      label: 'Metrado Ejecutado',
                      data: metradoActividadData.metrados,
                      backgroundColor: metradoActividadData.nombres.map((_, index) => {
                        const hue = index * 30 % 360; // Distribuir colores en el espectro
                        return `hsla(${hue}, 70%, 60%, 0.7)`;
                      })
                    }
                  ]}
                  height={400}
                  yAxisTitle="Metrado"
                  beginAtZero={true}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal para detalles de actividad */}
      {modalData.show && modalData.data && (
        <div className="activity-modal-backdrop" onClick={closeModal}>
          <div className="activity-modal-content" onClick={e => e.stopPropagation()}>
            <div className="activity-modal-header">
              <h5 className="activity-modal-title">Detalles de Actividad: {modalData.activity}</h5>
              <button type="button" className="btn-close" onClick={closeModal}></button>
            </div>
            <div className="activity-modal-body">
              <div className="mb-4">
                <h5 className="mb-3">Resumen</h5>
                <div className="row">
                  <div className="col-md-6">
                    <ul className="list-group">
                      <li className="list-group-item"><strong>Reportes:</strong> {modalData.data.reportes}</li>
                      <li className="list-group-item"><strong>Metrado Programado Total:</strong> {modalData.data.metradoP.toFixed(2)}</li>
                      <li className="list-group-item"><strong>Metrado Ejecutado Total:</strong> {modalData.data.metradoE.toFixed(2)}</li>
                      <li className="list-group-item"><strong>Avance Total:</strong> {modalData.data.avance.toFixed(1)}%</li>
                    </ul>
                  </div>
                  <div className="col-md-6">
                    <ul className="list-group">
                      <li className="list-group-item"><strong>Trabajadores Involucrados:</strong> {modalData.data.trabajadores}</li>
                      <li className="list-group-item"><strong>Horas Totales:</strong> {modalData.data.horasTotales.toFixed(1)}</li>
                      <li className="list-group-item"><strong>Costo Total:</strong> S/ {modalData.data.costo.toFixed(2)}</li>
                      <li className="list-group-item"><strong>Costo/Unidad:</strong> S/ {modalData.data.costoPorUnidad.toFixed(2)}</li>
                      <li className="list-group-item"><strong>Productividad:</strong> {modalData.data.productividad.toFixed(2)} unidades/hora</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div>
                <h5 className="mb-3">Detalle por Reporte</h5>
                <div className="table-responsive">
                  <table className="table table-bordered">
                    <thead>
                      <tr>
                        <th>Fecha</th>
                        <th>Metrado P.</th>
                        <th>Metrado E.</th>
                        <th>Avance</th>
                        <th>Horas</th>
                        <th>Costo</th>
                        <th>Causas</th>
                      </tr>
                    </thead>
                    <tbody>
                      {modalData.data.reportesDetalle.map((rep, index) => {
                        // Determinar clase según el avance
                        let avanceClass = '';
                        if (rep.avance >= 80) {
                          avanceClass = 'text-success';
                        } else if (rep.avance >= 50) {
                          avanceClass = 'text-warning';
                        } else {
                          avanceClass = 'text-danger';
                        }
                        
                        return (
                          <tr key={index}>
                            <td>{formatDate(rep.fecha)}</td>
                            <td>{rep.metradoP.toFixed(2)}</td>
                            <td>{rep.metradoE.toFixed(2)}</td>
                            <td className={avanceClass}>{rep.avance.toFixed(1)}%</td>
                            <td>{rep.horas.toFixed(1)}</td>
                            <td>S/ {rep.costo.toFixed(2)}</td>
                            <td>{rep.causas || ''}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <div className="activity-modal-footer">
              <button type="button" className="btn btn-secondary" onClick={closeModal}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TabActividades;