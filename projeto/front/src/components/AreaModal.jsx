import React, { useState, useEffect } from 'react';
import '@fortawesome/fontawesome-free/css/all.min.css';
import './css/areaModal.css';

const AreaModal = ({ isOpen, onClose, areas, areasSelecionadas, onSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [localAreasSelecionadas, setLocalAreasSelecionadas] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [sortOption, setSortOption] = useState('nameAsc');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Inicializar áreas selecionadas locais quando o componente montar ou quando as props mudarem
  useEffect(() => {
    setLocalAreasSelecionadas(areasSelecionadas || []);
  }, [areasSelecionadas]);

  // Se o modal não estiver aberto, não renderizar
  if (!isOpen) return null;

  // Filtrar áreas com base no termo de busca
  const areasFiltradas = areas.filter(area => 
    area.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Aplicar ordenação às áreas filtradas
  const areasOrdenadas = [...areasFiltradas].sort((a, b) => {
    switch (sortOption) {
      case 'nameAsc':
        return a.nome.localeCompare(b.nome);
      case 'nameDesc':
        return b.nome.localeCompare(a.nome);
      default:
        return 0;
    }
  });

  // Toggle seleção da área (adicionar ou remover da seleção)
  const handleAreaClick = (area) => {
    const jaSelecionada = localAreasSelecionadas.some(
      (a) => a.id_area === area.id_area
    );
    
    if (jaSelecionada) {
      // Remover da seleção
      setLocalAreasSelecionadas(
        localAreasSelecionadas.filter(
          (a) => a.id_area !== area.id_area
        )
      );
    } else {
      // Adicionar à seleção
      setLocalAreasSelecionadas([...localAreasSelecionadas, area]);
    }
  };

  // Confirmar seleção e fechar modal
  const handleConfirmar = () => {
    onSelect(localAreasSelecionadas);
  };

  // Alternar exibição dos filtros
  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  // Verificar se uma área está selecionada
  const isAreaSelected = (area) => {
    return localAreasSelecionadas.some(a => a.id_area === area.id_area);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h2>Selecionar Áreas</h2>
          <button className="close-button" onClick={onClose}>
            &times;
          </button>
        </div>
        
        <div className="modal-search">
          <input
            type="text"
            placeholder="Buscar áreas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="filter-options">
          <button 
            className="filter-button"
            onClick={toggleFilters}
          >
            <i className="fas fa-filter"></i> Filtros
          </button>
          
          {showFilters && (
            <div className="sort-options">
              <label>Ordenar por:</label>
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
              >
                <option value="nameAsc">Nome (A-Z)</option>
                <option value="nameDesc">Nome (Z-A)</option>
              </select>
            </div>
          )}
        </div>
        
        <div className="modal-body">
          {loading ? (
            <div className="loading">
              <i className="fas fa-spinner fa-spin"></i>
              <p>Carregando áreas...</p>
            </div>
          ) : error ? (
            <div className="error">
              <i className="fas fa-exclamation-triangle"></i>
              <p>{error}</p>
            </div>
          ) : areasOrdenadas.length === 0 ? (
            <p className="no-results">Nenhuma área encontrada</p>
          ) : (
            <div className="item-list">
              {areasOrdenadas.map((area) => (
                <div
                  key={area.id_area}
                  className={`item ${isAreaSelected(area) ? "selected" : ""}`}
                  onClick={() => handleAreaClick(area)}
                >
                  <div className="item-name">{area.nome}</div>
                  {area.descricao && (
                    <div className="item-description">{area.descricao}</div>
                  )}
                  {isAreaSelected(area) && <div className="selected-icon">✓</div>}
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="modal-footer">
          <span className="selection-count">
            {localAreasSelecionadas.length} áreas selecionadas
          </span>
          <div className="modal-actions">
            <button className="cancel-button" onClick={onClose}>
              Cancelar
            </button>
            <button className="confirm-button" onClick={handleConfirmar}>
              Confirmar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AreaModal;