import React, { useState, useEffect } from 'react';
import '@fortawesome/fontawesome-free/css/all.min.css';
import './css/formadorModal.css';

const FormadorModal = ({ isOpen, onClose, setFormador, users, currentFormadorId }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFormador, setSelectedFormador] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [sortOption, setSortOption] = useState('nameAsc');
  const [filteredUsers, setFilteredUsers] = useState([]);

  // Quando o modal abre, definir o formador atual como selecionado
  useEffect(() => {
    if (isOpen && users && users.length > 0 && currentFormadorId) {
      const currentFormador = users.find(user => 
        (user.id_utilizador && user.id_utilizador.toString() === currentFormadorId.toString()) || 
        (user.id_user && user.id_user.toString() === currentFormadorId.toString())
      );
      setSelectedFormador(currentFormador || null);
    } else if (isOpen) {
      // Reset ao abrir o modal se não houver formador selecionado
      setSelectedFormador(null);
    }
    
    // Reset estados da interface quando o modal é aberto
    setShowFilters(false);
    setSearchTerm('');
  }, [isOpen, users, currentFormadorId]);

  useEffect(() => {
    if (users && users.length > 0) {
      let filtered = [...users];
      
      // Aplicar pesquisa
      if (searchTerm) {
        filtered = filtered.filter(user => 
          user.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email?.toLowerCase().includes(searchTerm.toLowerCase())
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
        case 'dateAsc':
          filtered.sort((a, b) => {
            const dateA = a.data_inscricao ? new Date(a.data_inscricao) : new Date(0);
            const dateB = b.data_inscricao ? new Date(b.data_inscricao) : new Date(0);
            return dateA - dateB;
          });
          break;
        case 'dateDesc':
          filtered.sort((a, b) => {
            const dateA = a.data_inscricao ? new Date(a.data_inscricao) : new Date(0);
            const dateB = b.data_inscricao ? new Date(b.data_inscricao) : new Date(0);
            return dateB - dateA;
          });
          break;
        default:
          break;
      }
      
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers([]);
    }
  }, [users, searchTerm, sortOption]);

  // Se o modal não estiver aberto, não renderizar
  if (!isOpen) return null;

  // Toggle seleção do formador (se clicar no mesmo, desseleciona)
  const handleToggleFormador = (user) => {
    if (selectedFormador && 
        ((selectedFormador.id_utilizador && user.id_utilizador && 
          selectedFormador.id_utilizador.toString() === user.id_utilizador.toString()) || 
         (selectedFormador.id_user && user.id_user &&
          selectedFormador.id_user.toString() === user.id_user.toString()))) {
      setSelectedFormador(null);
    } else {
      setSelectedFormador(user);
    }
  };

  // Selecionar formador e fechar modal
  const handleSelectFormador = () => {
    if (selectedFormador) {
      // Passar o ID do formador conforme esperado pela aplicação
      setFormador(selectedFormador.id_utilizador || selectedFormador.id_user);
      onClose();
    } else {
      // Se não houver formador selecionado, passar null ou '' para remover
      setFormador('');
      onClose();
    }
  };

  // Alternar exibição dos filtros
  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  // Função auxiliar para verificar se um formador está selecionado
  const isFormadorSelected = (user) => {
    if (!selectedFormador) return false;
    
    if (selectedFormador.id_utilizador && user.id_utilizador) {
      return selectedFormador.id_utilizador.toString() === user.id_utilizador.toString();
    }
    
    if (selectedFormador.id_user && user.id_user) {
      return selectedFormador.id_user.toString() === user.id_user.toString();
    }
    
    return false;
  };

  return (
    <div className="formador-modal__overlay">
      <div className="formador-modal__container">
        
        <div className="formador-modal__header">
          <h2 className="formador-modal__title">Selecionar Formador</h2>
          <button 
            className="formador-modal__close-button"
            onClick={onClose} 
            aria-label="Fechar"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        <div className="formador-modal__search-container">
          <div className="formador-modal__search-input-container">
            <i className="fas fa-search formador-modal__search-icon"></i>
            <input
              type="text"
              placeholder="Pesquisar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="formador-modal__search-input"
            />
          </div>
          
          <button 
            className="formador-modal__filter-button"
            onClick={toggleFilters}
          >
            <i className="fas fa-filter formador-modal__filter-icon"></i>
            <span>Filtros</span>
          </button>
        </div>
        
        {showFilters && (
          <div className="formador-modal__filter-options">
            <div className="formador-modal__filter-group">
              <label className="formador-modal__filter-label">Ordenar por:</label>
              <select 
                value={sortOption} 
                onChange={(e) => setSortOption(e.target.value)}
                className="formador-modal__filter-select"
              >
                <option value="nameAsc">Nome (A-Z)</option>
                <option value="nameDesc">Nome (Z-A)</option>
                <option value="dateAsc">Data de inscrição (Mais antiga)</option>
                <option value="dateDesc">Data de inscrição (Mais recente)</option>
              </select>
            </div>
          </div>
        )}
        
        <div className="formador-modal__users-list">
          {filteredUsers.length > 0 ? (
            filteredUsers.map(user => (
              <div 
                key={user.id_utilizador || user.id_user}
                className={`formador-modal__user-item ${
                  isFormadorSelected(user) ? 'formador-modal__user-item--selected' : ''
                }`}
                onClick={() => handleToggleFormador(user)}
              >
                <div className="formador-modal__user-avatar">
                  {user.imagem_perfil ? (
                    <img 
                      src={user.imagem_perfil} 
                      alt={user.nome} 
                      style={{width: '100%', height: '100%', objectFit: 'cover'}}
                    />
                  ) : (
                    <span>{(user.nome || '?').charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className="formador-modal__user-info">
                  <div className="formador-modal__user-name">{user.nome}</div>
                  <div className="formador-modal__user-email">{user.email}</div>
                </div>
                {isFormadorSelected(user) && (
                  <div className="formador-modal__check-icon">
                    <i className="fas fa-check-circle"></i>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="formador-modal__no-results">
              <i className="fas fa-search formador-modal__no-results-icon"></i>
              <p>Nenhum formador encontrado</p>
            </div>
          )}
        </div>
        
        <div className="formador-modal__footer">
          <button 
            className="formador-modal__cancel-button"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button 
            className="formador-modal__select-button"
            onClick={handleSelectFormador}
          >
            {selectedFormador ? 'Selecionar' : 'Remover Seleção'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FormadorModal;