import React from 'react';
import './css/Apagar_Certificado_Modal.css';

const Apagar_Certificado_Modal = ({ isOpen, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-content">
          <p>{message}</p>
          <div className="modal-buttons">
            <button className="btn-cancel" onClick={onCancel}>
              Cancelar
            </button>
            <button className="btn-confirm" onClick={onConfirm}>
              Confirmar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Apagar_Certificado_Modal;