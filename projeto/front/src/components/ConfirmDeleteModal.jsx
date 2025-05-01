import React from 'react';
import './css/Modal.css';

const ConfirmDeleteModal = ({ user, onClose, onConfirm, error, cursos, onVerCurso }) => {
  return (
    <div className="modal-overlay">
      <div className="modal-content confirm-delete-modal">
        <div className="modal-header">
          <h2>Confirmar Eliminação</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          {error ? (
            <div className="error-container">
              <p className="error-message">{error}</p>
              
              {cursos && cursos.length > 0 && (
                <div className="cursos-list">
                  <p>Este formador está associado aos seguintes cursos:</p>
                  <ul>
                    {cursos.map(curso => (
                      <li key={curso.id}>
                        {curso.nome}
                        <button 
                          className="ver-curso-btn"
                          onClick={() => onVerCurso(curso.id)}
                        >
                          Ver Curso
                        </button>
                      </li>
                    ))}
                  </ul>
                  <p>É necessário alterar o formador destes cursos antes de eliminar o utilizador.</p>
                </div>
              )}
            </div>
          ) : (
            <>
              <p>Tem certeza de que deseja eliminar o utilizador <strong>{user.nome}</strong>?</p>
              <p className="warning-text">Esta ação não pode ser desfeita e todos os dados associados a este utilizador serão eliminados.</p>
              
              {user.id_cargo === 2 && (
                <p className="info-text">Nota: Se este formador estiver associado a cursos ativos, não será possível eliminá-lo.</p>
              )}
            </>
          )}
        </div>
        <div className="modal-footer">
          <button className="cancel-btn" onClick={onClose}>Cancelar</button>
          {!error && (
            <button className="confirm-btn" onClick={onConfirm}>Confirmar</button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConfirmDeleteModal;