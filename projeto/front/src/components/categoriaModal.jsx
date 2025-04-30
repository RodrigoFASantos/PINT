import React, { useState, useEffect } from 'react';
import '@fortawesome/fontawesome-free/css/all.min.css';
import './css/categoriaModal.css';

const CategoriaModal = ({ isOpen, onClose, setCategoria, categorias, currentCategoriaId }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoria, setSelectedCategoria] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [sortOption, setSortOption] = useState('nameAsc');
  const [filteredCategorias, setFilteredCategorias] = useState([]);
  const [loading, setLoading] = useState(false);

  // Quando o modal abre, definir a categoria atual como selecionada
  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      
      // Simular carga dos dados
      setTimeout(() => {
        if (currentCategoriaId && categorias && categorias.length > 0) {
          const currentCategoria = categorias.find(categoria => 
            categoria.id_categoria.toString() === currentCategoriaId.toString()
          );
          setSelectedCategoria(currentCategoria || null);
        } else {
          // Reset ao abrir o modal se não houver categoria selecionada
          setSelectedCategoria(null);
        }
        
        // Reset estados da interface quando o modal é aberto
        setShowFilters(false);
        setSearchTerm('');
        setLoading(false);
      }, 300);
    }
  }, [isOpen, categorias, currentCategoriaId]);

  useEffect(() => {
    if (categorias && categorias.length > 0) {
      let filtered = [...categorias];
      
      // Aplicar pesquisa
      if (searchTerm) {
        filtered = filtered.filter(categoria => 
          categoria.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          categoria.descricao?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      // Aplicar ordenação
      switch (sortOption) {
        case 'nameAsc':
          filtered.sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));
          break;
        case 'nameDesc':
          filtered.sort((a, b) => (b.nome || '').localeCompare(a.nome || ''));
          break;
        default:
          break;
      }
      
      setFilteredCategorias(filtered);
    } else {
      setFilteredCategorias([]);
    }
  }, [categorias, searchTerm, sortOption]);

  // Se o modal não estiver aberto, não renderizar
  if (!isOpen) return null;

  // Toggle seleção da categoria (se clicar na mesma, desseleciona)
  const handleToggleCategoria = (categoria) => {
    if (selectedCategoria && selectedCategoria.id_categoria === categoria.id_categoria) {
      setSelectedCategoria(null);
    } else {
      setSelectedCategoria(categoria);
    }
  };

  // Selecionar categoria e fechar modal
  const handleSelectCategoria = () => {
    if (selectedCategoria) {
      setCategoria(selectedCategoria.id_categoria);
      onClose();
    } else {
      setCategoria('');
      onClose();
    }
  };

  // Alternar exibição dos filtros
  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  // Função auxiliar para verificar se uma categoria está selecionada
  const isCategoriaSelected = (categoria) => {
    if (!selectedCategoria) return false;
    return selectedCategoria.id_categoria === categoria.id_categoria;
  };

  return (
    <div className="categoria-modal__overlay">
      <div className="categoria-modal__container">
        
        <div className="categoria-modal__header">
          <h2 className="categoria-modal__title">Selecionar Categoria</h2>
          <button 
            className="categoria-modal__close-button"
            onClick={onClose} 
            aria-label="Fechar"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        <div className="categoria-modal__search-container">
          <div className="categoria-modal__search-input-container">
            <i className="fas fa-search categoria-modal__search-icon"></i>
            <input
              type="text"
              placeholder="Pesquisar categoria..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="categoria-modal__search-input"
            />
          </div>
          
          <button 
            className="categoria-modal__filter-button"
            onClick={toggleFilters}
          >
            <i className="fas fa-filter categoria-modal__filter-icon"></i>
            <span>Filtros</span>
          </button>
        </div>
        
        {showFilters && (
          <div className="categoria-modal__filter-options">
            <div className="categoria-modal__filter-group">
              <label className="categoria-modal__filter-label">Ordenar por:</label>
              <select 
                value={sortOption} 
                onChange={(e) => setSortOption(e.target.value)}
                className="categoria-modal__filter-select"
              >
                <option value="nameAsc">Nome (A-Z)</option>
                <option value="nameDesc">Nome (Z-A)</option>
              </select>
            </div>
          </div>
        )}
        
        {loading ? (
          <div className="categoria-modal__loading">
            <i className="fas fa-spinner fa-spin"></i>
            <p>Carregando categorias...</p>
          </div>
        ) : (
          <div className="categoria-modal__list">
            {filteredCategorias.length > 0 ? (
              filteredCategorias.map(categoria => (
                <div 
                  key={categoria.id_categoria}
                  className={`categoria-modal__item ${
                    isCategoriaSelected(categoria) ? 'categoria-modal__item--selected' : ''
                  }`}
                  onClick={() => handleToggleCategoria(categoria)}
                >
                  <div className="categoria-modal__item-icon">
                    <i className="fas fa-folder"></i>
                  </div>
                  <div className="categoria-modal__item-info">
                    <div className="categoria-modal__item-name">{categoria.nome}</div>
                    {categoria.descricao && (
                      <div className="categoria-modal__item-description">{categoria.descricao}</div>
                    )}
                  </div>
                  {isCategoriaSelected(categoria) && (
                    <div className="categoria-modal__check-icon">
                      <i className="fas fa-check-circle"></i>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="categoria-modal__no-results">
                <i className="fas fa-search categoria-modal__no-results-icon"></i>
                <p>Nenhuma categoria encontrada</p>
              </div>
            )}
          </div>
        )}
        
        <div className="categoria-modal__footer">
          <button 
            className="categoria-modal__cancel-button"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button 
            className="categoria-modal__select-button"
            onClick={handleSelectCategoria}
          >
            {selectedCategoria ? 'Selecionar' : 'Remover Seleção'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CategoriaModal;