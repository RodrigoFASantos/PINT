import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './css/areaProfessor.css';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import AdicionarConteudoModal from '../components/AdicionarConteudoModal';
import AvaliacaoModal from '../components/AvaliacaoModal';

const AreaProfessor = () => {
  const navigate = useNavigate();
  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddConteudo, setShowAddConteudo] = useState(false);
  const [showAvaliacao, setShowAvaliacao] = useState(false);
  const [cursoSelecionado, setCursoSelecionado] = useState(null);
  const [alunoSelecionado, setAlunoSelecionado] = useState(null);

  useEffect(() => {
    const fetchCursosFormador = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('/api/formador/cursos', {
          headers: { Authorization: `Bearer ${token}` }
        });

        setCursos(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Erro ao carregar cursos do formador:', error);
        setLoading(false);
      }
    };

    fetchCursosFormador();
  }, []);

  const handleGerirConteudo = (curso) => {
    setCursoSelecionado(curso);
    setShowAddConteudo(true);
  };

  const handleAvaliarAluno = (curso, aluno) => {
    setCursoSelecionado(curso);
    setAlunoSelecionado(aluno);
    setShowAvaliacao(true);
  };

  const handleVerCurso = (id) => {
    navigate(`/cursos/${id}`);
  };

  // Verificar se o curso está "Em curso" ou "Terminado"
  const verificarStatusCurso = (curso) => {
    const hoje = new Date();
    const dataInicio = new Date(curso.dataInicio);
    const dataFim = new Date(curso.dataFim);

    if (hoje >= dataInicio && hoje <= dataFim) {
      return "Em curso";
    } else if (hoje > dataFim) {
      return "Terminado";
    } else {
      return "Agendado";
    }
  };

  if (loading) {
    return <div className="loading">Carregando seus cursos...</div>;
  }

  return (
    <div className="area-professor-container">
      <Navbar />
      <div className="main-content">
        <Sidebar />
        <div className="professor-content">
          <h1>Meus Cursos</h1>

          {cursos.length === 0 ? (
            <p className="no-cursos">Você não possui cursos atribuídos no momento.</p>
          ) : (
            <div className="cursos-list">
              {cursos.map(curso => {
                const status = verificarStatusCurso(curso);
                
                return (
                  <div key={curso.id} className="curso-panel">
                    <div className="curso-header">
                      <div>
                        <h2>{curso.titulo}</h2>
                        <p className="categoria">{curso.categoria} &gt; {curso.area}</p>
                      </div>
                      <span className={`status-badge ${status.toLowerCase().replace(' ', '-')}`}>
                        {status}
                      </span>
                    </div>
                    
                    <div className="curso-meta">
                      <div className="meta-item">
                        <span className="label">Início:</span>
                        <span>{new Date(curso.dataInicio).toLocaleDateString()}</span>
                      </div>
                      <div className="meta-item">
                        <span className="label">Término:</span>
                        <span>{new Date(curso.dataFim).toLocaleDateString()}</span>
                      </div>
                      <div className="meta-item">
                        <span className="label">Alunos:</span>
                        <span>{curso.formandos ? curso.formandos.length : 0} / {curso.vagasTotal}</span>
                      </div>
                    </div>
                    
                    <div className="curso-actions">
                      <button 
                        className="ver-curso-btn"
                        onClick={() => handleVerCurso(curso.id)}
                      >
                        Ver Detalhes
                      </button>
                      
                      <button 
                        className="conteudo-btn"
                        onClick={() => handleGerirConteudo(curso)}
                      >
                        Gerenciar Conteúdo
                      </button>
                    </div>
                    
                    {curso.formandos && curso.formandos.length > 0 && (
                      <div className="formandos-section">
                        <h3>Alunos Inscritos</h3>
                        <div className="formandos-list">
                          {curso.formandos.map(aluno => (
                            <div key={aluno.id} className="aluno-card">
                              <div className="aluno-info">
                                <p className="aluno-nome">{aluno.nome}</p>
                                <p className="aluno-email">{aluno.email}</p>
                              </div>
                              
                              {(status === "Em curso" || status === "Terminado") && (
                                <button 
                                  className="avaliar-btn"
                                  onClick={() => handleAvaliarAluno(curso, aluno)}
                                >
                                  {aluno.avaliado ? "Editar Avaliação" : "Avaliar"}
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      
      {showAddConteudo && cursoSelecionado && (
        <AdicionarConteudoModal 
          curso={cursoSelecionado} 
          onClose={() => setShowAddConteudo(false)}
          onSuccess={() => {
            setShowAddConteudo(false);
            // Atualizar lista de cursos
            const fetchCursosFormador = async () => {
              try {
                const token = localStorage.getItem('token');
                const response = await axios.get('/api/formador/cursos', {
                  headers: { Authorization: `Bearer ${token}` }
                });
                setCursos(response.data);
              } catch (error) {
                console.error('Erro ao atualizar cursos:', error);
              }
            };
            fetchCursosFormador();
          }}
        />
      )}
      
      {showAvaliacao && cursoSelecionado && alunoSelecionado && (
        <AvaliacaoModal 
          curso={cursoSelecionado}
          aluno={alunoSelecionado}
          onClose={() => setShowAvaliacao(false)}
          onSuccess={() => {
            setShowAvaliacao(false);
            // Atualizar lista de cursos
            const fetchCursosFormador = async () => {
              try {
                const token = localStorage.getItem('token');
                const response = await axios.get('/api/formador/cursos', {
                  headers: { Authorization: `Bearer ${token}` }
                });
                setCursos(response.data);
              } catch (error) {
                console.error('Erro ao atualizar cursos:', error);
              }
            };
            fetchCursosFormador();
          }}
        />
      )}
    </div>
  );
};

export default AreaProfessor;