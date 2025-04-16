import React, { useState } from 'react';
import axios from 'axios';
import './css/CriarTopicoModal.css';
import API_BASE from '../api';

const CriarTopicoModal = ({ categoria, area, onClose, onSuccess }) => {
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validação básica
    if (!titulo.trim()) {
      setError('Por favor, insira um título para o tópico');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      
      // Obter IDs de categoria e área
      const [categoriaResponse, areaResponse] = await Promise.all([
        axios.get(`${API_BASE}/categorias?nome=${encodeURIComponent(categoria)}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_BASE}/areas?nome=${encodeURIComponent(area)}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      
      const categoriaId = categoriaResponse.data[0]?.id;
      const areaId = areaResponse.data[0]?.id;
      
      if (!categoriaId || !areaId) {
        throw new Error('Não foi possível identificar a categoria ou área');
      }
      
      // Criar tópico
      await axios.post(`${API_BASE}/topicos`, {
        titulo,
        descricao,
        id_categoria: categoriaId,
        id_area: areaId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Sucesso
      setLoading(false);
      onSuccess();
    } catch (error) {
      console.error('Erro ao criar tópico:', error);
      setError(error.response?.data?.mensagem || 'Não foi possível criar o tópico. Tente novamente.');
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h3>Criar Novo Tópico</h3>
          <button className="btn-fechar" onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Categoria:</label>
            <input type="text" value={categoria} disabled />
          </div>
          
          <div className="form-group">
            <label>Área:</label>
            <input type="text" value={area} disabled />
          </div>
          
          <div className="form-group">
            <label>Título do Tópico:</label>
            <input 
              type="text" 
              value={titulo} 
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Insira um título descritivo"
              maxLength={100}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Descrição:</label>
            <textarea 
              value={descricao} 
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descreva o objetivo deste tópico..."
              rows={4}
            />
          </div>
          
          {error && <div className="error-message">{error}</div>}
          
          <div className="modal-actions">
            <button 
              type="button" 
              className="btn-cancelar" 
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="btn-salvar" 
              disabled={loading}
            >
              {loading ? 'Criando...' : 'Criar Tópico'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CriarTopicoModal;