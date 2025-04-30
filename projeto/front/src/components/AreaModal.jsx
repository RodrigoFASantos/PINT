import React, { useState, useEffect } from 'react';
import '@fortawesome/fontawesome-free/css/all.min.css';
import './css/areaModal.css';


const AreaModal = ({ isOpen, onClose, setArea, categoriaId, currentAreaId }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedArea, setSelectedArea] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [sortOption, setSortOption] = useState('nameAsc');
  const [filteredAreas, setFilteredAreas] = useState([]);
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [categoriaInfo, setCategoriaInfo] = useState(null);

  // Simular carregamento de áreas com base na categoria selecionada
  useEffect(() => {
    const fetchAreas = async () => {
      if (!categoriaId || !isOpen) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Simulação de delay de rede
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Usar dados simulados em vez de API
        const categoriasSimuladas = [
          { id_categoria: 1, nome: 'Tecnologia' },
          { id_categoria: 2, nome: 'Gestão' },
          { id_categoria: 3, nome: 'Soft Skills' }
        ];
        
        // Obter áreas correspondentes à categoria
       
        
        // Informações da categoria
        const categoriaAtual = categoriasSimuladas.find(
          cat => cat.id_categoria.toString() === categoriaId.toString()
        );
        
        
        setCategoriaInfo(categoriaAtual);
        
      } catch (err) {
        console.error('Erro ao carregar áreas:', err);
        setError('Não foi possível carregar as áreas. Tente novamente mais tarde.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAreas();
  }, [categoriaId, isOpen]);

  // Quando o modal abre, definir a área atual como selecionada
  useEffect(() => {
    if (isOpen && areas && areas.length > 0 && currentAreaId) {
      const currentArea = areas.find(area => 
        area.id_area.toString() === currentAreaId.toString()
      );
      setSelectedArea(currentArea || null);
    } else if (isOpen) {
      // Reset ao abrir o modal se não houver área selecionada
      setSelectedArea(null);
    }
    
    // Reset estados da interface quando o modal é aberto
    setShowFilters(false);
    setSearchTerm('');
  }, [isOpen, areas, currentAreaId]);

  // Filtrar e ordenar áreas
  useEffect(() => {
    if (areas && areas.length > 0) {
      let filtered = [...areas];
      
      // Aplicar pesquisa
      if (searchTerm) {
        filtered = filtered.filter(area => 
          area.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          area.descricao?.toLowerCase().includes(searchTerm.toLowerCase())
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
      
      setFilteredAreas(filtered);
    } else {
      setFilteredAreas([]);
    }
  }, [areas, searchTerm, sortOption]);

  // Se o modal não estiver aberto, não renderizar
  if (!isOpen) return null;

  // Toggle seleção da área (se clicar na mesma, desseleciona)
  const handleToggleArea = (area) => {
    if (selectedArea && selectedArea.id_area === area.id_area) {
      setSelectedArea(null);
    } else {
      setSelectedArea(area);
    }
  };

  // Selecionar área e fechar modal
  const handleSelectArea = () => {
    if (selectedArea) {
      setArea(selectedArea.id_area);
      onClose();
    } else {
      setArea('');
      onClose();
    }
  };

  // Alternar exibição dos filtros
  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  // Função auxiliar para verificar se uma área está selecionada
  const isAreaSelected = (area) => {
    if (!selectedArea) return false;
    return selectedArea.id_area === area.id_area;
  };

  return (
    <div className="area-modal__overlay">
      <div className="area-modal__container">
        
        <div className="area-modal__header">
          <h2 className="area-modal__title">
            Selecionar Área 
            {categoriaInfo && <span className="area-modal__subtitle">{` em ${categoriaInfo.nome}`}</span>}
          </h2>
          <button 
            className="area-modal__filter-button"
            onClick={toggleFilters}
          >
            <i className="fas fa-filter area-modal__filter-icon"></i>
            <span>Filtros</span>
          </button>
        </div>
        
        {showFilters && (
          <div className="area-modal__filter-options">
            <div className="area-modal__filter-group">
              <label className="area-modal__filter-label">Ordenar por:</label>
              <select 
                value={sortOption} 
                onChange={(e) => setSortOption(e.target.value)}
                className="area-modal__filter-select"
              >
                <option value="nameAsc">Nome (A-Z)</option>
                <option value="nameDesc">Nome (Z-A)</option>
              </select>
            </div>
          </div>
        )}
        
        {loading ? (
          <div className="area-modal__loading">
            <i className="fas fa-spinner fa-spin area-modal__loading-icon"></i>
            <p>Carregando áreas...</p>
          </div>
        ) : error ? (
          <div className="area-modal__error">
            <i className="fas fa-exclamation-triangle area-modal__error-icon"></i>
            <p>{error}</p>
            <button 
              className="area-modal__retry-button"
              onClick={() => {
                // Recarregar as áreas (simulação)
                setLoading(true);
                setError(null);
                setTimeout(() => {
                  
                  setLoading(false);
                }, 500);
              }}
            >
              Tentar novamente
            </button>
          </div>
        ) : (
          <div className="area-modal__list">
            {filteredAreas.length > 0 ? (
              filteredAreas.map(area => (
                <div 
                  key={area.id_area}
                  className={`area-modal__item ${
                    isAreaSelected(area) ? 'area-modal__item--selected' : ''
                  }`}
                  onClick={() => handleToggleArea(area)}
                >
                  <div className="area-modal__item-icon">
                    <i className="fas fa-bookmark"></i>
                  </div>
                  <div className="area-modal__item-info">
                    <div className="area-modal__item-name">{area.nome}</div>
                    {area.descricao && (
                      <div className="area-modal__item-description">{area.descricao}</div>
                    )}
                  </div>
                  {isAreaSelected(area) && (
                    <div className="area-modal__check-icon">
                      <i className="fas fa-check-circle"></i>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="area-modal__no-results">
                <i className="fas fa-search area-modal__no-results-icon"></i>
                <p>Nenhuma área encontrada para esta categoria</p>
              </div>
            )}
          </div>
        )}
        
        <div className="area-modal__footer">
          <button 
            className="area-modal__cancel-button"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button 
            className="area-modal__select-button"
            onClick={handleSelectArea}
            disabled={loading}
          >
            {selectedArea ? 'Selecionar' : 'Remover Seleção'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AreaModal;
            