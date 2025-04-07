import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './css/quizPage.css';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

const QuizPage = () => {
  const { id } = useParams(); // ID do quiz
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [respostas, setRespostas] = useState({});
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [tempoRestante, setTempoRestante] = useState(null);
  const [quizIniciado, setQuizIniciado] = useState(false);

  useEffect(() => {
    const fetchQuizDetails = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`/api/quizzes/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setQuiz(response.data);
        
        // Inicializar objeto de respostas
        const respostasIniciais = {};
        response.data.perguntas.forEach(pergunta => {
          if (pergunta.tipo === 'multipla_escolha') {
            respostasIniciais[pergunta.id] = null;
          } else if (pergunta.tipo === 'multipla_resposta') {
            respostasIniciais[pergunta.id] = [];
          } else if (pergunta.tipo === 'texto_livre') {
            respostasIniciais[pergunta.id] = '';
          }
        });
        
        setRespostas(respostasIniciais);
        setLoading(false);
      } catch (error) {
        console.error('Erro ao carregar quiz:', error);
        setLoading(false);
      }
    };

    fetchQuizDetails();
  }, [id]);

  useEffect(() => {
    // Configurar temporizador quando o quiz for iniciado
    if (quizIniciado && quiz && quiz.tempoLimite) {
      setTempoRestante(quiz.tempoLimite * 60); // Converter para segundos
      
      const timer = setInterval(() => {
        setTempoRestante(prevTempo => {
          if (prevTempo <= 1) {
            clearInterval(timer);
            handleSubmitQuiz();
            return 0;
          }
          return prevTempo - 1;
        });
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [quizIniciado, quiz]);

  const handleRespostaChange = (perguntaId, valor, tipo) => {
    if (tipo === 'multipla_escolha') {
      setRespostas({
        ...respostas,
        [perguntaId]: valor
      });
    } else if (tipo === 'multipla_resposta') {
      const respostasAtuais = respostas[perguntaId] || [];
      
      if (respostasAtuais.includes(valor)) {
        // Remover se já estiver selecionado
        setRespostas({
          ...respostas,
          [perguntaId]: respostasAtuais.filter(r => r !== valor)
        });
      } else {
        // Adicionar se não estiver selecionado
        setRespostas({
          ...respostas,
          [perguntaId]: [...respostasAtuais, valor]
        });
      }
    } else if (tipo === 'texto_livre') {
      setRespostas({
        ...respostas,
        [perguntaId]: valor
      });
    }
  };

  const iniciarQuiz = () => {
    setQuizIniciado(true);
  };

  const handleSubmitQuiz = async () => {
    if (enviando) return;
    
    setEnviando(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`/api/quizzes/${id}/submeter`, 
        { respostas },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setResultado(response.data);
      setEnviando(false);
    } catch (error) {
      console.error('Erro ao submeter quiz:', error);
      alert('Erro ao submeter suas respostas. Por favor, tente novamente.');
      setEnviando(false);
    }
  };

  const formatarTempo = (segundos) => {
    const minutos = Math.floor(segundos / 60);
    const segs = segundos % 60;
    return `${minutos.toString().padStart(2, '0')}:${segs.toString().padStart(2, '0')}`;
  };

  const voltarAoCurso = () => {
    // Navegar de volta para a página do curso
    if (quiz && quiz.cursoId) {
      navigate(`/cursos/${quiz.cursoId}`);
    } else {
      navigate('/cursos');
    }
  };

  if (loading) {
    return <div className="loading">Carregando quiz...</div>;
  }

  if (!quiz) {
    return <div className="error">Quiz não encontrado</div>;
  }

  if (resultado) {
    return (
      <div className="quiz-page-container">
        <Navbar />
        <div className="main-content">
          <Sidebar />
          <div className="quiz-result-content">
            <h1>Resultado do Quiz</h1>
            
            <div className="quiz-resultado">
              <div className="resultado-header">
                <h2>{quiz.titulo}</h2>
                <p className="nota">
                  Sua nota: <span className="valor">{resultado.nota.toFixed(1)}/10</span>
                </p>
              </div>
              
              <div className="resultado-stats">
                <div className="stat">
                  <span className="label">Acertos:</span>
                  <span className="valor">{resultado.acertos}/{quiz.perguntas.length}</span>
                </div>
                
                <div className="stat">
                  <span className="label">Tempo utilizado:</span>
                  <span className="valor">{resultado.tempoUtilizado}</span>
                </div>
              </div>
              
              {resultado.feedback && (
                <div className="feedback">
                  <h3>Feedback</h3>
                  <p>{resultado.feedback}</p>
                </div>
              )}
              
              <div className="respostas-revisao">
                <h3>Revisão das Perguntas</h3>
                
                {quiz.perguntas.map((pergunta, index) => (
                  <div 
                    key={pergunta.id} 
                    className={`pergunta-revisao ${
                      resultado.perguntasCorretas.includes(pergunta.id) 
                        ? 'correta' 
                        : 'incorreta'
                    }`}
                  >
                    <div className="pergunta-header">
                      <span className="numero">Pergunta {index + 1}</span>
                      <span className={`status ${
                        resultado.perguntasCorretas.includes(pergunta.id) 
                          ? 'correto' 
                          : 'incorreto'
                      }`}>
                        {resultado.perguntasCorretas.includes(pergunta.id) 
                          ? 'Correto' 
                          : 'Incorreto'
                        }
                      </span>
                    </div>
                    
                    <p className="pergunta-texto">{pergunta.texto}</p>
                    
                    {pergunta.tipo === 'multipla_escolha' && (
                      <div className="opcoes-revisao">
                        {pergunta.opcoes.map((opcao, i) => (
                          <div 
                            key={i} 
                            className={`opcao ${
                              respostas[pergunta.id] === i ? 'selecionada' : ''
                            } ${
                              pergunta.respostaCorreta === i ? 'correta' : ''
                            }`}
                          >
                            {opcao}
                            {respostas[pergunta.id] === i && 
                              pergunta.respostaCorreta !== i && (
                                <span className="marcador incorreto">✗</span>
                              )
                            }
                            {pergunta.respostaCorreta === i && (
                              <span className="marcador correto">✓</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {pergunta.tipo === 'multipla_resposta' && (
                      <div className="opcoes-revisao">
                        {pergunta.opcoes.map((opcao, i) => (
                          <div 
                            key={i} 
                            className={`opcao ${
                              respostas[pergunta.id]?.includes(i) ? 'selecionada' : ''
                            } ${
                              pergunta.respostasCorretas?.includes(i) ? 'correta' : ''
                            }`}
                          >
                            {opcao}
                            {respostas[pergunta.id]?.includes(i) && 
                              !pergunta.respostasCorretas?.includes(i) && (
                                <span className="marcador incorreto">✗</span>
                              )
                            }
                            {pergunta.respostasCorretas?.includes(i) && (
                              <span className="marcador correto">✓</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {pergunta.tipo === 'texto_livre' && (
                      <div className="texto-livre-revisao">
                        <p className="sua-resposta">
                          <strong>Sua resposta:</strong> {respostas[pergunta.id]}
                        </p>
                        <p className="resposta-esperada">
                          <strong>Resposta esperada:</strong> {pergunta.respostaCorreta}
                        </p>
                      </div>
                    )}
                    
                    {pergunta.explicacao && (
                      <div className="explicacao">
                        <h4>Explicação:</h4>
                        <p>{pergunta.explicacao}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              <button className="voltar-btn" onClick={voltarAoCurso}>
                Voltar ao Curso
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="quiz-page-container">
      <Navbar />
      <div className="main-content">
        <Sidebar />
        <div className="quiz-content">
          {!quizIniciado ? (
            <div className="quiz-intro">
              <h1>{quiz.titulo}</h1>
              
              <div className="quiz-info">
                <p className="descricao">{quiz.descricao}</p>
                
                <div className="quiz-meta">
                  <div className="meta-item">
                    <span className="label">Total de perguntas:</span>
                    <span>{quiz.perguntas.length}</span>
                  </div>
                  
                  {quiz.tempoLimite && (
                    <div className="meta-item">
                      <span className="label">Tempo limite:</span>
                      <span>{quiz.tempoLimite} minutos</span>
                    </div>
                  )}
                  
                  <div className="meta-item">
                    <span className="label">Tentativas permitidas:</span>
                    <span>{quiz.tentativasPermitidas || 'Ilimitadas'}</span>
                  </div>
                </div>
                
                <div className="instrucoes">
                  <h3>Instruções</h3>
                  <ul>
                    <li>Leia atentamente cada pergunta antes de responder.</li>
                    <li>Responda todas as perguntas antes de enviar.</li>
                    {quiz.tempoLimite && (
                      <li>Você terá {quiz.tempoLimite} minutos para completar o quiz.</li>
                    )}
                    <li>Clique em "Iniciar Quiz" quando estiver pronto para começar.</li>
                  </ul>
                </div>
                
                <button className="iniciar-btn" onClick={iniciarQuiz}>
                  Iniciar Quiz
                </button>
              </div>
            </div>
          ) : (
            <div className="quiz-perguntas">
              <div className="quiz-header">
                <h1>{quiz.titulo}</h1>
                
                {tempoRestante !== null && (
                  <div className="tempo-container">
                    <span className="tempo-label">Tempo restante:</span>
                    <span className={`tempo-valor ${tempoRestante < 60 ? 'acabando' : ''}`}>
                      {formatarTempo(tempoRestante)}
                    </span>
                  </div>
                )}
              </div>
              
              <form className="perguntas-form" onSubmit={(e) => {
                e.preventDefault();
                handleSubmitQuiz();
              }}>
                {quiz.perguntas.map((pergunta, index) => (
                  <div key={pergunta.id} className="pergunta-container">
                    <div className="pergunta-header">
                      <h3>Pergunta {index + 1}</h3>
                      {pergunta.pontos && (
                        <span className="pontos">{pergunta.pontos} pontos</span>
                      )}
                    </div>
                    
                    <p className="pergunta-texto">{pergunta.texto}</p>
                    
                    {pergunta.tipo === 'multipla_escolha' && (
                      <div className="opcoes">
                        {pergunta.opcoes.map((opcao, i) => (
                          <div key={i} className="opcao">
                            <input 
                              type="radio" 
                              id={`pergunta_${pergunta.id}_opcao_${i}`}
                              name={`pergunta_${pergunta.id}`}
                              checked={respostas[pergunta.id] === i}
                              onChange={() => handleRespostaChange(pergunta.id, i, 'multipla_escolha')}
                            />
                            <label htmlFor={`pergunta_${pergunta.id}_opcao_${i}`}>
                              {opcao}
                            </label>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {pergunta.tipo === 'multipla_resposta' && (
                      <div className="opcoes">
                        {pergunta.opcoes.map((opcao, i) => (
                          <div key={i} className="opcao">
                            <input 
                              type="checkbox" 
                              id={`pergunta_${pergunta.id}_opcao_${i}`}
                              checked={respostas[pergunta.id]?.includes(i) || false}
                              onChange={() => handleRespostaChange(pergunta.id, i, 'multipla_resposta')}
                            />
                            <label htmlFor={`pergunta_${pergunta.id}_opcao_${i}`}>
                              {opcao}
                            </label>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {pergunta.tipo === 'texto_livre' && (
                      <div className="texto-livre">
                        <textarea 
                          rows="4"
                          value={respostas[pergunta.id] || ''}
                          onChange={(e) => handleRespostaChange(
                            pergunta.id, 
                            e.target.value, 
                            'texto_livre'
                          )}
                          placeholder="Digite sua resposta aqui..."
                        />
                      </div>
                    )}
                  </div>
                ))}
                
                <div className="form-actions">
                  <button 
                    type="submit" 
                    className="enviar-btn"
                    disabled={enviando}
                  >
                    {enviando ? 'Enviando...' : 'Finalizar Quiz'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizPage;