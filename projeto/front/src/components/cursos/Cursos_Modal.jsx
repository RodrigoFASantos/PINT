import React, { useState, useEffect } from "react";
import axios from "axios";
import "./css/Cursos_Modal.css";
import API_BASE from "../../api";

const CursosModal = ({ isOpen, onClose, onSelect, categoriasSelecionadas, areasSelecionadas }) => {
  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [cursoSelecionado, setCursoSelecionado] = useState(null);
  
  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    if (isOpen && categoriasSelecionadas && categoriasSelecionadas.length > 0) {
      carregarCursos(currentPage);
    } else if (isOpen) {
      // If no categories selected, clear courses
      setCursos([]);
      setLoading(false);
      setError("Selecione pelo menos uma categoria primeiro");
    }
  }, [isOpen, currentPage, categoriasSelecionadas, areasSelecionadas]);

  const carregarCursos = async (page) => {
    if (!categoriasSelecionadas || categoriasSelecionadas.length === 0) {
      return;
    }
  
    try {
      setLoading(true);
      
      // Extract category IDs
      const categoriaIds = categoriasSelecionadas.map(cat => cat.id_categoria).join(',');
      
      // Get courses filtered by categories using existing endpoint
      const response = await axios.get(`${API_BASE}/cursos/por-categoria`, {
        params: {
          categorias: categoriaIds,
          page: page,
          limit: 50 // Get more results to allow for client-side filtering
        }
      });
      
      let filteredCursos = response.data.cursos;
      
      // If areas are selected, filter courses by those areas on the client side
      if (areasSelecionadas && areasSelecionadas.length > 0) {
        const areaIds = areasSelecionadas.map(area => area.id_area);
        filteredCursos = filteredCursos.filter(curso => 
          curso.id_area && areaIds.includes(curso.id_area)
        );
      }
      
      // Update state with filtered courses
      setCursos(filteredCursos);
      
      // Update pagination manually based on filtered results
      const totalFilteredItems = filteredCursos.length;
      setTotalItems(totalFilteredItems);
      setTotalPages(Math.max(1, Math.ceil(totalFilteredItems / 10)));
      
      // Reset error state
      setError(null);
    } catch (err) {
      console.error("Erro ao carregar cursos:", err);
      setError("Não foi possível carregar a lista de cursos");
      setCursos([]);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar cursos com base no termo de busca
  const cursosFiltrados = cursos.filter(curso =>
    curso.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCursoClick = (curso) => {
    setCursoSelecionado(curso.id_curso);
  };

  const handleConfirmar = () => {
    if (cursoSelecionado) {
      onSelect(cursoSelecionado);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Renderizar botões de paginação
  const renderPaginacao = () => {
    const pageBtns = [];
    
    // Botão Anterior
    pageBtns.push(
      <button 
        key="prev" 
        className="page-button" 
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        &laquo; Anterior
      </button>
    );
    
    // Botões de página
    // Mostrar primeira página, página atual e última página, com "..." entre elas se necessário
    if (totalPages <= 5) {
      // Se houver 5 ou menos páginas, mostrar todas
      for (let i = 1; i <= totalPages; i++) {
        pageBtns.push(
          <button 
            key={i} 
            className={`page-button ${currentPage === i ? 'current-page' : ''}`}
            onClick={() => handlePageChange(i)}
          >
            {i}
          </button>
        );
      }
    } else {
      // Mostrar primeira página
      pageBtns.push(
        <button 
          key={1} 
          className={`page-button ${currentPage === 1 ? 'current-page' : ''}`}
          onClick={() => handlePageChange(1)}
        >
          1
        </button>
      );
      
      // Mostrar "..." ou página 2
      if (currentPage > 3) {
        pageBtns.push(<span key="ellipsis1" className="ellipsis">...</span>);
      } else if (currentPage !== 1) {
        pageBtns.push(
          <button 
            key={2} 
            className={`page-button ${currentPage === 2 ? 'current-page' : ''}`}
            onClick={() => handlePageChange(2)}
          >
            2
          </button>
        );
      }
      
      // Mostrar página atual (se não for primeira ou última)
      if (currentPage !== 1 && currentPage !== totalPages) {
        if (currentPage !== 2 && currentPage !== totalPages - 1) {
          pageBtns.push(
            <button 
              key={currentPage} 
              className="page-button current-page"
              onClick={() => handlePageChange(currentPage)}
            >
              {currentPage}
            </button>
          );
        }
      }
      
      // Mostrar "..." ou penúltima página
      if (currentPage < totalPages - 2) {
        pageBtns.push(<span key="ellipsis2" className="ellipsis">...</span>);
      } else if (currentPage !== totalPages) {
        pageBtns.push(
          <button 
            key={totalPages - 1} 
            className={`page-button ${currentPage === totalPages - 1 ? 'current-page' : ''}`}
            onClick={() => handlePageChange(totalPages - 1)}
          >
            {totalPages - 1}
          </button>
        );
      }
      
      // Mostrar última página
      pageBtns.push(
        <button 
          key={totalPages} 
          className={`page-button ${currentPage === totalPages ? 'current-page' : ''}`}
          onClick={() => handlePageChange(totalPages)}
        >
          {totalPages}
        </button>
      );
    }
    
    // Botão Próximo
    pageBtns.push(
      <button 
        key="next" 
        className="page-button" 
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        Próximo &raquo;
      </button>
    );
    
    return pageBtns;
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h2>Selecionar Curso</h2>
          <button className="close-button" onClick={onClose}>
            &times;
          </button>
        </div>
        
        <div className="modal-search">
          <input
            type="text"
            placeholder="Buscar cursos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="modal-body">
          {loading ? (
            <p className="loading">Carregando cursos...</p>
          ) : error ? (
            <p className="error">{error}</p>
          ) : cursosFiltrados.length === 0 ? (
            <p className="no-results">Nenhum curso encontrado nas categorias selecionadas</p>
          ) : (
            <div className="item-list">
              {cursosFiltrados.map((curso) => (
                <div
                  key={curso.id_curso}
                  className={`item ${cursoSelecionado === curso.id_curso ? "selected" : ""}`}
                  onClick={() => handleCursoClick(curso)}
                >
                  <div className="item-info">
                    <div className="item-name">{curso.nome}</div>
                    <div className="item-description">
                      {curso.categoria && <span>Categoria: {curso.categoria.nome}</span>}
                      {curso.area && <span> | Área: {curso.area.nome}</span>}
                      {curso.tipo && <span> | Tipo: {curso.tipo}</span>}
                      {curso.vagas !== null && <span> | Vagas: {curso.vagas}</span>}
                    </div>
                  </div>
                  
                  {cursoSelecionado === curso.id_curso && (
                    <div className="selected-icon">✓</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Paginação */}
        {!loading && !error && totalPages > 1 && (
          <div className="pagination">
            {renderPaginacao()}
          </div>
        )}
        
        <div className="modal-footer">
          <div className="items-info">
            {totalItems > 0 && (
              <span>Mostrando {cursosFiltrados.length} de {totalItems} cursos</span>
            )}
          </div>
          <div className="modal-actions">
            <button className="cancel-button" onClick={onClose}>
              Cancelar
            </button>
            <button 
              className="confirm-button" 
              onClick={handleConfirmar}
              disabled={!cursoSelecionado}
            >
              Confirmar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CursosModal;