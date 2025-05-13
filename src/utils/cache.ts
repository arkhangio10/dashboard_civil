// src/utils/cache.ts
import localforage from 'localforage';

// Configuración de localforage
localforage.config({
  name: 'hergonsa-dashboard',
  version: 1.0,
  storeName: 'dashboard_cache',
  description: 'Caché para datos del dashboard'
});

// Tipos para los elementos cacheados
interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiry: number; // TTL en milisegundos
}

// TTL por defecto (24 horas)
const DEFAULT_TTL = 24 * 60 * 60 * 1000;

/**
 * Guarda un elemento en la caché con un TTL específico
 */
export async function setCache<T>(key: string, data: T, ttl: number = DEFAULT_TTL): Promise<void> {
  const cacheItem: CacheItem<T> = {
    data,
    timestamp: Date.now(),
    expiry: ttl
  };
  
  try {
    await localforage.setItem(key, cacheItem);
  } catch (error) {
    console.error('Error al guardar en caché:', error);
    // Si falla el almacenamiento, seguir adelante sin error fatal
  }
}

/**
 * Obtiene un elemento de la caché si existe y no ha expirado
 */
export async function getCache<T>(key: string): Promise<T | null> {
  try {
    const cachedItem = await localforage.getItem<CacheItem<T>>(key);
    
    if (!cachedItem) {
      return null;
    }
    
    const now = Date.now();
    // Si el elemento ha expirado
    if (now - cachedItem.timestamp > cachedItem.expiry) {
      await localforage.removeItem(key);
      return null;
    }
    
    return cachedItem.data;
  } catch (error) {
    console.error('Error al obtener de caché:', error);
    return null;
  }
}

/**
 * Implementación del patrón stale-while-revalidate
 * Devuelve datos cacheados (incluso vencidos) mientras refresca en segundo plano
 */
export async function getWithSWR<T>(
  key: string, 
  fetchFn: () => Promise<T>,
  ttl: number = DEFAULT_TTL
): Promise<T> {
  try {
    // Intentar obtener datos de caché
    const cachedItem = await localforage.getItem<CacheItem<T>>(key);
    const now = Date.now();
    
    // Si no hay caché o está muy vencida (+ de 7 días), esperar la nueva data
    if (!cachedItem || (now - cachedItem.timestamp > 7 * 24 * 60 * 60 * 1000)) {
      const freshData = await fetchFn();
      await setCache(key, freshData, ttl);
      return freshData;
    }
    
    // Si hay datos en caché, comprobar si están vencidos
    const isStale = now - cachedItem.timestamp > cachedItem.expiry;
    
    if (isStale) {
      // Si están vencidos, actualizar en segundo plano pero devolver lo que tenemos
      fetchFn().then(freshData => {
        setCache(key, freshData, ttl);
      }).catch(error => {
        console.error('Error al actualizar caché en segundo plano:', error);
      });
      
      // Devolver datos vencidos mientras tanto
      return cachedItem.data;
    }
    
    // Devolver datos frescos de caché
    return cachedItem.data;
  } catch (error) {
    // Si algo falla, hacer la petición directamente
    console.error('Error en getWithSWR:', error);
    const freshData = await fetchFn();
    try {
      await setCache(key, freshData, ttl);
    } catch (e) {
      // Ignorar errores de caché
    }
    return freshData;
  }
}

/**
 * Limpia un elemento específico de la caché
 */
export async function clearCache(key: string): Promise<void> {
  await localforage.removeItem(key);
}

/**
 * Limpia toda la caché
 */
export async function clearAllCache(): Promise<void> {
  await localforage.clear();
}