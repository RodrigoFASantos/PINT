import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './css/CriarTopicoModal.css';
import API_BASE from '../api';

const CriarTopicoModal = ({ curso, onClose, onSuccess }) => {
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Debug logs para mostrar os dados do curso
  useEffect(() => {
    console.log('Dados do curso recebidos no modal:', curso);
    console.log('ID do curso extraído:', curso?.id_curso);
  }, [curso]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validação básica
    if (!nome.trim()) {
      setError('Por favor, insira um nome para o tópico');
      return;
    }
    
    // Obter id_curso diretamente do objeto curso
    const id_curso = curso?.id_curso;
    
    if (!id_curso) {
      setError('ID do curso não fornecido');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      
      console.log('Enviando requisição para criar tópico:', {
        nome,
        descricao,
        id_curso
      });
      
      // Criar tópico com os campos corretos
      await axios.post(`${API_BASE}/topicos-curso`, {
        nome,
        descricao,
        id_curso
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Sucesso
      setLoading(false);
      onSuccess();
    } catch (error) {
      console.error('Erro ao criar tópico:', error);
      setError(error.response?.data?.message || 'Não foi possível criar o tópico. Tente novamente.');
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay criar-topico-modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h3>Criar Novo Tópico</h3>
          <button className="btn-fechar" onClick={onClose}>×</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nome do Tópico:</label>
            <input 
              type="text" 
              value={nome} 
              onChange={(e) => setNome(e.target.value)}
              placeholder="Insira um nome descritivo"
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
          
          {curso && (
            <div className="form-group">
              <label>Curso:</label>
              <input type="text" value={curso.nome || ''} disabled />
              <input type="hidden" value={curso.id_curso || ''} />
            </div>
          )}
          
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
              disabled={loading || !curso?.id_curso}
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