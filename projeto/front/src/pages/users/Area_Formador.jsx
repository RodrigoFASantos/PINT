import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from 'axios';
import API_BASE from '../../api';
import Sidebar from '../../components/Sidebar';
import CriarConteudoModal from '../../components/cursos/Criar_Conteudo_Modal';
import CriarAvaliacaoModal from '../../components/cursos/Criar_Avaliacao_Modal';
import '../users/css/Area_Formador.css';

/**
 * Componente da área do formador - apresenta os cursos que o formador está a ministrar
 * Permite acesso rápido aos cursos e às suas funcionalidades principais
 * Inclui navegação para detalhes do curso e gestão de conteúdos
 */
export default function AreaFormador() {
  // Estados principais para gestão dos dados dos cursos
  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estados para controlo da interface da sidebar
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // Estados para controlo dos modais de criação
  const [showAddConteudo, setShowAddConteudo] = useState(false);
  const [showAvaliacao, setShowAvaliacao] = useState(false);
  const [cursoSelecionado, setCursoSelecionado] = useState(null);
  const [alunoSelecionado, setAlunoSelecionado] = useState(null);

  const navigate = useNavigate();

  /**
   * Carrega a lista de cursos ministrados pelo formador atual
   * Faz pedido ao endpoint do perfil do formador para obter dados atualizados
   * Formata os dados para utilização no componente
   */
  useEffect(() => {
    const fetchCursosFormador = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        if (!token) {
          console.error('Token não encontrado - utilizador não autenticado');
          return;
        }

        const response = await axios.get(`${API_BASE}/formadores/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        // Extrai os cursos ministrados da resposta da API
        const { cursosMinistrados = [] } = response.data;
        
        // Formata os dados dos cursos para o formato esperado pelo componente
        const formatados = cursosMinistrados.map(c => ({
          cursoId: c.id, // Campo corrigido para corresponder ao backend
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
        // Em caso de erro, mantém array vazio para não quebrar a interface
        setCursos([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCursosFormador();
  }, []);

  /**
   * Navega para a página de detalhes de um curso específico
   * @param {number} id - ID do curso para visualizar
   */
  const handleVerCurso = (id) => navigate(`/cursos/${id}`);

  /**
   * Determina o estado atual do curso baseado nas datas de início e fim
   * Compara com a data atual para calcular se está agendado, em curso ou terminado
   * @param {Object} curso - Objeto do curso com datas de início e fim
   * @returns {string} Estado do curso ('Em curso', 'Terminado', 'Agendado')
   */
  const verificarStatusCurso = (curso) => {
    // Se o curso já tem um status definido, utiliza esse valor
    if (curso.status) return curso.status;
    
    const hoje = new Date();
    const inicio = new Date(curso.dataInicio);
    const fim = new Date(curso.dataFim);
    
    // Verifica se o curso está a decorrer atualmente
    if (hoje >= inicio && hoje <= fim) return "Em curso";
    
    // Verifica se o curso já terminou
    if (hoje > fim) return "Terminado";
    
    // Se ainda não começou, está agendado
    return "Agendado";
  };

  /**
   * Recarrega a lista de cursos após alterações
   * Utilizada após criação de conteúdos ou avaliações para atualizar dados
   */
  const recarregarCursos = async () => {
    try {
      const token = localStorage.getItem('token');
      const resp = await axios.get(`${API_BASE}/formadores/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const { cursosMinistrados = [] } = resp.data;
      
      // Formata novamente os dados atualizados
      const cursosAtualizados = cursosMinistrados.map(c => ({
        cursoId: c.id, // Campo corrigido
        nomeCurso: c.nome,
        categoria: c.categoria,
        area: c.area,
        dataInicio: c.dataInicio,
        dataFim: c.dataFim,
        tipoCurso: c.tipo,
        vagasTotais: c.vagas,
        status: c.status
      }));
      
      setCursos(cursosAtualizados);
    } catch (error) {
      console.error('Erro ao recarregar cursos:', error);
    }
  };

  // Apresenta indicador de carregamento enquanto os dados são obtidos
  if (loading) {
    return <div className="loading">A carregar os seus cursos...</div>;
  }

  return (
    <div className="area-professor-container">
      <div className="main-content">
        <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        
        <div className="professor-content">
          <h1>Os Meus Cursos</h1>

          {/* Apresenta mensagem quando não há cursos ou lista dos cursos existentes */}
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
                    {/* Cabeçalho do curso com nome, categoria e estado */}
                    <div className="curso-header">
                      <div>
                        <h2>{curso.nomeCurso}</h2>
                        <p className="categoria">{curso.categoria} &gt; {curso.area}</p>
                      </div>
                      <span className={`status-badge ${status.toLowerCase().replace(/\s+/g, '-')}`}>
                        {status}
                      </span>
                    </div>

                    {/* Metadados do curso (datas, tipo, vagas) */}
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
                      {/* Apresenta vagas apenas se estiver definido */}
                      {curso.vagasTotais != null && (
                        <div className="meta-item">
                          <span className="label">Vagas:</span>
                          <span>{curso.vagasTotais}</span>
                        </div>
                      )}
                    </div>

                    {/* Ações disponíveis para o curso */}
                    <div className="curso-actions">
                      <button
                        className="ver-curso-btn"
                        onClick={e => { 
                          e.stopPropagation(); 
                          handleVerCurso(curso.cursoId); 
                        }}
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

      {/* Modal para criação de conteúdo do curso */}
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

      {/* Modal para criação de avaliação de aluno */}
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