import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import API_BASE from "../../api";
import Sidebar from "../../components/Sidebar";
import DetalhesCurso from "../../components/cursos/Detalhes_Curso";
import CursoConteudos from "../../components/cursos/Curso_Conteudos";
import AvaliacaoCurso from "../../components/cursos/Avaliacao_curso";
import "./css/Pagina_Curso.css";

export default function CursoPagina() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const { currentUser } = useAuth();
  
  const [cursoData, setCursoData] = useState({
    curso: null,
    inscrito: false,
    loading: true,
    error: null,
    acessoNegado: false
  });
  
  const [userRole, setUserRole] = useState(null);

  // Extrair valores do estado cursoData para uso mais fácil
  const { curso, inscrito, loading, error, acessoNegado } = cursoData;

  // Configurar o userRole baseado no usuário atual
  useEffect(() => {
    if (currentUser && currentUser.id_cargo) {
      setUserRole(currentUser.id_cargo);
    }
  }, [currentUser]);

  // Carregar dados do curso
  useEffect(() => {
    const fetchCursoDetails = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token && id) {
          navigate('/login', { state: { redirectTo: `/cursos/${id}` } });
          return;
        }

        // Obter dados do curso
        const response = await axios.get(`${API_BASE}/cursos/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const curso = response.data;
        
        // Verificar acesso ao curso
        const dataAtual = new Date();
        const dataFimCurso = new Date(curso.data_fim);
        const cursoTerminado = dataFimCurso < dataAtual;
        
        if (curso.tipo === 'assincrono' && cursoTerminado && userRole !== 1) {
          setCursoData({
            curso: null,
            inscrito: false,
            loading: false,
            error: null,
            acessoNegado: true
          });
          return;
        }
        
        // Verificar inscrição do usuário no curso
        const inscricaoResponse = await axios.get(`${API_BASE}/inscricoes/verificar/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setCursoData({
          curso,
          inscrito: inscricaoResponse.data.inscrito,
          loading: false,
          error: null,
          acessoNegado: false
        });
        
      } catch (error) {
        console.error("Erro ao carregar detalhes do curso:", error);
        setCursoData({
          curso: null,
          inscrito: false,
          loading: false,
          error: error.response?.data?.message || error.message || "Erro ao carregar o curso",
          acessoNegado: false
        });
      }
    };

    if (id) {
      fetchCursoDetails();
    }
  }, [id, userRole, navigate]);

  // Renderização condicional para estados de loading/erro
  if (loading) {
    return (
      <div className="carregamento">
        <div className="indicador-carregamento"></div>
      </div>
    );
  }

  if (acessoNegado) {
    return (
      <div className="pagina caixa-mensagem">
        <h2 className="mensagem-erro">Acesso Negado</h2>
        <p>Este curso assíncrono já foi encerrado e apenas administradores podem aceder ao seu conteúdo.</p>
        <button onClick={() => navigate('/cursos')} className="botao-voltar">
          Voltar para lista de cursos
        </button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pagina caixa-mensagem">
        <h2 className="mensagem-erro">Erro ao carregar o curso</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/cursos')} className="botao-voltar">
          Voltar para lista de cursos
        </button>
      </div>
    );
  }

  if (!curso) {
    return (
      <div className="pagina caixa-mensagem">
        <h2 className="mensagem-erro">Curso não encontrado</h2>
        <button onClick={() => navigate('/cursos')} className="botao-voltar">
          Voltar para lista de cursos
        </button>
      </div>
    );
  }

  return (
    <div className="pagina pagina-principal">
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

      <div className="conteudo-curso">
        {/* Seção 1: Detalhes do Curso */}
        <div className="secao-curso">
          <DetalhesCurso
            cursoId={id}
            curso={curso}
            inscrito={inscrito}
            userRole={userRole}
          />
        </div>

        {/* Seção 2: Conteúdo do Curso */}
        <div className="secao-curso">
          <CursoConteudos
            cursoId={id}
            inscrito={inscrito}
          />
        </div>

        {/* Seção 3: Avaliação do Curso */}
        <div className="secao-curso">
          <AvaliacaoCurso
            cursoId={id}
            userRole={userRole}
            formadorId={curso.id_formador}
          />
        </div>
      </div>
    </div>
  );
}