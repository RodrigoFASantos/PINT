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
 * Versão corrigida com melhor tratamento de erros e debugging detalhado
 * para identificar e resolver problemas de conectividade e autenticação.
 */
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
  const [debugInfo, setDebugInfo] = useState([]); // ✅ Novo: Array para armazenar logs de debug

  const { curso, inscrito, loading, error, acessoNegado } = cursoData;

  // ✅ Função auxiliar para adicionar logs de debug
  const addDebugLog = (message, type = 'info', data = null) => {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      type, // 'info', 'warn', 'error', 'success'
      message,
      data
    };
    
    console.log(`[${type.toUpperCase()}] ${message}`, data || '');
    setDebugInfo(prev => [...prev.slice(-9), logEntry]); // Manter apenas os últimos 10 logs
  };

  useEffect(() => {
    if (currentUser && currentUser.id_cargo) {
      setUserRole(currentUser.id_cargo);
      addDebugLog(`Papel do utilizador definido: ${currentUser.id_cargo}`, 'info', {
        userId: currentUser.id_utilizador,
        role: currentUser.id_cargo,
        name: currentUser.nome
      });
    }
  }, [currentUser]);

  /**
   * ✅ Função melhorada para carregar dados do curso com debugging detalhado
   */
  useEffect(() => {
    const fetchCursoDetails = async () => {
      try {
        addDebugLog('Iniciando carregamento de dados do curso', 'info', { courseId: id });
        
        // === VERIFICAÇÃO INICIAL ===
        if (!id) {
          addDebugLog('ID do curso não fornecido na URL', 'error');
          setCursoData({
            curso: null,
            inscrito: false,
            loading: false,
            error: 'ID do curso não fornecido na URL',
            acessoNegado: false
          });
          return;
        }

        // Verificar se é um ID válido
        if (!/^\d+$/.test(id)) {
          addDebugLog('ID do curso inválido', 'error', { providedId: id });
          setCursoData({
            curso: null,
            inscrito: false,
            loading: false,
            error: 'ID do curso deve ser um número válido',
            acessoNegado: false
          });
          return;
        }

        // === VERIFICAÇÃO DE AUTENTICAÇÃO ===
        const token = localStorage.getItem('token');
        addDebugLog('Verificando token de autenticação', 'info', { 
          hasToken: !!token,
          tokenLength: token ? token.length : 0
        });

        if (!token) {
          addDebugLog('Token não encontrado, redirecionando para login', 'warn');
          navigate('/login', { state: { redirectTo: `/cursos/${id}` } });
          return;
        }

        // Verificar se o utilizador está carregado
        if (!currentUser) {
          addDebugLog('Aguardando dados do utilizador...', 'info');
          return; // Aguardar currentUser carregar
        }

        // === CARREGAR DADOS BÁSICOS DO CURSO ===
        addDebugLog('Fazendo requisição para carregar dados do curso', 'info', {
          url: `${API_BASE}/cursos/${id}`,
          method: 'GET'
        });

        let cursoResponse;
        try {
          cursoResponse = await axios.get(`${API_BASE}/cursos/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 10000 // ✅ Timeout de 10 segundos
          });
          
          addDebugLog('Dados do curso carregados com sucesso', 'success', {
            courseName: cursoResponse.data.nome,
            courseType: cursoResponse.data.tipo,
            instructorId: cursoResponse.data.id_formador,
            status: cursoResponse.data.estado
          });
        } catch (cursoError) {
          addDebugLog('Erro ao carregar dados do curso', 'error', {
            status: cursoError.response?.status,
            statusText: cursoError.response?.statusText,
            message: cursoError.message,
            responseData: cursoError.response?.data
          });
          
          // Tratamento específico de erros de curso
          if (cursoError.response?.status === 404) {
            setCursoData({
              curso: null,
              inscrito: false,
              loading: false,
              error: 'Curso não encontrado',
              acessoNegado: false
            });
            return;
          } else if (cursoError.response?.status === 401) {
            addDebugLog('Token expirado, redirecionando para login', 'warn');
            navigate('/login', { state: { redirectTo: `/cursos/${id}` } });
            return;
          } else {
            throw cursoError; // Re-throw para ser capturado pelo catch principal
          }
        }

        const curso = cursoResponse.data;

        // === VERIFICAR REGRAS DE ACESSO ===
        const dataAtual = new Date();
        const dataFimCurso = new Date(curso.data_fim);
        const cursoTerminado = dataFimCurso < dataAtual;

        addDebugLog('Verificando regras de acesso', 'info', {
          currentDate: dataAtual.toISOString(),
          courseEndDate: curso.data_fim,
          courseFinished: cursoTerminado,
          courseType: curso.tipo,
          userRole: userRole
        });

        // REGRA ESPECIAL: Cursos assíncronos terminados
        if (curso.tipo === 'assincrono' && cursoTerminado && userRole !== 1) {
          addDebugLog('Acesso negado: curso assíncrono terminado', 'warn');
          setCursoData({
            curso: null,
            inscrito: false,
            loading: false,
            error: null,
            acessoNegado: true
          });
          return;
        }

        // === VERIFICAR INSCRIÇÃO DO UTILIZADOR ===
        addDebugLog('Verificando inscrição do utilizador no curso', 'info', {
          url: `${API_BASE}/inscricoes/verificar/${id}`,
          userId: currentUser.id_utilizador
        });

        let inscricaoResponse;
        try {
          inscricaoResponse = await axios.get(`${API_BASE}/inscricoes/verificar/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 10000 // ✅ Timeout de 10 segundos
          });
          
          addDebugLog('Verificação de inscrição concluída', 'success', {
            inscrito: inscricaoResponse.data.inscrito,
            inscricaoData: inscricaoResponse.data.inscricao
          });
        } catch (inscricaoError) {
          addDebugLog('Erro ao verificar inscrição', 'error', {
            status: inscricaoError.response?.status,
            statusText: inscricaoError.response?.statusText,
            message: inscricaoError.message,
            responseData: inscricaoError.response?.data,
            url: `${API_BASE}/inscricoes/verificar/${id}`
          });
          
          // ✅ Tratamento específico para erro 500 na verificação de inscrição
          if (inscricaoError.response?.status === 500) {
            // Mostrar erro detalhado para debugging
            const errorDetails = inscricaoError.response?.data || {};
            addDebugLog('Erro 500 detectado na verificação de inscrição', 'error', {
              errorMessage: errorDetails.message || 'Erro interno do servidor',
              errorDetails: errorDetails.details || 'Sem detalhes adicionais',
              timestamp: errorDetails.timestamp || 'N/A'
            });
            
            setCursoData({
              curso: null,
              inscrito: false,
              loading: false,
              error: `Erro interno do servidor ao verificar inscrição: ${errorDetails.message || inscricaoError.message}`,
              acessoNegado: false
            });
            return;
          } else if (inscricaoError.response?.status === 401) {
            addDebugLog('Token expirado durante verificação de inscrição', 'warn');
            navigate('/login', { state: { redirectTo: `/cursos/${id}` } });
            return;
          } else {
            // Para outros erros, assumir que não está inscrito e continuar
            addDebugLog('Assumindo que utilizador não está inscrito devido a erro', 'warn');
            inscricaoResponse = { data: { inscrito: false, inscricao: null } };
          }
        }

        const utilizadorInscrito = inscricaoResponse.data.inscrito;

        // === ATUALIZAR ESTADO FINAL ===
        addDebugLog('Atualizando estado final da página', 'success', {
          courseLoaded: true,
          userEnrolled: utilizadorInscrito,
          accessDenied: false
        });

        setCursoData({
          curso,
          inscrito: utilizadorInscrito,
          loading: false,
          error: null,
          acessoNegado: false
        });

      } catch (error) {
        addDebugLog('Erro crítico no carregamento da página', 'error', {
          errorName: error.name,
          errorMessage: error.message,
          errorStack: error.stack,
          responseStatus: error.response?.status,
          responseData: error.response?.data
        });
        
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

    if (id && currentUser) {
      fetchCursoDetails();
    } else if (id && !currentUser) {
      addDebugLog('Aguardando carregamento dos dados do utilizador', 'info');
    }
  }, [id, userRole, currentUser, navigate]);

  // ===== COMPONENTES DE DEBUG (APENAS EM DESENVOLVIMENTO) =====
  const DebugPanel = () => {
    if (process.env.NODE_ENV !== 'development') return null;

    return (
      <div style={{
        position: 'fixed',
        bottom: '10px',
        right: '10px',
        width: '400px',
        maxHeight: '300px',
        backgroundColor: '#f8f9fa',
        border: '1px solid #dee2e6',
        borderRadius: '8px',
        padding: '10px',
        fontSize: '12px',
        fontFamily: 'monospace',
        overflow: 'auto',
        zIndex: 9999,
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <div style={{ 
          fontWeight: 'bold', 
          marginBottom: '10px',
          borderBottom: '1px solid #dee2e6',
          paddingBottom: '5px'
        }}>
          🔧 Debug Panel - Página do Curso
        </div>
        
        <div style={{ marginBottom: '10px' }}>
          <strong>Estado Atual:</strong>
          <div>Loading: {loading ? '✅' : '❌'}</div>
          <div>Curso: {curso ? '✅' : '❌'}</div>
          <div>Inscrito: {inscrito ? '✅' : '❌'}</div>
          <div>Erro: {error ? '❌' : '✅'}</div>
          <div>User Role: {userRole || 'N/A'}</div>
        </div>

        <div>
          <strong>Últimos Logs:</strong>
          <div style={{ maxHeight: '150px', overflow: 'auto' }}>
            {debugInfo.slice(-5).map((log, index) => (
              <div key={index} style={{
                marginBottom: '5px',
                padding: '2px',
                backgroundColor: log.type === 'error' ? '#ffebee' : 
                                log.type === 'warn' ? '#fff3e0' :
                                log.type === 'success' ? '#e8f5e8' : '#f5f5f5',
                borderRadius: '3px'
              }}>
                <div style={{ fontWeight: 'bold' }}>
                  {log.type === 'error' ? '❌' : 
                   log.type === 'warn' ? '⚠️' : 
                   log.type === 'success' ? '✅' : 'ℹ️'} 
                  {log.timestamp.slice(11, 19)}
                </div>
                <div>{log.message}</div>
                {log.data && (
                  <div style={{ fontSize: '10px', color: '#666' }}>
                    {JSON.stringify(log.data, null, 2).slice(0, 100)}...
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // ===== RENDERIZAÇÃO CONDICIONAL =====

  if (loading) {
    return (
      <div className="carregamento">
        <div className="indicador-carregamento"></div>
        <p>A carregar dados do curso...</p>
        <DebugPanel />
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
        <DebugPanel />
      </div>
    );
  }

  if (error) {
    return (
      <div className="pagina caixa-mensagem">
        <h2 className="mensagem-erro">Erro ao carregar o curso</h2>
        <p>{error}</p>
        {process.env.NODE_ENV === 'development' && (
          <details style={{ marginTop: '20px', textAlign: 'left' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
              🔧 Informações de Debug (Clique para expandir)
            </summary>
            <div style={{ 
              marginTop: '10px', 
              padding: '10px', 
              backgroundColor: '#f8f9fa', 
              borderRadius: '5px',
              fontSize: '12px',
              fontFamily: 'monospace'
            }}>
              <div><strong>Course ID:</strong> {id}</div>
              <div><strong>User Role:</strong> {userRole}</div>
              <div><strong>Current User:</strong> {currentUser?.id_utilizador || 'N/A'}</div>
              <div><strong>API Base:</strong> {API_BASE}</div>
              <div><strong>Token Present:</strong> {localStorage.getItem('token') ? 'Yes' : 'No'}</div>
            </div>
          </details>
        )}
        <button 
          onClick={() => navigate('/cursos')} 
          className="botao-voltar"
          style={{ marginTop: '20px' }}
        >
          Voltar para lista de cursos
        </button>
        <DebugPanel />
      </div>
    );
  }

  if (!curso) {
    return (
      <div className="pagina caixa-mensagem">
        <h2 className="mensagem-erro">Curso não encontrado</h2>
        <p>O curso que procuras não existe ou foi removido.</p>
        <button onClick={() => navigate('/cursos')} className="botao-voltar">
          Voltar para lista de cursos
        </button>
        <DebugPanel />
      </div>
    );
  }

  // ===== RENDERIZAÇÃO PRINCIPAL =====
  return (
    <div className="pagina pagina-principal">
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

      <div className="conteudo-curso">
        <div className="secao-curso">
          <DetalhesCurso
            cursoId={id}
            curso={curso}
            inscrito={inscrito}
            userRole={userRole}
          />
        </div>

        <div className="secao-curso">
          <PresencasCurso
            cursoId={id}
            userRole={userRole}
            formadorId={curso.id_formador}
          />
        </div>

        <div className="secao-curso">
          <CursoConteudos
            cursoId={id}
            inscrito={inscrito}
            formadorId={curso.id_formador}
          />
        </div>

        <div className="secao-curso">
          <AvaliacaoCurso
            cursoId={id}
            userRole={userRole}
            formadorId={curso.id_formador}
            tipoCurso={curso.tipo}
          />
        </div>
      </div>

      <DebugPanel />
    </div>
  );
}