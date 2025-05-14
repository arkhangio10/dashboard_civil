// src/components/common/Pagination/Pagination.tsx
import React from 'react';
import './Pagination.scss';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  loading?: boolean;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  loading = false
}) => {
  // No mostrar paginación si solo hay una página
  if (totalPages <= 1) {
    return null;
  }

  // Determinar qué páginas mostrar
  const renderPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;
    
    let startPage: number;
    let endPage: number;
    
    if (totalPages <= maxPagesToShow) {
      // Mostrar todas las páginas si son menos que el máximo
      startPage = 1;
      endPage = totalPages;
    } else {
      // Si hay más páginas que el máximo a mostrar
      const maxPagesBeforeCurrentPage = Math.floor(maxPagesToShow / 2);
      const maxPagesAfterCurrentPage = Math.ceil(maxPagesToShow / 2) - 1;
      
      if (currentPage <= maxPagesBeforeCurrentPage) {
        // Si estamos cerca del inicio
        startPage = 1;
        endPage = maxPagesToShow;
      } else if (currentPage + maxPagesAfterCurrentPage >= totalPages) {
        // Si estamos cerca del final
        startPage = totalPages - maxPagesToShow + 1;
        endPage = totalPages;
      } else {
        // En medio
        startPage = currentPage - maxPagesBeforeCurrentPage;
        endPage = currentPage + maxPagesAfterCurrentPage;
      }
    }
    
    // Generar números de página
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }
    
    return pageNumbers;
  };

  return (
    <nav aria-label="Paginación de reportes" className="pagination-container">
      <ul className="pagination justify-content-center">
        {/* Botón Primera Página */}
        <li className={`page-item ${currentPage === 1 || loading ? 'disabled' : ''}`}>
          <button 
            className="page-link" 
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1 || loading}
            aria-label="Primera página"
          >
            <i className="fas fa-angle-double-left"></i>
          </button>
        </li>
        
        {/* Botón Anterior */}
        <li className={`page-item ${currentPage === 1 || loading ? 'disabled' : ''}`}>
          <button 
            className="page-link" 
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1 || loading}
            aria-label="Página anterior"
          >
            <i className="fas fa-angle-left"></i>
          </button>
        </li>
        
        {/* Números de Página */}
        {renderPageNumbers().map(number => (
          <li 
            key={number} 
            className={`page-item ${currentPage === number ? 'active' : ''} ${loading ? 'disabled' : ''}`}
          >
            <button 
              className="page-link" 
              onClick={() => onPageChange(number)}
              disabled={loading}
            >
              {number}
            </button>
          </li>
        ))}
        
        {/* Botón Siguiente */}
        <li className={`page-item ${currentPage === totalPages || loading ? 'disabled' : ''}`}>
          <button 
            className="page-link" 
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages || loading}
            aria-label="Página siguiente"
          >
            <i className="fas fa-angle-right"></i>
          </button>
        </li>
        
        {/* Botón Última Página */}
        <li className={`page-item ${currentPage === totalPages || loading ? 'disabled' : ''}`}>
          <button 
            className="page-link" 
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages || loading}
            aria-label="Última página"
          >
            <i className="fas fa-angle-double-right"></i>
          </button>
        </li>
      </ul>
      
      {/* Información de paginación */}
      <div className="pagination-info text-center mt-2">
        <small>
          Página {currentPage} de {totalPages}
        </small>
      </div>
    </nav>
  );
};

export default Pagination;