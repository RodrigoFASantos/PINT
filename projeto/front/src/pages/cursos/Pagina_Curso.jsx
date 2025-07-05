import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import API_BASE from "../../api";
import Sidebar from "../../components/Sidebar";
import DetalhesCurso from "../../components/cursos/Detalhes_Curso";
import PresencasCurso from "../../components/cursos/PresencasCurso";
import CursoConteudos from "../../components/cursos/Curso_Conteudos";
import AvaliacaoCurso from "../../components/cursos/Avaliacao_curso";
import "./css/Pagina_Curso.css";

/**
 * Página principal para visualização e gestão dum curso específico
 * 
 * Esta é a página central onde utilizadores podem ver todos os aspetos dum curso:
 * - Detalhes gerais (nome, descrição, datas, formador)
 * - Sistema de presenças para controlo de frequência  
 * - Conteúdos organizados hierarquicamente (tópicos > pastas > ficheiros)
 * - Sistema de avaliação com testes e certificações
 * 
 * Regras de acesso importantes:
 * - Cursos ativos: todos podem ver detalhes básicos
 * - Cursos terminados: apenas inscritos podem aceder aos conteúdos
 * - Gestão: apenas formadores do curso e administradores
 * 
 * A página adapta-se dinamicamente ao tipo de utilizador e estado do curso.
 */
export default function CursoPagina() {
  const { id } = useParams(); // Extrai o ID do curso da URL
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // Hook de autenticação para obter dados do utilizador atual
  const { currentUser } = useAuth();

  /**
   * Estado principal que agrega todas as informações do curso
   * 
   * Centraliza os dados numa única estrutura para facilitar a gestão
   * e evitar múltiplos estados separados que podem ficar dessincronizados
   */
  const [cursoData, setCursoData] = useState({
    curso: null,          // Dados completos do curso
    inscrito: false,      // Se o utilizador atual tá inscrito
    loading: true,        // Estado de carregamento inicial
    error: null,          // Mensagem de erro se algo correr mal
    acessoNegado: false   // Bloqueio por regras de negócio
  });

  // Papel/cargo do utilizador atual (1=admin, 2=formador, 3=formando)
  const [userRole, setUserRole] = useState(null);

  // Extrair valores do estado cursoData para uso mais fácil no código
  const { curso, inscrito, loading, error, acessoNegado } = cursoData;

  /**
   * Define o papel do utilizador baseado nos dados de autenticação
   * 
   * Esta informação é usada ao longo da aplicação para controlar
   * que ações e conteúdos cada tipo de utilizador pode aceder
   */
  useEffect(() => {
    if (currentUser && currentUser.id_cargo) {
      setUserRole(currentUser.id_cargo);
      console.log('Debug - User role definido:', currentUser.id_cargo);
      console.log('Debug - User ID:', currentUser.id_utilizador);
    }
  }, [currentUser]);

  /**
   * Carrega todos os dados necessários para a página do curso
   * 
   * Este useEffect é o coração da página - busca todas as informações
   * essenciais e aplica as regras de negócio para determinar o que
   * o utilizador pode ou não aceder.
   * 
   * Fluxo principal:
   * 1. Verificar autenticação do utilizador
   * 2. Carregar dados básicos do curso da API
   * 3. Aplicar regras de acesso para cursos terminados
   * 4. Verificar se o utilizador tá inscrito no curso
   * 5. Atualizar estado com todos os dados processados
   */
  useEffect(() => {
    const fetchCursoDetails = async () => {
      try {
        console.log('🔍 Debug - A carregar dados do curso:', id);
        
        // Verificar se o utilizador tem token de autenticação
        const token = localStorage.getItem('token');
        if (!token && id) {
          console.warn('⚠️ Debug - Token não encontrado, a redirecionar para login');
          navigate('/login', { state: { redirectTo: `/cursos/${id}` } });
          return;
        }

        // === CARREGAR DADOS BÁSICOS DO CURSO ===
        console.log('📡 Debug - A fazer pedido para carregar curso...');
        const response = await axios.get(`${API_BASE}/cursos/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const curso = response.data;
        console.log('✅ Debug - Dados do curso carregados:', {
          nome: curso.nome,
          tipo: curso.tipo,
          formadorId: curso.id_formador,
          estado: curso.estado
        });

        // === VERIFICAR REGRAS DE ACESSO PARA CURSOS TERMINADOS ===
        
        // Calcular se o curso já terminou comparando datas
        const dataAtual = new Date();
        const dataFimCurso = new Date(curso.data_fim);
        const cursoTerminado = dataFimCurso < dataAtual;

        console.log('📅 Debug - Verificação de datas:', {
          dataAtual: dataAtual.toISOString(),
          dataFim: curso.data_fim,
          cursoTerminado
        });

        // REGRA ESPECIAL: Cursos assíncronos terminados são bloqueados para não-admins
        if (curso.tipo === 'assincrono' && cursoTerminado && userRole !== 1) {
          console.warn('🚫 Debug - Acesso negado: curso assíncrono terminado');
          setCursoData({
            curso: null,
            inscrito: false,
            loading: false,
            error: null,
            acessoNegado: true
          });
          return;
        }

        // === VERIFICAR INSCRIÇÃO DO UTILIZADOR NO CURSO ===
        console.log('👤 Debug - A verificar inscrição do utilizador...');
        const inscricaoResponse = await axios.get(`${API_BASE}/inscricoes/verificar/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const utilizadorInscrito = inscricaoResponse.data.inscrito;
        console.log('✅ Debug - Estado de inscrição:', utilizadorInscrito);

        // === ATUALIZAR ESTADO COM TODOS OS DADOS PROCESSADOS ===
        setCursoData({
          curso,
          inscrito: utilizadorInscrito,
          loading: false,
          error: null,
          acessoNegado: false
        });

        console.log('🎉 Debug - Carregamento completo finalizado com sucesso');

      } catch (error) {
        console.error("❌ Debug - Erro ao carregar detalhes do curso:", error);
        
        // Extrair mensagem de erro mais específica
        const mensagemErro = error.response?.data?.message || 
                            error.message || 
                            "Erro desconhecido ao carregar o curso";

        setCursoData({
          curso: null,
          inscrito: false,
          loading: false,
          error: mensagemErro,
          acessoNegado: false
        });
      }
    };

    // Só executar se temos um ID de curso válido
    if (id) {
      fetchCursoDetails();
    } else {
      console.error('❌ Debug - ID do curso não fornecido na URL');
      setCursoData({
        curso: null,
        inscrito: false,
        loading: false,
        error: 'ID do curso não fornecido',
        acessoNegado: false
      });
    }
  }, [id, userRole, navigate]); // Executar quando qualquer uma destas dependências muda

  // ===== RENDERIZAÇÃO CONDICIONAL PARA ESTADOS ESPECIAIS =====

  /**
   * Ecrã de carregamento enquanto os dados tão a ser buscados
   * 
   * Mostra um spinner animado e mensagem para o utilizador
   * saber que algo tá a acontecer nos bastidores
   */
  if (loading) {
    return (
      <div className="carregamento">
        <div className="indicador-carregamento"></div>
        <p>A carregar dados do curso...</p>
      </div>
    );
  }

  /**
   * Ecrã de acesso negado para cursos bloqueados
   * 
   * Aparece quando um utilizador tenta aceder a um curso
   * assíncrono que já terminou e não é administrador
   */
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

  /**
   * Ecrã de erro quando algo corre mal no carregamento
   * 
   * Mostra a mensagem de erro específica e permite tentar novamente
   * voltando para a listagem principal de cursos
   */
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

  /**
   * Ecrã quando o curso não foi encontrado
   * 
   * Pode acontecer se o ID na URL não corresponde a nenhum
   * curso existente na base de dados
   */
  if (!curso) {
    return (
      <div className="pagina caixa-mensagem">
        <h2 className="mensagem-erro">Curso não encontrado</h2>
        <p>O curso que procuras não existe ou foi removido.</p>
        <button onClick={() => navigate('/cursos')} className="botao-voltar">
          Voltar para lista de cursos
        </button>
      </div>
    );
  }

  // ===== RENDERIZAÇÃO PRINCIPAL DA PÁGINA =====

  return (
    <div className="pagina pagina-principal">
      {/* Barra lateral de navegação */}
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

      <div className="conteudo-curso">
        {/* 
          Secção 1: Detalhes gerais do curso
          
          Mostra informações básicas como nome, descrição, datas,
          formador responsável e permite inscrições/desincrições 
        */}
        <div className="secao-curso">
          <DetalhesCurso
            cursoId={id}
            curso={curso}
            inscrito={inscrito}
            userRole={userRole}
          />
        </div>

        {/* 
          Secção 2: Sistema de presenças
          
          Permite registo e consulta de presenças nas sessões do curso.
          Formadores podem marcar presenças, alunos podem consultar o seu histórico
        */}
        <div className="secao-curso">
          <PresencasCurso
            cursoId={id}
            userRole={userRole}
            formadorId={curso.id_formador}
          />
        </div>

        {/* 
          Secção 3: Conteúdos do curso
          
          CORREÇÃO CRÍTICA: Agora passa o formadorId como prop!
          
          Sistema hierárquico de conteúdos organizados em:
          - Tópicos (temas principais)
          - Pastas (subtemas dentro dos tópicos)  
          - Conteúdos (ficheiros, links, vídeos)
          
          Apenas o formador específico do curso pode gerir os conteúdos
        */}
        <div className="secao-curso">
          <CursoConteudos
            cursoId={id}
            inscrito={inscrito}
            formadorId={curso.id_formador} // ⭐ CORREÇÃO: Agora passa o ID do formador!
          />
        </div>

        {/* 
          Secção 4: Sistema de avaliação
          
          Testes, questionários e certificações do curso.
          Formadores criam avaliações, alunos respondem e veem resultados
        */}
        <div className="secao-curso">
          <AvaliacaoCurso
            cursoId={id}
            userRole={userRole}
            formadorId={curso.id_formador}
            tipoCurso={curso.tipo}
          />
        </div>
      </div>
    </div>
  );
}