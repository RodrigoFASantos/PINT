import React from 'react';
import '../styles//formadorModal.css'; 

const CategoriaModal = ({ isOpen, onClose, setCategoria, nome }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="close-button" onClick={onClose}>X</button>
        <h2>Selecionar Categoria</h2>
        <ul className="modal-list">
          {nome && nome.length > 0 ? (
            nome.map(user => (
              <li className="modal-list-item" key={user.id_categoria} onClick={() => {
                setCategoria(user.id_categoria);
                onClose();
              }}>
                {nome.nome} 
              </li>
            ))
          ) : (
            <li>Nenhuma categoria disponível</li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default CategoriaModal;