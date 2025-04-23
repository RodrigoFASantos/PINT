import React, { useState, useEffect } from 'react';
import './css/formadorModal.css';
import '@fortawesome/fontawesome-free/css/all.min.css';

const FormadorModal = ({ isOpen, onClose, setFormador, users }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFormador, setSelectedFormador] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [sortOption, setSortOption] = useState('nameAsc');
  const [filteredUsers, setFilteredUsers] = useState([]);

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

  // Selecionar formador e fechar modal
  const handleSelectFormador = () => {
    if (selectedFormador) {
      // Passar o ID do formador conforme esperado pela aplicação
      setFormador(selectedFormador.id_utilizador || selectedFormador.id_user);
      onClose();
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h2>Selecionar Formador</h2>
          <button className="close-button" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        <div className="search-container">
          <div className="search-input-wrapper">
            <i className="fas fa-search search-icon"></i>
            <input
              type="text"
              placeholder="Pesquisar por nome ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          
          <button 
            className="filter-toggle-button"
            onClick={() => setShowFilters(!showFilters)}
          >
            <i className="fas fa-filter"></i> Filtros
          </button>
        </div>
        
        {showFilters && (
          <div className="filter-options">
            <div className="filter-option-group">
              <label>Ordenar por:</label>
              <select 
                value={sortOption} 
                onChange={(e) => setSortOption(e.target.value)}
                className="filter-select"
              >
                <option value="nameAsc">Nome (A-Z)</option>
                <option value="nameDesc">Nome (Z-A)</option>
                <option value="dateAsc">Data de inscrição (Mais antiga)</option>
                <option value="dateDesc">Data de inscrição (Mais recente)</option>
              </select>
            </div>
          </div>
        )}
        
        <div className="users-list">
          {filteredUsers.length > 0 ? (
            filteredUsers.map(user => (
              <div 
                key={user.id_utilizador || user.id_user}
                className={`user-item ${selectedFormador && (selectedFormador.id_utilizador === user.id_utilizador || selectedFormador.id_user === user.id_user) ? 'selected' : ''}`}
                onClick={() => setSelectedFormador(user)}
              >
                <div className="user-avatar">
                  {user.imagem_perfil ? (
                    <img src={user.imagem_perfil} alt={user.nome} />
                  ) : (
                    <span>{(user.nome || '?').charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className="user-info">
                  <div className="user-name">{user.nome}</div>
                  <div className="user-email">{user.email}</div>
                  {user.data_inscricao && (
                    <div className="user-date">
                      <i className="far fa-calendar-alt"></i> Inscrito em: {new Date(user.data_inscricao).toLocaleDateString()}
                    </div>
                  )}
                </div>
                {selectedFormador && (selectedFormador.id_utilizador === user.id_utilizador || selectedFormador.id_user === user.id_user) && (
                  <div className="check-icon">
                    <i className="fas fa-check-circle"></i>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="no-results">
              <i className="fas fa-search"></i>
              <p>Nenhum formador encontrado</p>
            </div>
          )}
        </div>
        
        <div className="modal-footer">
          <button 
            className="cancel-button"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button 
            className="select-button"
            onClick={handleSelectFormador}
            disabled={!selectedFormador}
          >
            Selecionar
          </button>
        </div>
      </div>
    </div>
  );
};

export default FormadorModal;