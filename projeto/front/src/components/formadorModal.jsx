import React from 'react';
import '../components/css/formadorModal.css';

const FormadorModal = ({ isOpen, onClose, setFormador, users }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="close-button" onClick={onClose}>X</button>
        <h2>Selecionar Formador</h2>
        <ul className="modal-list">
          {users && users.length > 0 ? (
            users.map(user => (
              <li className="modal-list-item" key={user.id_utilizador} onClick={() => {
                setFormador(user.id_utilizador);
                onClose();
              }}>
                {user.nome} ({user.email})
              </li>
            ))
          ) : (
            <li>Nenhum formador disponível</li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default FormadorModal;