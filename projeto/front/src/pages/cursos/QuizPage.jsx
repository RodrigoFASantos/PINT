import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './css/quizPage.css';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import API_BASE from '../../api';

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
  const [idResposta, setIdResposta] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  useEffect(() => {
    const fetchQuizDetails = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_BASE}/quiz/${id}?formato=quiz`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        //  Verificar se a resposta tem a estrutura correta
        let quizData = response.data;
        if (response.data && response.data.data) {
          quizData = response.data.data;
        }
        
        setQuiz(quizData);
        
        //  Verificar se perguntas existe antes de tentar iterar
        if (quizData && quizData.perguntas && Array.isArray(quizData.perguntas)) {
          // Inicializar objeto de respostas
          const respostasIniciais = {};
          quizData.perguntas.forEach(pergunta => {
            //  Todas as perguntas agora permitem múltiplas respostas
            respostasIniciais[pergunta.id] = [];
          });
          
          setRespostas(respostasIniciais);
        }
        
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
    if (quizIniciado && quiz && quiz.tempo_limite) {
      setTempoRestante(quiz.tempo_limite * 60); // Converter para segundos
      
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

  //  Nova função para lidar com múltiplas seleções
  const handleRespostaChange = (perguntaId, opcaoIndex, checked) => {
    setRespostas(prevRespostas => {
      const respostasAtuais = prevRespostas[perguntaId] || [];
      
      if (checked) {
        // Adicionar se não estiver selecionado
        if (!respostasAtuais.includes(opcaoIndex)) {
          return {
            ...prevRespostas,
            [perguntaId]: [...respostasAtuais, opcaoIndex]
          };
        }
      } else {
        // Remover se estiver selecionado
        return {
          ...prevRespostas,
          [perguntaId]: respostasAtuais.filter(r => r !== opcaoIndex)
        };
      }
      
      return prevRespostas;
    });
  };

  const iniciarQuiz = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_BASE}/quiz/${id}/iniciar`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      //  Verificar estrutura da resposta
      let responseData = response.data;
      if (response.data && response.data.data) {
        responseData = response.data.data;
      }
      
      setIdResposta(responseData.id_resposta);
      setQuizIniciado(true);
      
      if (responseData.tempo_limite) {
        setTempoRestante(responseData.tempo_limite * 60);
      }
    } catch (error) {
      console.error('Erro ao iniciar quiz:', error);
      alert('Erro ao iniciar quiz: ' + (error.response?.data?.message || 'Erro desconhecido'));
    }
  };

  const handleSubmitQuiz = async () => {
    if (enviando) return;
    
    setEnviando(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_BASE}/quiz/${id}/submeter`, 
        { respostas },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      //  Verificar estrutura da resposta
      let resultadoData = response.data;
      if (response.data && response.data.data) {
        resultadoData = response.data.data;
      }
      
      setResultado(resultadoData);
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
    if (quiz && quiz.curso && quiz.curso.id_curso) {
      navigate(`/cursos/${quiz.curso.id_curso}`);
    } else {
      navigate('/cursos');
    }
  };

  if (loading) {
    return (
      <div className="quiz-page-container">
        <Navbar />
        <div className="main-content">
          <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
          <div className="loading">A carregar quiz...</div>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="quiz-page-container">
        <Navbar />
        <div className="main-content">
          <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
          <div className="error">Quiz não encontrado</div>
        </div>
      </div>
    );
  }

  if (resultado) {
    return (
      <div className="quiz-page-container">
        <Navbar />
        <div className="main-content">
          <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
          <div className="quiz-result-content">
            <h1>Resultado do Quiz</h1>
            
            <div className="quiz-resultado">
              <div className="resultado-header">
                <h2>{quiz.titulo}</h2>
                <p className="nota">
                  Sua nota: <span className="valor">{resultado.nota}/10</span>
                  {resultado.nota_descricao && <span className="nota-info">{resultado.nota_descricao}</span>}
                </p>
              </div>
              
              <div className="resultado-stats">
                <div className="stat">
                  <span className="label">Pontos:</span>
                  <span className="valor">
                    {resultado.pontos_obtidos}/{resultado.pontos_totais}
                  </span>
                </div>
                
                <div className="stat">
                  <span className="label">Percentagem:</span>
                  <span className="valor">{resultado.percentagem}%</span>
                </div>
                
                {quiz.tempo_limite && (
                  <div className="stat">
                    <span className="label">Tempo limite:</span>
                    <span className="valor">{quiz.tempo_limite} minutos</span>
                  </div>
                )}
              </div>
              
              <div className="resultado-feedback">
                <h3>Avaliação</h3>
                {resultado.percentagem >= 70 ? (
                  <div className="feedback-positivo">
                    <i className="fas fa-check-circle"></i>
                    <p>Parabéns! Obteve uma classificação satisfatória.</p>
                  </div>
                ) : (
                  <div className="feedback-negativo">
                    <i className="fas fa-times-circle"></i>
                    <p>Precisa melhorar. Estude mais os conteúdos do curso.</p>
                  </div>
                )}
              </div>
              
              <div className="respostas-revisao">
                <h3>Revisão das Perguntas</h3>
                
                {quiz.perguntas && quiz.perguntas.map((pergunta, index) => {
                  const respostaUtilizador = respostas[pergunta.id] || [];
                  const respostasCorretas = pergunta.respostaCorreta || [];
                  
                  // Calcular quantas corretas foram selecionadas
                  const corretasSelecionadas = respostaUtilizador.filter(r => respostasCorretas.includes(r));
                  const pontosPergunta = pergunta.pontos || 4;
                  const pontosObtidos = respostasCorretas.length > 0 ? 
                    (corretasSelecionadas.length / respostasCorretas.length) * pontosPergunta : 0;
                  
                  return (
                    <div 
                      key={pergunta.id} 
                      className={`pergunta-revisao ${pontosObtidos === pontosPergunta ? 'correta' : pontosObtidos > 0 ? 'parcial' : 'incorreta'}`}
                    >
                      <div className="pergunta-header">
                        <span className="numero">Pergunta {index + 1}</span>
                        <span className={`status ${pontosObtidos === pontosPergunta ? 'correto' : pontosObtidos > 0 ? 'parcial' : 'incorreto'}`}>
                          {pontosObtidos === pontosPergunta ? 'Totalmente Correto' : 
                           pontosObtidos > 0 ? 'Parcialmente Correto' : 'Incorreto'}
                        </span>
                        <span className="pontos-obtidos">{pontosObtidos.toFixed(1)}/{pontosPergunta} pontos</span>
                      </div>
                      
                      <p className="pergunta-texto">{pergunta.texto}</p>
                      
                      <div className="opcoes-revisao">
                        {pergunta.opcoes.map((opcao, i) => (
                          <div 
                            key={i} 
                            className={`opcao ${
                              respostaUtilizador.includes(i) ? 'selecionada' : ''
                            } ${
                              respostasCorretas.includes(i) ? 'correta' : ''
                            }`}
                          >
                            {opcao}
                            {respostaUtilizador.includes(i) && 
                              !respostasCorretas.includes(i) && (
                                <span className="marcador incorreto">✗</span>
                              )
                            }
                            {respostasCorretas.includes(i) && (
                              <span className="marcador correto">✓</span>
                            )}
                          </div>
                        ))}
                      </div>
                      
                      {pergunta.explicacao && (
                        <div className="explicacao">
                          <h4>Explicação:</h4>
                          <p>{pergunta.explicacao}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
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
        <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        <div className="quiz-content">
          {!quizIniciado ? (
            <div className="quiz-intro">
              <h1>{quiz.titulo}</h1>
              
              <div className="quiz-info">
                {quiz.descricao && <p className="descricao">{quiz.descricao}</p>}
                
                <div className="quiz-meta">
                  <div className="meta-item">
                    <span className="label">Total de perguntas:</span>
                    <span>{quiz.perguntas ? quiz.perguntas.length : 0}</span>
                  </div>
                  
                  {quiz.tempo_limite && (
                    <div className="meta-item">
                      <span className="label">Tempo limite:</span>
                      <span>{quiz.tempo_limite} minutos</span>
                    </div>
                  )}
                  
                  <div className="meta-item">
                    <span className="label">Curso:</span>
                    <span>{quiz.curso?.nome || 'Curso não especificado'}</span>
                  </div>
                </div>
                
                <div className="instrucoes">
                  <h3>Instruções</h3>
                  <ul>
                    <li>Leia atentamente cada pergunta antes de responder.</li>
                    <li><strong>Pode selecionar múltiplas respostas para cada pergunta.</strong></li>
                    <li>Responda todas as perguntas antes de enviar.</li>
                    {quiz.tempo_limite && (
                      <li>Você terá {quiz.tempo_limite} minutos para completar o quiz.</li>
                    )}
                    <li>Clique em "Iniciar Quiz" quando estiver pronto para começar.</li>
                    <li>Após iniciar, não será possível pausar o quiz.</li>
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
                {quiz.perguntas && quiz.perguntas.map((pergunta, index) => (
                  <div key={pergunta.id} className="pergunta-container">
                    <div className="pergunta-header">
                      <h3>Pergunta {index + 1}</h3>
                      <span className="pontos">{pergunta.pontos || 4} pontos</span>
                      <small className="multipla-info">Pode selecionar múltiplas respostas</small>
                    </div>
                    
                    <p className="pergunta-texto">{pergunta.texto}</p>
                    
                    {/*  Usar sempre checkboxes para permitir múltiplas seleções */}
                    <div className="opcoes">
                      {pergunta.opcoes.map((opcao, i) => (
                        <div key={i} className="opcao">
                          <input 
                            type="checkbox" 
                            id={`pergunta_${pergunta.id}_opcao_${i}`}
                            checked={respostas[pergunta.id]?.includes(i) || false}
                            onChange={(e) => handleRespostaChange(pergunta.id, i, e.target.checked)}
                          />
                          <label htmlFor={`pergunta_${pergunta.id}_opcao_${i}`}>
                            {opcao}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                
                <div className="form-actions">
                  <button 
                    type="submit" 
                    className="enviar-btn"
                    disabled={enviando}
                  >
                    {enviando ? 'A enviar...' : 'Finalizar Quiz'}
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