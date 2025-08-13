import React from 'react';
import styled from 'styled-components';
import { FaChevronLeft, FaChevronRight, FaAngleDoubleLeft, FaAngleDoubleRight } from 'react-icons/fa';

const PaginationContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  margin: 32px 0;
  flex-wrap: wrap;
  
  @media (max-width: 768px) {
    gap: 4px;
    margin: 24px 0;
  }
`;

const PaginationButton = styled.button`
  background: ${props => props.active ? '#FF0000' : '#2d2d2d'};
  color: ${props => props.active ? '#ffffff' : '#aaa'};
  border: 1px solid ${props => props.active ? '#FF0000' : '#444'};
  padding: 8px 12px;
  border-radius: 6px;
  cursor: ${props => props.disabled ? 'not-allowed' : 'pointer'};
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
  min-width: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: ${props => props.disabled ? 0.5 : 1};
  
  &:hover:not(:disabled) {
    background: ${props => props.active ? '#cc0000' : '#3d3d3d'};
    border-color: ${props => props.active ? '#cc0000' : '#555'};
    color: #ffffff;
  }
  
  &:disabled {
    cursor: not-allowed;
  }
  
  svg {
    font-size: 12px;
  }
  
  @media (max-width: 768px) {
    padding: 6px 10px;
    font-size: 13px;
    min-width: 36px;
  }
`;

const PageInfo = styled.div`
  color: #aaa;
  font-size: 14px;
  margin: 0 12px;
  white-space: nowrap;
  
  @media (max-width: 768px) {
    font-size: 12px;
    margin: 0 8px;
  }
`;

const PageInput = styled.input`
  background: #2d2d2d;
  border: 1px solid #444;
  color: #fff;
  padding: 4px 8px;
  border-radius: 4px;
  width: 60px;
  text-align: center;
  font-size: 14px;
  
  &:focus {
    outline: none;
    border-color: #FF0000;
  }
  
  @media (max-width: 768px) {
    width: 50px;
    font-size: 12px;
  }
`;

const Pagination = ({
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  showInfo = true,
  showQuickJump = true,
  maxVisiblePages = 5,
  className
}) => {
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page);
    }
  };

  const handleQuickJump = (e) => {
    if (e.key === 'Enter') {
      const page = parseInt(e.target.value);
      if (page >= 1 && page <= totalPages) {
        handlePageChange(page);
        e.target.value = '';
      }
    }
  };

  // Calcula quais páginas mostrar
  const getVisiblePages = () => {
    const delta = Math.floor(maxVisiblePages / 2);
    let start = Math.max(1, currentPage - delta);
    let end = Math.min(totalPages, start + maxVisiblePages - 1);
    
    // Ajusta se estamos no final
    if (end - start + 1 < maxVisiblePages) {
      start = Math.max(1, end - maxVisiblePages + 1);
    }
    
    const pages = [];
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  const visiblePages = getVisiblePages();

  if (totalPages <= 1) {
    return null;
  }

  return (
    <PaginationContainer className={className}>
      {/* Primeira página */}
      <PaginationButton
        onClick={() => handlePageChange(1)}
        disabled={currentPage === 1}
        title="Primeira página"
      >
        <FaAngleDoubleLeft />
      </PaginationButton>

      {/* Página anterior */}
      <PaginationButton
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
        title="Página anterior"
      >
        <FaChevronLeft />
      </PaginationButton>

      {/* Páginas visíveis */}
      {visiblePages.map(page => (
        <PaginationButton
          key={page}
          active={page === currentPage}
          onClick={() => handlePageChange(page)}
          title={`Página ${page}`}
        >
          {page}
        </PaginationButton>
      ))}

      {/* Próxima página */}
      <PaginationButton
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        title="Próxima página"
      >
        <FaChevronRight />
      </PaginationButton>

      {/* Última página */}
      <PaginationButton
        onClick={() => handlePageChange(totalPages)}
        disabled={currentPage === totalPages}
        title="Última página"
      >
        <FaAngleDoubleRight />
      </PaginationButton>

      {/* Informações da página */}
      {showInfo && (
        <PageInfo>
          Página {currentPage} de {totalPages}
        </PageInfo>
      )}

      {/* Salto rápido */}
      {showQuickJump && totalPages > maxVisiblePages && (
        <>
          <PageInfo>Ir para:</PageInfo>
          <PageInput
            type="number"
            min="1"
            max={totalPages}
            placeholder={currentPage}
            onKeyPress={handleQuickJump}
            title="Digite o número da página e pressione Enter"
          />
        </>
      )}
    </PaginationContainer>
  );
};

export default Pagination;
