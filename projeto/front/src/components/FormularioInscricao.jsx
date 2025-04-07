import React, { useState } from 'react';
import axios from 'axios';
import './css/FormularioInscricao.css';

const FormularioInscricao = ({ cursoId, onClose, onSuccess }) => {
  const [motivacao, setMotivacao] = useState('');
  const [concordaTermos, setConcordaTermos] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!concordaTermos) {
      setErro('Você precisa concordar com os termos de inscrição.');
      return;
    }
    
    setEnviando(true);
    setErro('');
    
    try {
      const token = localStorage.getItem('token');
      await axios.post(`/api/cursos/${cursoId}/inscricao`, 
        { motivacao },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      onSuccess();
    } catch (error) {
      console.error('Erro ao realizar inscrição:', error);
      setErro(error.response?.data?.message || 'Erro ao realizar inscrição. Tente novamente.');
      setEnviando(false);
    }
  };

  return (
    <div className="formulario-inscricao-overlay">
      <div className="formulario-inscricao-modal">
        <button className="close-btn" onClick={onClose}>×</button>
        
        <h2>Inscrição no Curso</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="motivacao">Motivação para participar do curso:</label>
            <textarea
              id="motivacao"
              value={motivacao}
              onChange={(e) => setMotivacao(e.target.value)}
              rows="4"
              placeholder="Descreva brevemente sua motivação para participar deste curso..."
              required
            />
          </div>
          
          <div className="form-group checkbox">
            <input
              type="checkbox"
              id="termos"
              checked={concordaTermos}
              onChange={(e) => setConcordaTermos(e.target.checked)}
            />
            <label htmlFor="termos">
              Concordo com os termos de inscrição e me comprometo a participar ativamente do curso.
            </label>
          </div>
          
          {erro && <p className="erro-message">{erro}</p>}
          
          <div className="form-actions">
            <button 
              type="button" 
              className="cancelar-btn"
              onClick={onClose}
              disabled={enviando}
            >
              Cancelar
            </button>
            
            <button 
              type="submit" 
              className="confirmar-btn"
              disabled={enviando}
            >
              {enviando ? 'Inscrevendo...' : 'Confirmar Inscrição'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FormularioInscricao;