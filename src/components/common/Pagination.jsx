import React from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

export default function Pagination({ 
  currentPage = 1, 
  totalPages = 1, 
  onPageChange, 
  totalItems = 0, 
  itemsPerPage = 20 
}) {
  if (totalItems === 0 || totalPages <= 1) {
    // Si hay 20 o menos registros y solo 1 página, mostramos la info resumida de 1 página
    if (totalItems > 0) {
      return (
        <div className="pagination-container animate-fade-in">
          <div className="pagination-info">
            Mostrando <strong>{totalItems}</strong> {totalItems === 1 ? 'registro' : 'registros'}
          </div>
          <div className="pagination-controls">
            <span className="pagination-btn active" style={{ minWidth: '32px', height: '32px', cursor: 'default' }}>1</span>
          </div>
        </div>
      );
    }
    return null;
  }

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Generar número de páginas
  const pageNumbers = [];
  const maxPagesToShow = 5;

  let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
  let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

  if (endPage - startPage + 1 < maxPagesToShow) {
    startPage = Math.max(1, endPage - maxPagesToShow + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }

  return (
    <div className="pagination-container animate-fade-in">
      <div className="pagination-info">
        Mostrando del <strong>{startItem}</strong> al <strong>{endItem}</strong> de <strong>{totalItems}</strong> registros
      </div>

      <div className="pagination-controls">
        {/* Botón Anterior */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="pagination-btn"
          title="Página Anterior"
          aria-label="Página Anterior"
        >
          <FaChevronLeft style={{ fontSize: '11px' }} /> Anterior
        </button>

        {/* Primera página si está lejos */}
        {startPage > 1 && (
          <>
            <button
              type="button"
              onClick={() => onPageChange(1)}
              className={`pagination-btn ${currentPage === 1 ? 'active' : ''}`}
            >
              1
            </button>
            {startPage > 2 && <span style={{ color: 'var(--color-text-secondary)', padding: '0 4px' }}>...</span>}
          </>
        )}

        {/* Páginas intermedias */}
        {pageNumbers.map(page => (
          <button
            key={page}
            type="button"
            onClick={() => onPageChange(page)}
            className={`pagination-btn ${currentPage === page ? 'active' : ''}`}
          >
            {page}
          </button>
        ))}

        {/* Última página si está lejos */}
        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span style={{ color: 'var(--color-text-secondary)', padding: '0 4px' }}>...</span>}
            <button
              type="button"
              onClick={() => onPageChange(totalPages)}
              className={`pagination-btn ${currentPage === totalPages ? 'active' : ''}`}
            >
              {totalPages}
            </button>
          </>
        )}

        {/* Botón Siguiente */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="pagination-btn"
          title="Página Siguiente"
          aria-label="Página Siguiente"
        >
          Siguiente <FaChevronRight style={{ fontSize: '11px' }} />
        </button>
      </div>
    </div>
  );
}
