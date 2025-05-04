import React, { useState } from 'react';
import axios from 'axios';
import './css/Modal.css';
import API_BASE from '../api';

const SolicitarTopicoModal = ({ categoria, onClose, onSuccess }) => {
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!titulo.trim()) {
      setError('O título do tópico é obrigatório');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE}/topicos/solicitar`,
        {
          id_categoria: categoria.id_categoria || categoria.id,
          titulo: titulo,
          descricao: descricao
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      if (response.data.success) {
        if (onSuccess) {
          onSuccess();
        }
        onClose();
      }
    } catch (error) {
      console.error('Erro ao solicitar tópico:', error);
      setError(error.response?.data?.message || 'Erro ao solicitar tópico. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h2>Solicitar Novo Tópico</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Categoria:</label>
              <p className="categoria-name">{categoria.nome}</p>
            </div>
            
            <div className="form-group">
              <label htmlFor="titulo">Título do Tópico:</label>
              <input
                type="text"
                id="titulo"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Digite o título do tópico"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="descricao">Descrição (opcional):</label>
              <textarea
                id="descricao"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Digite uma breve descrição do tópico"
                rows="4"
              ></textarea>
            </div>
            
            {error && <div className="error-message">{error}</div>}
            
            <div className="modal-footer">
              <button
                type="button"
                className="cancel-btn"
                onClick={onClose}
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="submit-btn"
                disabled={loading}
              >
                {loading ? 'Enviando...' : 'Enviar Solicitação'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SolicitarTopicoModal;