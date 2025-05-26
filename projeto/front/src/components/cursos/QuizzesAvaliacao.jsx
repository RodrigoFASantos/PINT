import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import API_BASE from "../../api";
import CriarQuizModal from './Criar_Quiz_Modal';
import EditarQuizModal from './Editar_Quiz_Modal';
import "./css/QuizzesAvaliacao.css";

const QuizzesAvaliacao = ({ cursoId, userRole, inscrito, tipoCurso }) => {
  const navigate = useNavigate();
  
  // Estados para quizzes
  const [quizzes, setQuizzes] = useState([]);
  const [loadingQuizzes, setLoadingQuizzes] = useState(false);
  const [modalCriarQuiz, setModalCriarQuiz] = useState(false);
  const [modalEditarQuiz, setModalEditarQuiz] = useState(false);
  const [quizSelecionado, setQuizSelecionado] = useState(null);

  // Função para verificar se um quiz expirou
  const verificarExpiracaoQuiz = (quiz) => {
    if (!quiz.tempo_limite || !quiz.tempo_limite_inicio) {
      return false;
    }
    
    const agora = new Date();
    const inicioTempo = new Date(quiz.tempo_limite_inicio);
    const tempoLimiteMs = quiz.tempo_limite * 60 * 1000;
    const tempoExpiracao = new Date(inicioTempo.getTime() + tempoLimiteMs);
    
    return agora > tempoExpiracao;
  };

  // Função para obter tempo restante formatado
  const obterTempoRestante = (quiz) => {
    if (!quiz.tempo_limite || !quiz.tempo_limite_inicio) {
      return null;
    }
    
    const agora = new Date();
    const inicioTempo = new Date(quiz.tempo_limite_inicio);
    const tempoLimiteMs = quiz.tempo_limite * 60 * 1000;
    const tempoExpiracao = new Date(inicioTempo.getTime() + tempoLimiteMs);
    const tempoRestanteMs = tempoExpiracao.getTime() - agora.getTime();
    
    if (tempoRestanteMs <= 0) {
      return 'Expirado';
    }
    
    const horas = Math.floor(tempoRestanteMs / (1000 * 60 * 60));
    const minutos = Math.floor((tempoRestanteMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (horas > 0) {
      return `${horas}h ${minutos}min restantes`;
    } else {
      return `${minutos}min restantes`;
    }
  };

  // Função para determinar o estado do quiz
  const determinarEstadoQuiz = (quiz) => {
    if (quiz.resposta_utilizador && quiz.resposta_utilizador.completo) {
      return 'concluido';
    }
    
    if (verificarExpiracaoQuiz(quiz)) {
      return 'expirado';
    }
    
    return 'disponivel';
  };

  // Função para obter a classe CSS baseada no estado
  const obterClasseEstado = (estado) => {
    switch (estado) {
      case 'concluido':
        return 'qa-concluido';
      case 'expirado':
        return 'qa-expirado';
      case 'disponivel':
      default:
        return 'qa-disponivel';
    }
  };

  // Função para carregar quizzes
  const carregarQuizzes = async () => {
    try {
      setLoadingQuizzes(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        setQuizzes([]);
        return;
      }

      const url = `${API_BASE}/quiz?id_curso=${cursoId}`;
      
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      let quizzesData = [];
      if (response.data && response.data.success) {
        quizzesData = response.data.data || [];
      } else if (Array.isArray(response.data)) {
        quizzesData = response.data;
      } else if (response.data && Array.isArray(response.data.data)) {
        quizzesData = response.data.data;
      }

      const quizzesComEstado = quizzesData.map(quiz => ({
        ...quiz,
        estado: determinarEstadoQuiz(quiz),
        tempoRestante: obterTempoRestante(quiz)
      }));

      setQuizzes(quizzesComEstado);
      
    } catch (error) {
      console.error('Erro ao carregar quizzes:', error);
      setQuizzes([]);
    } finally {
      setLoadingQuizzes(false);
    }
  };

  // Carregar quizzes quando o componente montar
  useEffect(() => {
    if (tipoCurso === 'assincrono' && userRole !== 2 && cursoId) {
      carregarQuizzes();
    }
  }, [cursoId, tipoCurso, userRole]);

  // Atualizar estados dos quizzes periodicamente
  useEffect(() => {
    if (tipoCurso === 'assincrono' && userRole !== 2 && quizzes.length > 0) {
      const interval = setInterval(() => {
        setQuizzes(prevQuizzes => 
          prevQuizzes.map(quiz => ({
            ...quiz,
            estado: determinarEstadoQuiz(quiz),
            tempoRestante: obterTempoRestante(quiz)
          }))
        );
      }, 60000);

      return () => clearInterval(interval);
    }
  }, [quizzes.length, tipoCurso, userRole]);

  // Callbacks para quizzes
  const handleQuizCriado = (novoQuiz) => {
    const quizComEstado = {
      ...novoQuiz,
      estado: determinarEstadoQuiz(novoQuiz),
      tempoRestante: obterTempoRestante(novoQuiz)
    };
    setQuizzes(prevQuizzes => [quizComEstado, ...prevQuizzes]);
    setModalCriarQuiz(false);
  };

  const handleQuizEditado = (quizEditado) => {
    setQuizzes(prevQuizzes => 
      prevQuizzes.map(quiz => {
        if (quiz.id_quiz === quizEditado.id_quiz) {
          return {
            ...quizEditado,
            estado: determinarEstadoQuiz(quizEditado),
            tempoRestante: obterTempoRestante(quizEditado)
          };
        }
        return quiz;
      })
    );
    setModalEditarQuiz(false);
    setQuizSelecionado(null);
  };

  const handleEditarQuiz = (quiz, e) => {
    e.stopPropagation();
    setQuizSelecionado(quiz);
    setModalEditarQuiz(true);
  };

  const handleEliminarQuiz = async (quizId, e) => {
    e.stopPropagation();
    
    if (!window.confirm('Tem certeza que deseja eliminar este quiz? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_BASE}/quiz/${quizId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setQuizzes(prevQuizzes => prevQuizzes.filter(quiz => quiz.id_quiz !== quizId));
      alert('Quiz eliminado com sucesso!');
    } catch (error) {
      console.error('Erro ao eliminar quiz:', error);
      alert('Erro ao eliminar quiz');
    }
  };

  const handleFazerQuiz = (quiz) => {
    if (inscrito && quiz.estado === 'disponivel') {
      navigate(`/quiz/${quiz.id_quiz}`);
    }
  };

  // Função para renderizar a nota do utilizador
  const renderizarNota = (quiz) => {
    if (quiz.resposta_utilizador && quiz.resposta_utilizador.completo) {
      const nota = parseFloat(quiz.resposta_utilizador.nota) || 0;
      return (
        <div className="qa-nota">
          <span className="qa-nota-valor">{nota.toFixed(1)}</span>
          <span className="qa-nota-total">/10</span>
        </div>
      );
    }
    
    if (quiz.estado === 'expirado') {
      return (
        <div className="qa-nota qa-nota-zero">
          <span className="qa-nota-valor">0.0</span>
          <span className="qa-nota-total">/10</span>
        </div>
      );
    }
    
    return null;
  };

  // Função para renderizar o estado do quiz
  const renderizarEstado = (quiz) => {
    switch (quiz.estado) {
      case 'concluido':
        return (
          <div className="qa-estado qa-estado-concluido">
            <span>✓ Concluído</span>
            {quiz.resposta_utilizador?.data_conclusao && (
              <small>
                {new Date(quiz.resposta_utilizador.data_conclusao).toLocaleDateString('pt-PT')}
              </small>
            )}
          </div>
        );
      case 'expirado':
        return (
          <div className="qa-estado qa-estado-expirado">
            <span>⏰ Expirado</span>
            <small>Tempo esgotado</small>
          </div>
        );
      case 'disponivel':
      default:
        return (
          <div className="qa-estado qa-estado-disponivel">
            <span>📝 Disponível</span>
            {quiz.tempoRestante && quiz.tempoRestante !== 'Expirado' && (
              <small>{quiz.tempoRestante}</small>
            )}
          </div>
        );
    }
  };

  // Se não for curso assíncrono, não mostrar nada
  if (tipoCurso !== 'assincrono') {
    return null;
  }

  // Se o utilizador for formador (userRole === 2), mostrar apenas link para avaliações
  if (userRole === 2) {
    return (
      <div className="qa-section">
        <div className="qa-formador-info">
          <h3>Avaliação por Quizzes</h3>
          <p>Este curso utiliza quizzes para avaliação dos formandos.</p>
          
          <Link 
            to={`/curso/${cursoId}/avaliar-trabalhos`} 
            className="qa-link-avaliacoes"
          >
            <i className="fas fa-chart-bar"></i> Ver Avaliações dos Formandos
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="qa-section">
      {/* Apenas administradores podem criar quizzes */}
      {userRole === 1 && (
        <div className="qa-admin-actions">
          <button
            onClick={() => setModalCriarQuiz(true)}
            className="qa-criar-btn"
          >
            Criar Quiz
          </button>
          
          <Link 
            to={`/curso/${cursoId}/avaliar-trabalhos`} 
            className="qa-link-avaliacoes qa-link-admin"
          >
            <i className="fas fa-chart-bar"></i> Ver Avaliações
          </Link>
        </div>
      )}

      {/* Estados de loading, vazio ou lista */}
      {loadingQuizzes ? (
        <div className="qa-loading">
          <div className="qa-spinner"></div>
          <p>Carregando quizzes...</p>
        </div>
      ) : quizzes.length === 0 ? (
        <div className="qa-empty">
          <p>Nenhum quiz criado ainda.</p>
          {userRole === 1 && (
            <button
              onClick={() => setModalCriarQuiz(true)}
              className="qa-criar-primeiro-btn"
            >
              Criar Primeiro Quiz
            </button>
          )}
        </div>
      ) : (
        <div className="qa-lista">
          {quizzes.map((quiz) => (
            <div 
              key={quiz.id_quiz} 
              className={`qa-card ${quiz.ativo ? 'qa-ativo' : 'qa-inativo'} ${obterClasseEstado(quiz.estado)} ${
                inscrito && quiz.estado === 'disponivel' ? 'qa-clickable' : ''
              }`}
              onClick={() => handleFazerQuiz(quiz)}
            >
              <div className="qa-card-content">
                <div className="qa-info-left">
                  <h3 className="qa-titulo">{quiz.titulo}</h3>
                  {quiz.descricao && (
                    <p className="qa-descricao">{quiz.descricao}</p>
                  )}
                  
                  {renderizarEstado(quiz)}
                </div>
                
                <div className="qa-info-right">
                  <div className="qa-meta">
                    <span className="qa-perguntas">Perguntas: {quiz.perguntas?.length || 0}</span>
                    <span className="qa-tempo">
                      Tempo: {quiz.tempo_limite ? `${quiz.tempo_limite}min` : 'Sem limite'}
                    </span>
                  </div>
                  
                  {renderizarNota(quiz)}
                </div>
              </div>

              {/* Botões de ação apenas para administradores */}
              {userRole === 1 && (
                <div className="qa-acoes">
                  <button 
                    onClick={(e) => handleEditarQuiz(quiz, e)}
                    className="qa-btn-editar"
                    title="Editar quiz"
                  >
                    ✏️
                  </button>
                  <button 
                    onClick={(e) => handleEliminarQuiz(quiz.id_quiz, e)}
                    className="qa-btn-eliminar"
                    title="Eliminar quiz"
                  >
                    🗑️
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modais - apenas para administradores */}
      {userRole === 1 && (
        <>
          <CriarQuizModal
            isOpen={modalCriarQuiz}
            onClose={() => setModalCriarQuiz(false)}
            cursoId={cursoId}
            onSuccess={handleQuizCriado}
          />

          <EditarQuizModal
            isOpen={modalEditarQuiz}
            onClose={() => {
              setModalEditarQuiz(false);
              setQuizSelecionado(null);
            }}
            quizId={quizSelecionado?.id_quiz}
            onSuccess={handleQuizEditado}
          />
        </>
      )}
    </div>
  );
};

export default QuizzesAvaliacao;