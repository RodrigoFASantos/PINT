import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './css/Criar_Topico_Modal.css';
import API_BASE from '../../api';

const CriarTopicoModal = ({ curso, onClose, onSuccess }) => {
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Extrair categoria do objeto curso
  const categoria = curso?.categoria;
  const categoriaId = categoria?.id_categoria || 
                      categoria?.id || 
                      curso?.id_categoria || 
                      '';
  const categoriaNome = categoria?.nome || 'Categoria';
  
  // ID do curso é necessário para criar o tópico
  const cursoId = curso?.id_curso || curso?.id || '';

  // Debug info
  useEffect(() => {
    console.log('Curso recebido no modal:', curso);
    console.log('Categoria extraída:', categoria);
    console.log('Categoria ID:', categoriaId);
    console.log('Categoria Nome:', categoriaNome);
    console.log('Curso ID:', cursoId);
  }, [curso, categoria, categoriaId, categoriaNome, cursoId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!titulo.trim()) {
      setError('O título do tópico é obrigatório');
      return;
    }
    
    // Verificar se temos o ID do curso
    if (!cursoId) {
      setError('ID do curso não encontrado');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('token');
      
      // ALTERAÇÃO 1: Mudei o endpoint para topicos-curso
      // ALTERAÇÃO 2: Mudei os parâmetros para corresponder ao que o backend espera
      const response = await axios.post(
        `${API_BASE}/topicos-curso`,
        {
          nome: titulo,           // Antes: titulo
          id_curso: cursoId,      // Antes: id_categoria
          descricao: descricao    // Este não é usado pelo backend mas mantemos
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      // ALTERAÇÃO 3: Ajustar a verificação de sucesso para o formato da resposta do backend
      if (response.status === 201 || response.status === 200) {
        if (onSuccess) {
          onSuccess(response.data.topico || response.data);
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
                {loading ? 'A criar...' : 'Criar Tópico'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CriarTopicoModal;