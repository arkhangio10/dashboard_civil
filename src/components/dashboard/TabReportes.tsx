// src/components/dashboard/TabReportes.tsx
import React, { useState } from 'react';
import { ReportDetail } from '../../hooks/useKPIData';
import { PaginationInfo } from '../../hooks/useKPIData';
import './TabReportes.scss';

interface TabReportesProps {
  reports: ReportDetail[];
  loading: boolean;
  pagination: PaginationInfo;
  onRefresh: () => Promise<void>;
}

interface ReportModalData {
  report: ReportDetail | null;
  show: boolean;
}

const TabReportes: React.FC<TabReportesProps> = ({ 
  reports, 
  loading, 
  pagination,
  onRefresh 
}) => {
  // Estado para el modal de detalles del reporte
  const [modalData, setModalData] = useState<ReportModalData>({
    report: null,
    show: false
  });
  
  // Estado para el proceso de actualización
  const [refreshing, setRefreshing] = useState(false);

  // Función para ver detalles de un reporte
  const viewReportDetails = (report: ReportDetail) => {
    setModalData({
      report,
      show: true
    });
  };

  // Función para cerrar el modal
  const closeModal = () => {
    setModalData({
      report: null,
      show: false
    });
  };
  
  // Función para actualizar datos manualmente
  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  };

  // Si está cargando, mostrar placeholders
  if (loading) {
    return (
      <div className="tab-pane fade show active">
        <div className="loading-container">
          <div className="loader"></div>
          <p>Cargando reportes...</p>
        </div>
      </div>
    );
  }

  // Si no hay datos, mostrar mensaje
  if (reports.length === 0) {
    return (
      <div className="tab-pane fade show active">
        <div className="alert alert-info">
          No hay reportes disponibles para el período seleccionado. Intente modificar los filtros.
        </div>
      </div>
    );
  }

  // Función para formatear fecha
  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES');
  };

  // Calcular avance promedio para un reporte
  const calculateAverage = (report: ReportDetail): number => {
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
    
    return countAvance > 0 ? sumAvance / countAvance : 0;
  };

  // Calcular costo total para un reporte
  const calculateCost = (report: ReportDetail): number => {
    // Costos por categoría (en soles por hora)
    const costosPorCategoria: {[key: string]: number} = {
      'OPERARIO': 23.00,
      'OFICIAL': 18.09,
      'PEON': 16.38
    };
    
    let costoTotal = 0;
    
    report.manoObra.forEach(trab => {
      if (!trab.categoria || !Array.isArray(trab.horas)) return;
      
      const categoria = trab.categoria;
      const totalHoras = trab.horas.reduce((sum, h) => sum + (parseFloat(h) || 0), 0);
      
      const costoPorHora = costosPorCategoria[categoria] || 18.00;
      costoTotal += totalHoras * costoPorHora;
    });
    
    return costoTotal;
  };

  return (
    <div className="tab-pane fade show active" id="reports">
      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5>Listado de Reportes</h5>
          <div>
            <span className="me-3">
              Mostrando {reports.length} de {pagination.totalItems} reportes
            </span>
            <button 
              className="btn btn-sm btn-outline-primary" 
              onClick={handleRefresh}
              disabled={refreshing}
            >
              {refreshing ? (
                <>
                  <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                  Actualizando...
                </>
              ) : (
                <>
                  <i className="fas fa-sync-alt me-1"></i> Actualizar
                </>
              )}
            </button>
          </div>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table mb-0">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Elaborado por</th>
                  <th>Subcontratista/Bloque</th>
                  <th>Actividades</th>
                  <th>Trabajadores</th>
                  <th>Avance</th>
                  <th>Costo Est.</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {reports.map(report => {
                  // Calcular avance promedio para este reporte
                  const avgAvance = calculateAverage(report);
                  
                  // Calcular costo total para este reporte
                  const costoReporte = calculateCost(report);
                  
                  // Determinar clase según el avance
                  let avanceClass = '';
                  if (avgAvance >= 80) {
                    avanceClass = 'text-success';
                  } else if (avgAvance >= 50) {
                    avanceClass = 'text-warning';
                  } else {
                    avanceClass = 'text-danger';
                  }
                  
                  return (
                    <tr key={report.id}>
                      <td>{formatDate(report.fecha)}</td>
                      <td>{report.elaboradoPor || 'No especificado'}</td>
                      <td>{report.subcontratistaBloque || 'No especificado'}</td>
                      <td>{report.actividades.filter(a => a.proceso).length}</td>
                      <td>{report.manoObra.filter(m => m.trabajador).length}</td>
                      <td className={avanceClass}>{avgAvance.toFixed(1)}%</td>
                      <td>S/ {costoReporte.toFixed(2)}</td>
                      <td>
                        <button 
                          className="btn btn-sm btn-primary view-report"
                          onClick={() => viewReportDetails(report)}
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

      {/* Modal para detalles del reporte */}
      {modalData.show && modalData.report && (
        <div className="report-modal-backdrop" onClick={closeModal}>
          <div className="report-modal-content" onClick={e => e.stopPropagation()}>
            <div className="report-modal-header">
              <h5 className="report-modal-title">Detalles del Reporte</h5>
              <button type="button" className="btn-close" onClick={closeModal}></button>
            </div>
            <div className="report-modal-body">
              <div className="mb-4">
                <h5 className="mb-3">Información General</h5>
                <div className="row">
                  <div className="col-md-6">
                    <ul className="list-group">
                      <li className="list-group-item"><strong>Fecha:</strong> {formatDate(modalData.report.fecha)}</li>
                      <li className="list-group-item"><strong>Elaborado por:</strong> {modalData.report.elaboradoPor || 'No especificado'}</li>
                      <li className="list-group-item"><strong>Subcontratista/Bloque:</strong> {modalData.report.subcontratistaBloque || 'No especificado'}</li>
                    </ul>
                  </div>
                  <div className="col-md-6">
                    <ul className="list-group">
                      <li className="list-group-item"><strong>Actividades:</strong> {modalData.report.actividades.filter(a => a.proceso).length}</li>
                      <li className="list-group-item"><strong>Trabajadores:</strong> {modalData.report.manoObra.filter(m => m.trabajador).length}</li>
                      <li className="list-group-item"><strong>ID Reporte:</strong> {modalData.report.id}</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className="mb-4">
                <h5 className="mb-3">Actividades</h5>
                <div className="table-responsive">
                  <table className="table table-bordered">
                    <thead>
                      <tr>
                        <th>Actividad</th>
                        <th>UND</th>
                        <th>Metrado P.</th>
                        <th>Metrado E.</th>
                        <th>Avance</th>
                        <th>Causas</th>
                      </tr>
                    </thead>
                    <tbody>
                      {modalData.report.actividades.map((act, index) => {
                        if (!act.proceso) return null;
                        
                        const metradoP = parseFloat(String(act.metradoP)) || 0;
                        const metradoE = parseFloat(String(act.metradoE)) || 0;
                        const avance = metradoP > 0 ? (metradoE / metradoP) * 100 : 0;
                        
                        // Determinar clase según el avance
                        let avanceClass = '';
                        if (avance >= 80) {
                          avanceClass = 'text-success';
                        } else if (avance >= 50) {
                          avanceClass = 'text-warning';
                        } else {
                          avanceClass = 'text-danger';
                        }
                        
                        return (
                          <tr key={index}>
                            <td>{act.proceso}</td>
                            <td>{act.und || ''}</td>
                            <td>{metradoP.toFixed(2)}</td>
                            <td>{metradoE.toFixed(2)}</td>
                            <td className={avanceClass}>{avance.toFixed(1)}%</td>
                            <td>{act.causas || ''}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
              
              <div>
                <h5 className="mb-3">Mano de Obra</h5>
                <div className="table-responsive">
                  <table className="table table-bordered">
                    <thead>
                      <tr>
                        <th>Trabajador</th>
                        <th>Categoría</th>
                        <th>Horas por Actividad</th>
                        <th>Total Horas</th>
                        <th>Costo Est.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {modalData.report.manoObra.map((trab, index) => {
                        if (!trab.trabajador || !trab.categoria || !Array.isArray(trab.horas)) return null;
                        
                        const totalHoras = trab.horas.reduce((sum, h) => sum + (parseFloat(h) || 0), 0);
                        const costosPorCategoria: {[key: string]: number} = {
                          'OPERARIO': 23.00,
                          'OFICIAL': 18.09,
                          'PEON': 16.38
                        };
                        const costoPorHora = costosPorCategoria[trab.categoria] || 18.00;
                        const costoTrabajador = totalHoras * costoPorHora;
                        
                        // Generar detalle de horas por actividad
                        let horasDetalle = '';
                        
                        modalData.report.actividades.forEach((act, idx) => {
                          if (!act.proceso) return;
                          
                          const horasEnActividad = parseFloat(trab.horas[idx]) || 0;
                          if (horasEnActividad <= 0) return;
                          
                          horasDetalle += `${act.proceso}: ${horasEnActividad.toFixed(1)}h<br>`;
                        });
                        
                        return (
                          <tr key={index}>
                            <td>{trab.trabajador}</td>
                            <td>
                              <span className={`category-badge category-${trab.categoria.toLowerCase().replace(/\s+/g, '')}`}>
                                {trab.categoria}
                              </span>
                            </td>
                            <td dangerouslySetInnerHTML={{ __html: horasDetalle }}></td>
                            <td>{totalHoras.toFixed(1)}</td>
                            <td>S/ {costoTrabajador.toFixed(2)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan={4} className="text-end"><strong>Costo Total:</strong></td>
                        <td><strong>S/ {calculateCost(modalData.report).toFixed(2)}</strong></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
            <div className="report-modal-footer">
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

export default TabReportes;