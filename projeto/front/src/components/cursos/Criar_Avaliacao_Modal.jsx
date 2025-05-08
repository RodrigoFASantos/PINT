import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './css/Criar_Conteudo_Modal.css';

const CriarConteudoModal = ({ curso, aluno, onClose, onSuccess }) => {
  const [nota, setNota] = useState('');
  const [feedback, setFeedback] = useState('');
  const [horasPresenca, setHorasPresenca] = useState('');
  const [avaliacaoAtual, setAvaliacaoAtual] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    const fetchAvaliacaoAtual = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`/api/cursos/${curso.id}/alunos/${aluno.id}/avaliacao`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data) {
          setAvaliacaoAtual(response.data);
          setNota(response.data.nota || '');
          setFeedback(response.data.feedback || '');
          setHorasPresenca(response.data.horasPresenca || '');
        }
        
        setCarregando(false);
      } catch (error) {
        console.error('Erro ao carregar avaliação:', error);
        setCarregando(false);
      }
    };

    fetchAvaliacaoAtual();
  }, [curso.id, aluno.id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (nota === '' || isNaN(Number(nota)) || Number(nota) < 0 || Number(nota) > 20) {
      setErro('A nota deve ser um número entre 0 e 20.');
      return;
    }
    
    if (horasPresenca === '' || isNaN(Number(horasPresenca)) || Number(horasPresenca) < 0 || Number(horasPresenca) > curso.horasCurso) {
      setErro(`As horas de presença devem ser um número entre 0 e ${curso.horasCurso}.`);
      return;
    }
    
    setEnviando(true);
    setErro('');
    
    try {
      const token = localStorage.getItem('token');
      await axios.post(`/api/cursos/${curso.id}/alunos/${aluno.id}/avaliacao`, 
        { 
          nota: Number(nota),
          feedback,
          horasPresenca: Number(horasPresenca)
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      onSuccess();
    } catch (error) {
      console.error('Erro ao submeter avaliação:', error);
      setErro(error.response?.data?.message || 'Erro ao submeter avaliação. Tente novamente.');
      setEnviando(false);
    }
  };

  if (carregando) {
    return (
      <div className="avaliacao-overlay">
        <div className="avaliacao-modal loading">
          <p>Carregando dados da avaliação...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="avaliacao-overlay">
      <div className="avaliacao-modal">
        <button className="close-btn" onClick={onClose}>×</button>
        
        <h2>{avaliacaoAtual ? 'Editar Avaliação' : 'Nova Avaliação'}</h2>
        
        <div className="info-section">
          <div className="curso-info">
            <h3>Curso</h3>
            <p>{curso.titulo}</p>
          </div>
          
          <div className="aluno-info">
            <h3>Aluno</h3>
            <p>{aluno.nome}</p>
            <p className="aluno-email">{aluno.email}</p>
          </div>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="nota">Nota Final (0-20):</label>
            <input
              type="number"
              id="nota"
              min="0"
              max="20"
              step="0.1"
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="horasPresenca">Horas de Presença (max: {curso.horasCurso}):</label>
            <input
              type="number"
              id="horasPresenca"
              min="0"
              max={curso.horasCurso}
              step="0.5"
              value={horasPresenca}
              onChange={(e) => setHorasPresenca(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="feedback">Feedback:</label>
            <textarea
              id="feedback"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows="4"
              placeholder="Forneça um feedback sobre o desempenho do aluno..."
            />
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
              {enviando ? 'Salvando...' : 'Salvar Avaliação'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CriarConteudoModal;