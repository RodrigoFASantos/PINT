import React, { useState } from 'react';
import { inscricoesService } from '../../src/services/api';
import './css/FormularioInscricao.css';

const FormularioInscricao = ({ cursoId, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    motivacao: '',
    expectativas: '',
    termos: false
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.termos) {
      setError('Você deve aceitar os termos e condições para prosseguir.');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Usar o serviço de inscrições para processar a inscrição
      await inscricoesService.inscreverCurso(cursoId, {
        motivacao: formData.motivacao,
        expectativas: formData.expectativas
      });
      
      // Chamar o callback de sucesso
      onSuccess();
    } catch (error) {
      console.error('Erro ao processar inscrição:', error);
      setError(error.message || 'Erro ao processar sua inscrição. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };
  

  return (
    <div className="formulario-inscricao-overlay">
      <div className="formulario-inscricao-container">
        <div className="formulario-header">
          <h2>Inscrição no Curso</h2>
          <button onClick={onClose} className="close-btn">
            &times;
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="formulario-content">
          <div className="form-group">
            <label htmlFor="motivacao">Qual sua motivação para realizar este curso?</label>
            <textarea
              id="motivacao"
              name="motivacao"
              value={formData.motivacao}
              onChange={handleChange}
              rows="3"
              placeholder="Descreva sua motivação..."
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="expectativas">Quais suas expectativas para este curso?</label>
            <textarea
              id="expectativas"
              name="expectativas"
              value={formData.expectativas}
              onChange={handleChange}
              rows="3"
              placeholder="Descreva suas expectativas..."
            />
          </div>
          
          <div className="form-group checkbox-group">
            <input
              type="checkbox"
              id="termos"
              name="termos"
              checked={formData.termos}
              onChange={handleChange}
            />
            <label htmlFor="termos">
              Concordo com os termos e condições do curso e confirmo minha disponibilidade para participar.
            </label>
          </div>
          
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-actions">
            <button type="button" onClick={onClose} className="cancel-btn">
              Cancelar
            </button>
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Processando...' : 'Confirmar Inscrição'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FormularioInscricao;