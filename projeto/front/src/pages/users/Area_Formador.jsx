import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from 'axios';
import API_BASE from '../../api';
import Sidebar from '../../components/Sidebar';
import CriarConteudoModal from '../../components/cursos/Criar_Conteudo_Modal';
import CriarAvaliacaoModal from '../../components/cursos/Criar_Avaliacao_Modal';
import '../users/css/Area_Formador.css';

/**
 * Área do formador - exibe os cursos que o formador está a ministrar
 * Permite acesso rápido aos cursos e suas funcionalidades
 */
export default function AreaFormador() {
  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estados para controlo da interface
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // Estados para modais
  const [showAddConteudo, setShowAddConteudo] = useState(false);
  const [showAvaliacao, setShowAvaliacao] = useState(false);
  const [cursoSelecionado, setCursoSelecionado] = useState(null);
  const [alunoSelecionado, setAlunoSelecionado] = useState(null);

  const navigate = useNavigate();

  // Carregar cursos ministrados pelo formador
  useEffect(() => {
    const fetchCursosFormador = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_BASE}/formadores/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        // Extrair e formatar dados dos cursos
        const { cursosMinistrados = [] } = response.data;
        const formatados = cursosMinistrados.map(c => ({
          cursoId: c.id,
          nomeCurso: c.nome,
          categoria: c.categoria,
          area: c.area,
          dataInicio: c.dataInicio,
          dataFim: c.dataFim,
          tipoCurso: c.tipo,
          vagasTotais: c.vagas,
          status: c.status
        }));

        setCursos(formatados);
      } catch (error) {
        console.error('Erro ao carregar cursos do formador:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCursosFormador();
  }, []);

  /**
   * Navegar para página de detalhes do curso
   */
  const handleVerCurso = (id) => navigate(`/cursos/${id}`);

  /**
   * Determinar estado do curso baseado nas datas
   */
  const verificarStatusCurso = (curso) => {
    if (curso.status) return curso.status;
    const hoje = new Date();
    const inicio = new Date(curso.dataInicio);
    const fim = new Date(curso.dataFim);
    if (hoje >= inicio && hoje <= fim) return "Em curso";
    if (hoje > fim) return "Terminado";
    return "Agendado";
  };

  /**
   * Recarregar lista de cursos após alterações
   */
  const recarregarCursos = async () => {
    const token = localStorage.getItem('token');
    const resp = await axios.get(`${API_BASE}/formadores/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const { cursosMinistrados = [] } = resp.data;
    setCursos(cursosMinistrados.map(c => ({
      cursoId: c.id,
      nomeCurso: c.nome,
      categoria: c.categoria,
      area: c.area,
      dataInicio: c.dataInicio,
      dataFim: c.dataFim,
      tipoCurso: c.tipo,
      vagasTotais: c.vagas,
      status: c.status
    })));
  };

  if (loading) {
    return <div className="loading">A carregar os seus cursos...</div>;
  }

  return (
    <div className="area-professor-container">
      <div className="main-content">
        <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        <div className="professor-content">
          <h1>Os Meus Cursos</h1>

          {cursos.length === 0 ? (
            <p className="no-cursos">Não ministra nenhum curso no momento.</p>
          ) : (
            <div className="cursos-list">
              {cursos.map(curso => {
                const status = verificarStatusCurso(curso);
                return (
                  <div
                    key={curso.cursoId}
                    className="curso-panel"
                    onClick={() => handleVerCurso(curso.cursoId)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="curso-header">
                      <div>
                        <h2>{curso.nomeCurso}</h2>
                        <p className="categoria">{curso.categoria} &gt; {curso.area}</p>
                      </div>
                      <span className={`status-badge ${status.toLowerCase().replace(/\s+/g, '-')}`}>
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
                      {curso.vagasTotais != null && (
                        <div className="meta-item">
                          <span className="label">Vagas:</span>
                          <span>{curso.vagasTotais}</span>
                        </div>
                      )}
                    </div>

                    <div className="curso-actions">
                      <button
                        className="ver-curso-btn"
                        onClick={e => { e.stopPropagation(); handleVerCurso(curso.cursoId); }}
                      >
                        Ver Detalhes
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal para criar conteúdo */}
      {showAddConteudo && cursoSelecionado && (
        <CriarConteudoModal
          curso={cursoSelecionado}
          onClose={() => setShowAddConteudo(false)}
          onSuccess={() => {
            setShowAddConteudo(false);
            recarregarCursos();
          }}
        />
      )}

      {/* Modal para criar avaliação */}
      {showAvaliacao && cursoSelecionado && alunoSelecionado && (
        <CriarAvaliacaoModal
          curso={cursoSelecionado}
          aluno={alunoSelecionado}
          onClose={() => setShowAvaliacao(false)}
          onSuccess={() => {
            setShowAvaliacao(false);
            recarregarCursos();
          }}
        />
      )}
    </div>
  );
}