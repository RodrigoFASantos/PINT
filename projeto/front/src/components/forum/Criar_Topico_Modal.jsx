import React, { useState } from 'react';
import axios from 'axios';
import './css/Criar_Topico_Modal.css';
import API_BASE from '../../api';

const CriarTopicoModal = ({ categoria, onClose, onSuccess }) => {
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');


  const categoriaId = categoria?.id_categoria || categoria?.id || '';
  const categoriaNome = categoria?.nome || 'Categoria';

  console.log('Categoria recebida no modal:', categoria);
  console.log('Categoria ID:', categoriaId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!titulo.trim()) {
      setError('O título do tópico é obrigatório');
      return;
    }
    
    // Verifica se categoriaId está definido
    if (!categoriaId) {
      setError('Categoria inválida');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('token');
      
      // Usa categoriaId em vez de categoria?.id_categoria || categoria?.id
      const response = await axios.post(
        `${API_BASE}/topicos`,
        {
          id_categoria: categoriaId,
          titulo: titulo,
          descricao: descricao
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      if (response.data.success) {
        if (onSuccess) {
          onSuccess(response.data.data);
        }
        onClose();
      }
    } catch (error) {
      console.error('Erro ao criar tópico:', error);
      setError(error.response?.data?.message || 'Erro ao criar tópico. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h2>Criar Novo Tópico</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Categoria:</label>
              <p className="categoria-name">{categoriaNome}</p>
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
                {loading ? 'Criando...' : 'Criar Tópico'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CriarTopicoModal;