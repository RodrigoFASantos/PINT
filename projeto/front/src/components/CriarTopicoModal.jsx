import React, { useState } from 'react';
import axios from 'axios';
import './css/CriarTopicoModal.css';
import API_BASE from '../api';

const CriarTopicoModal = ({ curso, onClose, onSuccess }) => {
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
      
      // Usar o ID do curso
      const cursoId = curso.id_curso;
      
      console.log('Curso completo:', curso);
      console.log('Enviando request com ID do curso:', cursoId);
      
      const dadosEnvio = {
        nome: formData.titulo,
        id_curso: cursoId,
        descricao: formData.descricao,
        ordem: 1
      };
      
      console.log('Payload completo sendo enviado:', dadosEnvio);
      
      const response = await axios.post(`${API_BASE}/topicos-curso`, dadosEnvio, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Resposta da API:', response.data);
      
      // Chamar callback de sucesso e passar o novo tópico
      if (onSuccess) {
        onSuccess(response.data.topico);
      }
    } catch (error) {
      console.error('Erro ao criar tópico:', error);
      
      if (error.response) {
        console.error('Resposta de erro:', error.response.data);
        console.error('Status do erro:', error.response.status);
        
        let mensagemErro = error.response.data.message || 'Ocorreu um erro ao criar o tópico. Tente novamente.';
        
        // Mensagem específica para erro de permissão
        if (error.response.status === 403) {
          mensagemErro = 'Você não tem permissão para criar tópicos. Entre em contato com um administrador.';
        }
        
        setErro(mensagemErro);
      } else {
        setErro('Erro de conexão. Verifique sua internet e tente novamente.');
      }
      
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
            <span>Curso:</span> {curso.nome || "Novo Curso"}
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