// src/views/Dashboard.tsx
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import useKPIData, { FilterValues } from '../hooks/useKPIData';
import FilterBar from '../components/common/FilterBar/FilterBar';
import KPICards from '../components/dashboard/KPICards';
import TabVisión from '../components/dashboard/TabVisión';
import TabCostos from '../components/dashboard/TabCostos';
import TabManoObra from '../components/dashboard/TabManoObra';
import TabActividades from '../components/dashboard/TabActividades';
import TabAnalisis from '../components/dashboard/TabAnalisis';
import TabReportes from '../components/dashboard/TabReportes';
import './Dashboard.scss';

const Dashboard: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  
  // Inicializar filtros (últimos 30 días)
  const today = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(today.getDate() - 30);
  
  // Estado para los filtros
  const [filters, setFilters] = useState<FilterValues>({
    dateRange: {
      start: thirtyDaysAgo,
      end: today
    },
    predefinedPeriod: '30',
    subcontratista: '',
    elaboradoPor: '',
    categoria: ''
  });
  
  // Estado para la pestaña activa
  const [activeTab, setActiveTab] = useState('overview');
  
  // Obtener datos con el hook personalizado
  const { reports, loading, error, filterOptions, metrics } = useKPIData(filters);
  
  // Manejar cambio de filtros
  const handleFilterChange = (newFilters: FilterValues) => {
    setFilters(newFilters);
  };
  
  // Manejar cierre de sesión
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  return (
    <div className="dashboard-container container">
      {/* Cabecera con información de usuario y empresa */}
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h4>Dashboard de Reportes</h4>
              <div className="d-flex align-items-center">
                <span id="user-email" className="me-3">{currentUser?.email}</span>
                <button 
                  id="logout-button" 
                  className="btn btn-outline-secondary"
                  onClick={handleLogout}
                >
                  <i className="fas fa-sign-out-alt"></i> Cerrar Sesión
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Filtros */}
      <div className="row">
        <div className="col-12">
          <FilterBar 
            initialFilters={filters} 
            onFilterChange={handleFilterChange} 
            filterOptions={filterOptions} 
          />
        </div>
      </div>
      
      {/* Mostrar mensaje de error si existe */}
      {error && (
        <div className="row">
          <div className="col-12">
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          </div>
        </div>
      )}
      
      {/* KPI Cards */}
      <KPICards metrics={metrics} loading={loading} />
      
      {/* Navegación de pestañas */}
      <ul className="nav nav-pills mb-3" id="dashboard-tabs" role="tablist">
        <li className="nav-item" role="presentation">
          <button 
            className={`nav-link ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <i className="fas fa-chart-line me-2"></i>Visión General
          </button>
        </li>
        <li className="nav-item" role="presentation">
          <button 
            className={`nav-link ${activeTab === 'reports' ? 'active' : ''}`}
            onClick={() => setActiveTab('reports')}
          >
            <i className="fas fa-file-alt me-2"></i>Reportes
          </button>
        </li>
        <li className="nav-item" role="presentation">
          <button 
            className={`nav-link ${activeTab === 'activities' ? 'active' : ''}`}
            onClick={() => setActiveTab('activities')}
          >
            <i className="fas fa-tasks me-2"></i>Actividades
          </button>
        </li>
        <li className="nav-item" role="presentation">
          <button 
            className={`nav-link ${activeTab === 'workforce' ? 'active' : ''}`}
            onClick={() => setActiveTab('workforce')}
          >
            <i className="fas fa-users me-2"></i>Mano de Obra
          </button>
        </li>
        <li className="nav-item" role="presentation">
          <button 
            className={`nav-link ${activeTab === 'costs' ? 'active' : ''}`}
            onClick={() => setActiveTab('costs')}
          >
            <i className="fas fa-money-bill-wave me-2"></i>Costos
          </button>
        </li>
        <li className="nav-item" role="presentation">
          <button 
            className={`nav-link ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            <i className="fas fa-brain me-2"></i>Análisis Avanzado
          </button>
        </li>
      </ul>
      
      {/* Contenido de pestañas */}
      <div className="tab-content" id="dashboardTabContent">
        {/* Pestaña de Visión General */}
        {activeTab === 'overview' && (
          <TabVisión reports={reports} loading={loading} />
        )}
        
        {/* Pestaña de Reportes */}
        {activeTab === 'reports' && (
          <TabReportes reports={reports} loading={loading} />
        )}
        
        {/* Pestaña de Actividades */}
        {activeTab === 'activities' && (
          <TabActividades reports={reports} loading={loading} />
        )}
        
        {/* Pestaña de Mano de Obra */}
        {activeTab === 'workforce' && (
          <TabManoObra reports={reports} loading={loading} />
        )}
        
        {/* Pestaña de Costos */}
        {activeTab === 'costs' && (
          <TabCostos reports={reports} loading={loading} />
        )}
        
        {/* Pestaña de Análisis Avanzado */}
        {activeTab === 'analytics' && (
          <TabAnalisis reports={reports} loading={loading} />
        )}
      </div>
    </div>
  );
};

export default Dashboard;