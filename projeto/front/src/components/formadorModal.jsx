import React, { useState } from 'react';
import './css/formadorModal.css';
import '@fortawesome/fontawesome-free/css/all.min.css';

const FormadorModal = ({ isOpen, onClose, setFormador, users }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFormador, setSelectedFormador] = useState(null);

  // Se o modal não estiver aberto, não renderizar
  if (!isOpen) return null;

  // Filtrar usuários com base no termo de pesquisa
  const filteredUsers = users.filter(user => 
    user.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Selecionar formador e fechar modal
  const handleSelectFormador = () => {
    if (selectedFormador) {
      // Passar tanto o ID quanto o nome do formador para facilitar a exibição
      setFormador(selectedFormador.id_utilizador, selectedFormador.nome);
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
          <i className="fas fa-search search-icon"></i>
          <input
            type="text"
            placeholder="Pesquisar por nome ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="users-list">
          {filteredUsers.length > 0 ? (
            filteredUsers.map(user => (
              <div 
                key={user.id_utilizador}
                className={`user-item ${selectedFormador?.id_utilizador === user.id_utilizador ? 'selected' : ''}`}
                onClick={() => setSelectedFormador(user)}
              >
                <div className="user-avatar">
                  {user.nome.charAt(0).toUpperCase()}
                </div>
                <div className="user-info">
                  <div className="user-name">{user.nome}</div>
                  <div className="user-email">{user.email}</div>
                </div>
                {selectedFormador?.id_utilizador === user.id_utilizador && (
                  <div className="check-icon">
                    <i className="fas fa-check"></i>
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