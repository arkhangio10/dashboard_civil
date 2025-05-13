// src/components/common/FilterBar/FilterBar.tsx
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { FilterValues } from '../../../hooks/useKPIData';
import './FilterBar.scss';

interface FilterBarProps {
  initialFilters: FilterValues;
  onFilterChange: (filters: FilterValues) => void;
  filterOptions: {
    subcontratistas: string[];
    elaboradores: string[];
    categorias: string[];
  };
}

const FilterBar: React.FC<FilterBarProps> = ({
  initialFilters,
  onFilterChange,
  filterOptions
}) => {
  const [filters, setFilters] = useState<FilterValues>(initialFilters);

  // Actualizar filtros cuando cambien los valores iniciales
  useEffect(() => {
    setFilters(initialFilters);
  }, [initialFilters]);

  // Formatear fechas para inputs
  const formatDateForInput = (date: Date): string => {
    return format(date, 'yyyy-MM-dd');
  };

  // Manejar cambio en el período predefinido
  const handlePeriodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const periodValue = e.target.value;
    let newStartDate = new Date();
    const newEndDate = new Date();
    
    if (periodValue === 'custom') {
      // Mantener las fechas actuales
      newStartDate = filters.dateRange.start;
    } else if (periodValue === '0') {
      // Todo el tiempo (usar una fecha antigua)
      newStartDate = new Date(2000, 0, 1);
    } else {
      // Calcular fecha según el número de días seleccionados
      const days = parseInt(periodValue);
      newStartDate.setDate(newEndDate.getDate() - days);
    }
    
    const newFilters = {
      ...filters,
      predefinedPeriod: periodValue,
      dateRange: {
        start: newStartDate,
        end: newEndDate
      }
    };
    
    setFilters(newFilters);
  };

  // Manejar cambios en las fechas personalizadas
  const handleDateChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'start' | 'end'
  ) => {
    const dateValue = e.target.value;
    const dateObj = dateValue ? new Date(dateValue) : 
      (type === 'start' ? new Date(2000, 0, 1) : new Date());
    
    const newFilters = {
      ...filters,
      predefinedPeriod: 'custom',
      dateRange: {
        ...filters.dateRange,
        [type]: dateObj
      }
    };
    
    setFilters(newFilters);
  };

  // Manejar cambios en otros filtros
  const handleFilterChange = (
    e: React.ChangeEvent<HTMLSelectElement>,
    key: keyof FilterValues
  ) => {
    const newFilters = {
      ...filters,
      [key]: e.target.value
    };
    
    setFilters(newFilters);
  };

  // Aplicar filtros
  const applyFilters = () => {
    onFilterChange(filters);
  };

  // Limpiar filtros de fecha
  const clearDateFilter = () => {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    const newFilters = {
      ...filters,
      predefinedPeriod: '30',
      dateRange: {
        start: thirtyDaysAgo,
        end: today
      }
    };
    
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  return (
    <div className="filter-section">
      <div className="row mb-3">
        <div className="col-md-12">
          <h6 className="mb-3">
            <i className="fas fa-calendar-alt me-2"></i>
            Periodo de Análisis
          </h6>
          <div className="row">
            <div className="col-md-3">
              <label className="form-label small">Periodo predefinido:</label>
              <select 
                id="filter-period"
                className="form-select"
                value={filters.predefinedPeriod}
                onChange={handlePeriodChange}
              >
                <option value="custom">Personalizado</option>
                <option value="30">Últimos 30 días</option>
                <option value="90">Últimos 90 días</option>
                <option value="180">Últimos 180 días</option>
                <option value="365">Último año</option>
                <option value="0">Todo el tiempo</option>
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label small">Fecha inicial:</label>
              <input 
                type="date" 
                id="filter-start-date"
                className="form-control"
                value={formatDateForInput(filters.dateRange.start)}
                onChange={(e) => handleDateChange(e, 'start')}
                disabled={filters.predefinedPeriod !== 'custom'}
              />
            </div>
            <div className="col-md-3">
              <label className="form-label small">Fecha final:</label>
              <input 
                type="date" 
                id="filter-end-date"
                className="form-control"
                value={formatDateForInput(filters.dateRange.end)}
                onChange={(e) => handleDateChange(e, 'end')}
                disabled={filters.predefinedPeriod !== 'custom'}
              />
            </div>
            <div className="col-md-3 d-flex align-items-end">
              <button 
                id="clear-date-filter"
                className="btn btn-outline-secondary me-2"
                onClick={clearDateFilter}
              >
                <i className="fas fa-times"></i> Limpiar
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="row align-items-end">
        <div className="col-md-3">
          <label className="form-label small">Subcontratista/Bloque:</label>
          <select 
            id="filter-subcontratista"
            className="form-select"
            value={filters.subcontratista}
            onChange={(e) => handleFilterChange(e, 'subcontratista')}
          >
            <option value="">Todos</option>
            {filterOptions.subcontratistas.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
        <div className="col-md-3">
          <label className="form-label small">Elaborado por:</label>
          <select 
            id="filter-elaborado"
            className="form-select"
            value={filters.elaboradoPor}
            onChange={(e) => handleFilterChange(e, 'elaboradoPor')}
          >
            <option value="">Todos</option>
            {filterOptions.elaboradores.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
        <div className="col-md-3">
          <label className="form-label small">Categoría de trabajador:</label>
          <select 
            id="filter-categoria"
            className="form-select"
            value={filters.categoria}
            onChange={(e) => handleFilterChange(e, 'categoria')}
          >
            <option value="">Todas</option>
            {filterOptions.categorias.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
        <div className="col-md-3">
          <button 
            id="filter-apply"
            className="btn btn-primary w-100"
            onClick={applyFilters}
          >
            <i className="fas fa-filter me-2"></i> Aplicar Filtros
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilterBar;