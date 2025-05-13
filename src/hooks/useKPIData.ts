import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, DocumentData } from 'firebase/firestore';
import { db } from '../services/firebase';
import { getWithSWR } from '../utils/cache';

// Tipos para los filtros y datos
export interface FilterValues {
  dateRange: {
    start: Date;
    end: Date;
  };
  predefinedPeriod: string;
  subcontratista: string;
  elaboradoPor: string;
  categoria: string;
}

export interface Report {
  id: string;
  fecha: string;
  elaboradoPor: string;
  subcontratistaBloque: string;
  revisadoPor: string;
  timestamp: string;
  usuarioEmail: string;
  usuarioUID: string;
}

export interface Activity {
  id?: string;
  proceso: string;
  und: string;
  metradoP: number;
  metradoE: number;
  precio: number;
  ubicacion?: string;
  comentarios?: string;
  causas?: string;
}

export interface Worker {
  id?: string;
  dni: string;
  trabajador: string;
  categoria: string;
  especificacion?: string;
  horas: string[];
  observacion?: string;
}

export interface ReportDetail extends Report {
  actividades: Activity[];
  manoObra: Worker[];
}

export interface FilterOptions {
  subcontratistas: string[];
  elaboradores: string[];
  categorias: string[];
}

export interface KPIMetrics {
  totalReportes: number;
  totalActividades: number;
  totalTrabajadores: number;
  avancePromedio: number;
  costoTotal: number;
  costoManoObra: number;
  costoPromedioPorUnidad: number;
  indiceEficiencia: number;
}

export interface UseKPIDataResult {
  reports: ReportDetail[];
  loading: boolean;
  error: string | null;
  filterOptions: FilterOptions;
  metrics: KPIMetrics;
}

// Constantes
const COSTOS_CATEGORIA: { [key: string]: number } = {
  'OPERARIO': 23.00,
  'OFICIAL': 18.09,
  'PEON': 16.38
};

// El hook principal
export function useKPIData(filters: FilterValues): UseKPIDataResult {
  const [reports, setReports] = useState<ReportDetail[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    subcontratistas: [],
    elaboradores: [],
    categorias: []
  });
  const [metrics, setMetrics] = useState<KPIMetrics>({
    totalReportes: 0,
    totalActividades: 0,
    totalTrabajadores: 0,
    avancePromedio: 0,
    costoTotal: 0,
    costoManoObra: 0,
    costoPromedioPorUnidad: 0,
    indiceEficiencia: 0
  });

  // Convertir fechas a strings para usar en Firestore
  const formatDateForQuery = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Crear la clave de caché basada en los filtros
        const cacheKey = `reports_${filters.dateRange.start.getTime()}_${filters.dateRange.end.getTime()}_${filters.subcontratista}_${filters.elaboradoPor}_${filters.categoria}`;

        // Función para obtener datos de Firestore
        const fetchFromFirestore = async (): Promise<ReportDetail[]> => {
          // Construir la query de Firestore
          const startDateStr = formatDateForQuery(filters.dateRange.start);
          const endDateStr = formatDateForQuery(filters.dateRange.end);

          // Query principal para reportes
          const reportesQuery = query(
            collection(db, 'Reportes'),
            where('fecha', '>=', startDateStr),
            where('fecha', '<=', endDateStr)
          );

          // Obtener los reportes principales
          const reportesSnapshot = await getDocs(reportesQuery);
          
          // Conjuntos para las opciones de filtro
          const subcontratistasSet = new Set<string>();
          const elaboradoresSet = new Set<string>();
          const categoriasSet = new Set<string>();
          
          // Procesar los resultados
          const reportesData: ReportDetail[] = [];
          
          for (const reporteDoc of reportesSnapshot.docs) {
            const reporteData = reporteDoc.data() as Report;
            
            // Filtrar por subcontratista si se especificó
            if (filters.subcontratista && reporteData.subcontratistaBloque !== filters.subcontratista) {
              continue;
            }
            
            // Filtrar por elaborador si se especificó
            if (filters.elaboradoPor && reporteData.elaboradoPor !== filters.elaboradoPor) {
              continue;
            }
            
            // Agregar a opciones de filtro
            if (reporteData.subcontratistaBloque) {
              subcontratistasSet.add(reporteData.subcontratistaBloque);
            }
            
            if (reporteData.elaboradoPor) {
              elaboradoresSet.add(reporteData.elaboradoPor);
            }
            
            // Obtener actividades
            const actividadesRef = collection(db, `Reportes/${reporteDoc.id}/actividades`);
            const actividadesSnapshot = await getDocs(actividadesRef);
            const actividades = actividadesSnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            })) as Activity[];
            
            // Obtener mano de obra
            const manoObraRef = collection(db, `Reportes/${reporteDoc.id}/mano_obra`);
            const manoObraSnapshot = await getDocs(manoObraRef);
            let manoObra = manoObraSnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            })) as Worker[];
            
            // Filtrar por categoría si se especificó
            if (filters.categoria) {
              const workersByCat = manoObra.filter(worker => 
                worker.categoria === filters.categoria
              );
              
              // Solo incluir el reporte si tiene trabajadores de esta categoría
              if (workersByCat.length === 0) {
                continue;
              }
              
              manoObra = workersByCat;
            }
            
            // Recopilar categorías para filtros
            manoObra.forEach(worker => {
              if (worker.categoria) {
                categoriasSet.add(worker.categoria);
              }
            });
            
            // Agregar el reporte completo
            reportesData.push({
              id: reporteDoc.id,
              ...reporteData,
              actividades,
              manoObra
            });
          }
          
          // Actualizar opciones de filtro
          setFilterOptions({
            subcontratistas: Array.from(subcontratistasSet).sort(),
            elaboradores: Array.from(elaboradoresSet).sort(),
            categorias: Array.from(categoriasSet).sort()
          });
          
          return reportesData;
        };

        // Obtener datos usando stale-while-revalidate
        const reportsData = await getWithSWR<ReportDetail[]>(
          cacheKey, 
          fetchFromFirestore,
          60 * 60 * 1000 // 1 hora de TTL
        );
        
        // Actualizar reportes
        setReports(reportsData);
        
        // Calcular métricas
        calculateMetrics(reportsData);
      } catch (err) {
        console.error('Error al cargar datos:', err);
        setError('Error al cargar datos. Por favor intente más tarde.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filters]);

  // Función para calcular métricas
  const calculateMetrics = (reportsData: ReportDetail[]) => {
    if (!reportsData.length) {
      setMetrics({
        totalReportes: 0,
        totalActividades: 0,
        totalTrabajadores: 0,
        avancePromedio: 0,
        costoTotal: 0,
        costoManoObra: 0,
        costoPromedioPorUnidad: 0,
        indiceEficiencia: 0
      });
      return;
    }

    // Total de reportes
    const totalReportes = reportsData.length;

    // Total de actividades únicas
    const actividadesUnicas = new Set<string>();
    reportsData.forEach(report => {
      report.actividades.forEach(act => {
        if (act.proceso) {
          actividadesUnicas.add(act.proceso);
        }
      });
    });
    const totalActividades = actividadesUnicas.size;

    // Total de trabajadores únicos
    const trabajadoresUnicos = new Set<string>();
    reportsData.forEach(report => {
      report.manoObra.forEach(trab => {
        if (trab.trabajador) {
          trabajadoresUnicos.add(trab.trabajador);
        }
      });
    });
    const totalTrabajadores = trabajadoresUnicos.size;

    // Calcular avance promedio
    let sumAvance = 0;
    let countAvance = 0;
    reportsData.forEach(report => {
      report.actividades.forEach(act => {
        const metradoP = parseFloat(act.metradoP.toString()) || 0;
        const metradoE = parseFloat(act.metradoE.toString()) || 0;
        
        if (metradoP > 0) {
          sumAvance += (metradoE / metradoP) * 100;
          countAvance++;
        }
      });
    });
    const avancePromedio = countAvance > 0 ? sumAvance / countAvance : 0;

    // Cálculo de costos
    let costoTotalMO = 0;
    let horasTotales = 0;

    reportsData.forEach(report => {
      report.manoObra.forEach(trab => {
        if (!trab.categoria || !Array.isArray(trab.horas)) return;
        
        const categoria = trab.categoria;
        const totalHoras = trab.horas.reduce((sum, h) => sum + (parseFloat(h) || 0), 0);
        
        horasTotales += totalHoras;
        const costoPorHora = COSTOS_CATEGORIA[categoria] || 18.00;
        costoTotalMO += totalHoras * costoPorHora;
      });
    });

    // Costo total (actualmente solo mano de obra)
    const costoTotal = costoTotalMO;

    // Costo promedio por unidad (metrado)
    let totalMetradoE = 0;
    reportsData.forEach(report => {
      report.actividades.forEach(act => {
        totalMetradoE += parseFloat(act.metradoE.toString()) || 0;
      });
    });

    const costoPromedioPorUnidad = totalMetradoE > 0 ? costoTotal / totalMetradoE : 0;

    // Índice de eficiencia
    const indiceEficiencia = avancePromedio > 0 ? (avancePromedio / costoPromedioPorUnidad) * 10 : 0;

    // Actualizar métricas calculadas
    setMetrics({
      totalReportes,
      totalActividades,
      totalTrabajadores,
      avancePromedio,
      costoTotal,
      costoManoObra: costoTotalMO,
      costoPromedioPorUnidad,
      indiceEficiencia
    });
  };

  return {
    reports,
    loading,
    error,
    filterOptions,
    metrics
  };
}

export default useKPIData;