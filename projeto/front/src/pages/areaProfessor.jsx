import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from 'axios';
import './css/areaProfessor.css';
import Sidebar from '../components/Sidebar';
import CriarConteudoModal from '../components/CriarConteudoModal';
import CriarAvaliacaoModal from '../components/CriarAvaliacaoModal';
import API_BASE from '../api';

export default function AreaProfessor() {
  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const cursosPerPage = 10;

  // Adicionar estado para controlar a sidebar
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const [showAddConteudo, setShowAddConteudo] = useState(false);
  const [showAvaliacao, setShowAvaliacao] = useState(false);
  const [cursoSelecionado, setCursoSelecionado] = useState(null);
  const [alunoSelecionado, setAlunoSelecionado] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchCursosFormador = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        // Modificado para usar a rota correta de inscrições do usuário
        const response = await axios.get(`${API_BASE}/inscricoes/minhas-inscricoes`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        // Ajustando para a estrutura de dados que vem da API
        setCursos(response.data);
        // Se a API retornar paginação, use as linhas abaixo:
        // setCursos(response.data.cursos);
        // setTotalPages(response.data.totalPages);
        setLoading(false);
      } catch (error) {
        console.error('Erro ao carregar cursos do usuário:', error);
        setLoading(false);
      }
    };

    fetchCursosFormador();
  }, [currentPage]);

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

  // Função de verificação de status foi mantida, mas note que o controller já envia o status calculado
  const verificarStatusCurso = (curso) => {
    if (curso.status) return curso.status; // Use o status já calculado no backend
    
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

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  if (loading) {
    return <div className="loading">Carregando seus cursos...</div>;
  }

  return (
    <div className="area-professor-container">
      <div className="main-content">
        <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        <div className="professor-content">
          <h1>Meus Cursos</h1>

          {cursos.length === 0 ? (
            <p className="no-cursos">Você não possui cursos inscritos no momento.</p>
          ) : (
            <>
              <div className="cursos-list">
                {cursos.map(curso => {
                  const status = curso.status || verificarStatusCurso(curso);
                  
                  return (
                    <div key={curso.cursoId} className="curso-panel">
                      <div className="curso-header">
                        <div>
                          <h2>{curso.nomeCurso}</h2>
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
                          <span className="label">Tipo:</span>
                          <span>{curso.tipoCurso}</span>
                        </div>
                        {curso.vagasTotais && (
                          <div className="meta-item">
                            <span className="label">Vagas:</span>
                            <span>{curso.vagasTotais}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="curso-actions">
                        <button 
                          className="ver-curso-btn"
                          onClick={() => handleVerCurso(curso.cursoId)}
                        >
                          Ver Detalhes
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {totalPages > 1 && (
                <div className="pagination">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={currentPage === page ? 'active' : ''}
                    >
                      {page}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
      
      {showAddConteudo && cursoSelecionado && (
        <CriarConteudoModal 
          curso={cursoSelecionado} 
          onClose={() => setShowAddConteudo(false)}
          onSuccess={() => {
            setShowAddConteudo(false);
            const fetchCursosFormador = async () => {
              try {
                const token = localStorage.getItem('token');
                const response = await axios.get(`${API_BASE}/inscricoes/minhas-inscricoes`, {
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
        <CriarAvaliacaoModal 
          curso={cursoSelecionado}
          aluno={alunoSelecionado}
          onClose={() => setShowAvaliacao(false)}
          onSuccess={() => {
            setShowAvaliacao(false);
            const fetchCursosFormador = async () => {
              try {
                const token = localStorage.getItem('token');
                const response = await axios.get(`${API_BASE}/inscricoes/minhas-inscricoes`, {
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
}