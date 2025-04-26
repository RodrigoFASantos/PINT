import React, { useState } from 'react';
import axios from 'axios';
import './css/CriarTopicoModal.css';
import API_BASE from '../api';

const CriarTopicoModal = ({ categoria, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: ''
  });
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validação básica
    if (!formData.titulo.trim()) {
      setErro('O título do tópico é obrigatório');
      return;
    }
    
    setLoading(true);
    setErro('');
    
    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.post(`${API_BASE}/topicos-categoria`, {
        id_categoria: categoria.id,
        titulo: formData.titulo,
        descricao: formData.descricao
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Chamar callback de sucesso e passar o novo tópico
      if (onSuccess) {
        onSuccess(response.data.data);
      }
    } catch (error) {
      console.error('Erro ao criar tópico:', error);
      setErro(
        error.response?.data?.message || 
        'Ocorreu um erro ao criar o tópico. Tente novamente.'
      );
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="criar-topico-modal">
        <div className="modal-header">
          <h2>Criar Novo Tópico</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <div className="categoria-info">
            <span>Categoria:</span> {categoria.nome}
          </div>
          
          {erro && <div className="error-message">{erro}</div>}
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="titulo">Título do Tópico</label>
              <input
                type="text"
                id="titulo"
                name="titulo"
                value={formData.titulo}
                onChange={handleChange}
                placeholder="Digite um título para o tópico"
                maxLength="100"
                disabled={loading}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="descricao">Descrição</label>
              <textarea
                id="descricao"
                name="descricao"
                value={formData.descricao}
                onChange={handleChange}
                placeholder="Descreva o objetivo deste tópico (opcional)"
                rows="4"
                disabled={loading}
              ></textarea>
            </div>
            
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