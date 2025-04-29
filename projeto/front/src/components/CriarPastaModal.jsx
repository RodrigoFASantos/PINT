import React, { useState } from 'react';
import axios from 'axios';
import './css/CriarPastaModal.css';
import API_BASE from '../api';

const CriarPastaModal = ({ topico, onClose, onSuccess }) => {
  const [nome, setNome] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!nome.trim()) {
      setErro('O nome da pasta é obrigatório.');
      return;
    }
    
    setEnviando(true);
    setErro('');
    
    try {
      const token = localStorage.getItem('token');
      
      const dadosEnvio = {
        nome: nome.trim(),
        id_topico: topico.id_topico,
        ordem: topico.pastas?.length + 1 || 1
      };
      
      const response = await axios.post(`${API_BASE}/pastas-curso`, dadosEnvio, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Resposta da API:', response.data);
      onSuccess(response.data.data);
      onClose();
    } catch (error) {
      console.error('Erro ao criar pasta:', error);
      setErro(error.response?.data?.message || 'Erro ao criar pasta. Tente novamente.');
      setEnviando(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="criar-pasta-modal">
        <div className="modal-header">
          <h2>Criar Nova Pasta</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <div className="topico-info">
            <span>Tópico:</span> {topico.nome}
          </div>
          
          {erro && <div className="error-message">{erro}</div>}
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="nome">Nome da Pasta</label>
              <input
                type="text"
                id="nome"
                name="nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Materiais de Estudo"
                required
                disabled={enviando}
              />
            </div>
            
            <div className="modal-footer">
              <button 
                type="button" 
                className="cancel-btn"
                onClick={onClose}
                disabled={enviando}
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                className="submit-btn"
                disabled={enviando}
              >
                {enviando ? 'Criando...' : 'Criar Pasta'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CriarPastaModal;