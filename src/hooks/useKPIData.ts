import { useState, useEffect, useCallback } from 'react';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  limit, 
  startAfter, 
  orderBy,
  getDoc,
  doc,
  DocumentData,
  QueryDocumentSnapshot, 
  Timestamp
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { getWithSWR, setCache, getCache } from '../utils/cache';

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
  page: number;
  pageSize: number;
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

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface UseKPIDataResult {
  reports: ReportDetail[];
  loading: boolean;
  error: string | null;
  filterOptions: FilterOptions;
  metrics: KPIMetrics;
  pagination: PaginationInfo;
  loadNextPage: () => void;
  loadPrevPage: () => void;
  refresh: () => Promise<void>;
}

// Constantes
const COSTOS_CATEGORIA: { [key: string]: number } = {
  'OPERARIO': 23.00,
  'OFICIAL': 18.09,
  'PEON': 16.38
};

// Clave para documentos de resumen
const AGREGADO_DOC_KEY = 'agregados';

// El hook principal con optimizaciones
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
  
  // Estado para la última paginación
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot | null>(null);
  const [firstDoc, setFirstDoc] = useState<QueryDocumentSnapshot | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: filters.page || 1,
    totalPages: 1,
    totalItems: 0,
    hasNextPage: false,
    hasPrevPage: false
  });

  // Convertir fechas a strings para usar en Firestore
  const formatDateForQuery = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };
  
  // Función para cargar la siguiente página
  const loadNextPage = useCallback(() => {
    if (pagination.hasNextPage) {
      const newFilters = {
        ...filters,
        page: pagination.currentPage + 1
      };
      
      fetchReports(newFilters, lastDoc);
    }
  }, [pagination.hasNextPage, pagination.currentPage, filters, lastDoc]);
  
  // Función para cargar la página anterior
  const loadPrevPage = useCallback(() => {
    if (pagination.hasPrevPage) {
      const newFilters = {
        ...filters,
        page: pagination.currentPage - 1
      };
      
      fetchReports(newFilters, null, firstDoc);
    }
  }, [pagination.hasPrevPage, pagination.currentPage, filters, firstDoc]);
  
  // Obtener filtros optimizados para Firestore (solo los necesarios)
  const getOptimizedFilters = useCallback((filterValues: FilterValues) => {
    const startDateStr = formatDateForQuery(filterValues.dateRange.start);
    const endDateStr = formatDateForQuery(filterValues.dateRange.end);
    
    // Base query con fecha
    let conditions = [
      where('fecha', '>=', startDateStr),
      where('fecha', '<=', endDateStr),
      orderBy('fecha', 'desc') // Ordenar por fecha descendente
    ];
    
    // Solo agregar filtros si realmente están especificados
    // Esto optimiza los índices compuestos que necesitamos
    if (filterValues.subcontratista) {
      conditions.push(where('subcontratistaBloque', '==', filterValues.subcontratista));
    }
    
    if (filterValues.elaboradoPor) {
      conditions.push(where('elaboradoPor', '==', filterValues.elaboradoPor));
    }
    
    return conditions;
  }, []);
  
  // Función para obtener métricas de resumen
  const fetchMetricsSummary = useCallback(async () => {
    try {
      // Crear clave para el resumen basado en los filtros
      const cacheKey = `summary_${filters.dateRange.start.getTime()}_${filters.dateRange.end.getTime()}_${filters.subcontratista}_${filters.elaboradoPor}`;
      
      // Intentar obtener de caché primero
      const cachedSummary = await getCache<KPIMetrics>(cacheKey);
      if (cachedSummary) {
        return cachedSummary;
      }
      
      // Si no está en caché, intentar obtener del documento de resumen
      const summaryRef = doc(db, 'Resumen', AGREGADO_DOC_KEY);
      const summarySnap = await getDoc(summaryRef);
      
      if (summarySnap.exists()) {
        // Obtener el resumen para el rango de fechas
        const summaryData = summarySnap.data();
        
        // Calcular métricas basadas en el documento de resumen
        // Aquí se implementaría la lógica para extraer métricas específicas del rango de fechas
        // Por ahora, retornamos null para indicar que no hay resumen disponible
        return null;
      }
      
      return null;
    } catch (error) {
      console.error('Error al obtener resumen de métricas:', error);
      return null;
    }
  }, [filters]);

  // Función para obtener total de reportes que coinciden con el filtro
  // Esta función permite conocer el total para la paginación
  const fetchTotalReports = useCallback(async (filterValues: FilterValues) => {
    try {
      // Clave de caché para total de reportes
      const cacheKey = `total_reports_${filterValues.dateRange.start.getTime()}_${filterValues.dateRange.end.getTime()}_${filterValues.subcontratista}_${filterValues.elaboradoPor}_${filterValues.categoria}`;
      
      // Intentar obtener de caché
      const cachedTotal = await getCache<number>(cacheKey);
      if (cachedTotal !== null) {
        return cachedTotal;
      }
      
      // Obtener filtros optimizados
      const conditions = getOptimizedFilters(filterValues);
      
      // Crear la consulta
      const q = query(collection(db, 'Reportes'), ...conditions);
      
      // Ejecutar consulta (intentamos minimizar lecturas usando métodos alternativos)
      // En una implementación real, se podría usar un contador de agregación para esto
      const snapshot = await getDocs(q);
      const total = snapshot.size;
      
      // Guardar en caché
      await setCache(cacheKey, total, 60 * 60 * 1000); // 1 hora de caché
      
      return total;
    } catch (error) {
      console.error('Error al obtener total de reportes:', error);
      return 0;
    }
  }, [getOptimizedFilters]);

  // Función principal para obtener reportes
  const fetchReports = useCallback(async (
    filterValues: FilterValues,
    startAfterDoc: QueryDocumentSnapshot | null = null,
    endBeforeDoc: QueryDocumentSnapshot | null = null
  ) => {
    try {
      setLoading(true);
      setError(null);
      
      // Obtener total de reportes para paginación
      const totalReports = await fetchTotalReports(filterValues);
      const totalPages = Math.ceil(totalReports / filterValues.pageSize);
      
      // Crear la clave de caché basada en los filtros y paginación
      const cacheKey = `reports_${filterValues.dateRange.start.getTime()}_${filterValues.dateRange.end.getTime()}_${filterValues.subcontratista}_${filterValues.elaboradoPor}_${filterValues.categoria}_page${filterValues.page}_size${filterValues.pageSize}`;
      
      // Función para obtener datos de Firestore con paginación
      const fetchFromFirestore = async (): Promise<{ 
        reports: ReportDetail[], 
        firstDoc: QueryDocumentSnapshot | null,
        lastDoc: QueryDocumentSnapshot | null,
        filterOptions: FilterOptions 
      }> => {
        // Obtener filtros optimizados
        const conditions = getOptimizedFilters(filterValues);
        
        // Añadir límite para paginación
        let reportesQuery = query(
          collection(db, 'Reportes'),
          ...conditions,
          limit(filterValues.pageSize)
        );
        
        // Añadir documento de inicio para paginación
        if (startAfterDoc) {
          reportesQuery = query(
            collection(db, 'Reportes'),
            ...conditions,
            startAfter(startAfterDoc),
            limit(filterValues.pageSize)
          );
        } else if (endBeforeDoc) {
          // Para navegar hacia atrás
          reportesQuery = query(
            collection(db, 'Reportes'),
            ...conditions,
            startAfter(endBeforeDoc),
            limit(filterValues.pageSize)
          );
        }
        
        // Obtener los reportes principales
        const reportesSnapshot = await getDocs(reportesQuery);
        
        // Conjuntos para las opciones de filtro
        const subcontratistasSet = new Set<string>();
        const elaboradoresSet = new Set<string>();
        const categoriasSet = new Set<string>();
        
        // Procesar los resultados
        const reportesData: ReportDetail[] = [];
        
        // Guardar primer y último documento para navegación
        const firstDoc = reportesSnapshot.docs[0] || null;
        const lastDoc = reportesSnapshot.docs[reportesSnapshot.docs.length - 1] || null;
        
        for (const reporteDoc of reportesSnapshot.docs) {
          const reporteData = reporteDoc.data() as Report;
          
          // Filtrar por subcontratista si se especificó (ya aplicado en la consulta)
          if (filterValues.subcontratista && reporteData.subcontratistaBloque !== filterValues.subcontratista) {
            continue;
          }
          
          // Filtrar por elaborador si se especificó (ya aplicado en la consulta)
          if (filterValues.elaboradoPor && reporteData.elaboradoPor !== filterValues.elaboradoPor) {
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
          if (filterValues.categoria) {
            const workersByCat = manoObra.filter(worker => 
              worker.categoria === filterValues.categoria
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
        
        // Opciones de filtro
        const filterOptions = {
          subcontratistas: Array.from(subcontratistasSet).sort(),
          elaboradores: Array.from(elaboradoresSet).sort(),
          categorias: Array.from(categoriasSet).sort()
        };
        
        return { reports: reportesData, firstDoc, lastDoc, filterOptions };
      };

      // Obtener datos usando stale-while-revalidate
      const result = await getWithSWR<{ 
        reports: ReportDetail[], 
        firstDoc: QueryDocumentSnapshot | null,
        lastDoc: QueryDocumentSnapshot | null,
        filterOptions: FilterOptions 
      }>(
        cacheKey, 
        fetchFromFirestore,
        30 * 60 * 1000 // 30 minutos de TTL para reducir lecturas
      );
      
      // Actualizar reportes y documentos de paginación
      setReports(result.reports);
      setFirstDoc(result.firstDoc);
      setLastDoc(result.lastDoc);
      setFilterOptions(result.filterOptions);
      
      // Actualizar información de paginación
      setPagination({
        currentPage: filterValues.page,
        totalPages,
        totalItems: totalReports,
        hasNextPage: filterValues.page < totalPages,
        hasPrevPage: filterValues.page > 1
      });
      
      // Intentar obtener métricas desde el documento de resumen
      const summaryMetrics = await fetchMetricsSummary();
      
      if (summaryMetrics) {
        // Si tenemos métricas de resumen, usarlas directamente
        setMetrics(summaryMetrics);
      } else {
        // Si no, calcularlas a partir de los reportes
        // Nota: Esto podría ser ineficiente para grandes conjuntos de datos
        calculateMetrics(result.reports);
      }
    } catch (err) {
      console.error('Error al cargar datos:', err);
      setError('Error al cargar datos. Por favor intente más tarde.');
    } finally {
      setLoading(false);
    }
  }, [fetchTotalReports, getOptimizedFilters, fetchMetricsSummary]);

  // Función para refrescar datos manualmente
  const refresh = useCallback(async () => {
    await fetchReports(filters);
  }, [fetchReports, filters]);

  // Efecto principal para cargar datos cuando cambian los filtros
  useEffect(() => {
    fetchReports(filters);
  }, [filters, fetchReports]);

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
    metrics,
    pagination,
    loadNextPage,
    loadPrevPage,
    refresh
  };
}

export default useKPIData;