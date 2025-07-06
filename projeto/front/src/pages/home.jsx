import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import banner from '../images/banner.jpg';
import API_BASE from '../api';
import axios from 'axios';
import CursosSugeridos from '../components/Cursos_Sugeridos';
import fallbackCurso from '../images/default_image.png';
import TrocarSenhaModal from '../components/Trocar_Senha_Modal';
import './css/home.css';

/**
 * Componente principal da página inicial
 * Versão corrigida para eliminar loops infinitos e melhorar tratamento de erros
 */
export default function Home() {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [inscricoes, setInscricoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [userId, setUserId] = useState(null);
  const [filtroAtivo, setFiltroAtivo] = useState('todos');
  const [initialized, setInitialized] = useState(false);

  // Estados para debugging (apenas em dev)
  const [debugInfo, setDebugInfo] = useState([]);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // Referência para animação de texto
  const textRef = useRef(null);

  // ✅ Função de debug memoizada para evitar re-renders
  const addDebugLog = useCallback((message, type = 'info', data = null) => {
    if (process.env.NODE_ENV === 'development') {
      const timestamp = new Date().toISOString();
      console.log(`[HOME-${type.toUpperCase()}] ${message}`, data || '');
      
      setDebugInfo(prev => {
        const newLog = { timestamp, type, message, data };
        return [...prev.slice(-9), newLog];
      });
    }
  }, []);

  // Frases para animação do banner
  const texts = [
    "Aprender aqui é mais fácil",
    "Aprender aqui é uma experiência nova",
    "Aprender aqui é simples",
    "Aprender aqui é eficaz",
    "Aprender aqui é divertido",
    "Aprender aqui é inovador"
  ];

  // ✅ Verificação de autenticação simplificada
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      addDebugLog('Token não encontrado, redirecionando para login', 'warn');
      navigate('/login');
      return;
    }
    addDebugLog('Token encontrado', 'success');
  }, [navigate, addDebugLog]);

  // ✅ Função principal para buscar inscrições - melhorada com debug detalhado
  const buscarInscricoes = useCallback(async () => {
    addDebugLog('=== INÍCIO DA BUSCA DE INSCRIÇÕES ===', 'info');
    
    try {
      setError(null);
      setLoading(true);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Token não encontrado');
      }

      addDebugLog('Token encontrado, preparando requisição', 'info');

      const config = {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 15000 // Aumentar timeout para 15 segundos
      };

      addDebugLog('Configuração da requisição:', 'info', {
        url: `${API_BASE}/inscricoes/minhas-inscricoes`,
        headers: config.headers,
        timeout: config.timeout
      });

      addDebugLog('A enviar requisição para API...', 'info');
      const response = await axios.get(`${API_BASE}/inscricoes/minhas-inscricoes`, config);
      
      addDebugLog('Resposta da API recebida', 'success', {
        status: response.status,
        statusText: response.statusText,
        dataType: typeof response.data,
        isArray: Array.isArray(response.data),
        dataLength: Array.isArray(response.data) ? response.data.length : 'N/A',
        firstItem: Array.isArray(response.data) && response.data.length > 0 ? response.data[0] : null
      });

      // Processar dados da resposta
      let inscricoesData = [];
      
      if (Array.isArray(response.data)) {
        inscricoesData = response.data;
        addDebugLog('Dados são array direto', 'info');
      } else if (response.data && response.data.inscricoes) {
        inscricoesData = response.data.inscricoes;
        addDebugLog('Dados extraídos de response.data.inscricoes', 'info');
      } else if (response.data && typeof response.data === 'object') {
        const possibleKeys = ['data', 'items', 'results', 'cursos'];
        for (const key of possibleKeys) {
          if (response.data[key] && Array.isArray(response.data[key])) {
            inscricoesData = response.data[key];
            addDebugLog(`Dados extraídos de response.data.${key}`, 'info');
            break;
          }
        }
      }

      addDebugLog('Dados processados:', 'info', {
        totalInscricoes: inscricoesData.length,
        exemploInscricao: inscricoesData.length > 0 ? inscricoesData[0] : null
      });

      // Validar e filtrar dados das inscrições
      const inscricoesValidas = inscricoesData.filter(inscricao => {
        if (!inscricao) return false;
        
        const cursoId = inscricao.cursoId || inscricao.id_curso || inscricao.id;
        const nomeCurso = inscricao.nomeCurso || inscricao.curso?.nome || inscricao.nome;
        
        const valida = !!(cursoId && nomeCurso);
        
        if (!valida) {
          addDebugLog('Inscrição inválida filtrada:', 'warn', inscricao);
        }
        
        return valida;
      });

      addDebugLog('Inscrições validadas:', 'success', {
        total: inscricoesValidas.length,
        invalidas: inscricoesData.length - inscricoesValidas.length
      });

      setInscricoes(inscricoesValidas);
      addDebugLog('Estado das inscrições atualizado com sucesso', 'success');
      
    } catch (err) {
      addDebugLog('=== ERRO NA BUSCA DE INSCRIÇÕES ===', 'error', {
        message: err.message,
        status: err.response?.status,
        statusText: err.response?.statusText,
        responseData: err.response?.data,
        code: err.code,
        stack: err.stack
      });
      
      let errorMessage = 'Erro ao carregar cursos inscritos';
      
      if (err.response?.status === 401) {
        errorMessage = 'Sessão expirada. A redireccionar...';
        localStorage.removeItem('token');
        setTimeout(() => navigate('/login'), 2000);
      } else if (err.response?.status === 500) {
        errorMessage = 'Erro interno do servidor. Tenta novamente em alguns segundos.';
      } else if (err.response?.status === 503) {
        errorMessage = 'Serviço temporariamente indisponível';
      } else if (err.code === 'ECONNABORTED') {
        errorMessage = 'Servidor demorou muito a responder. Verifica a tua ligação.';
      } else if (err.code === 'NETWORK_ERROR' || err.message.includes('Network Error')) {
        errorMessage = 'Erro de ligação. Verifica a tua internet.';
      } else if (err.message) {
        errorMessage = `Erro: ${err.message}`;
      }
      
      setError(errorMessage);
      setInscricoes([]);
      
      addDebugLog('Estado de erro definido:', 'error', errorMessage);
    } finally {
      setLoading(false);
      addDebugLog('=== FIM DA BUSCA DE INSCRIÇÕES ===', 'info');
    }
  }, [addDebugLog, navigate]);

  // ✅ Inicialização única - evita loops
  useEffect(() => {
    const initializeApp = async () => {
      if (initialized) {
        addDebugLog('App já inicializada, a saltar', 'warn');
        return;
      }

      addDebugLog('=== INICIALIZAÇÃO DA APP ===', 'info');

      try {
        const token = localStorage.getItem('token');
        if (!token) {
          addDebugLog('Token não encontrado durante inicialização', 'error');
          return;
        }

        addDebugLog('A descodificar token...', 'info');
        
        // Decodificar token de forma mais segura
        try {
          const tokenParts = token.split('.');
          if (tokenParts.length !== 3) {
            throw new Error('Token inválido - formato incorreto');
          }
          
          const decodedToken = JSON.parse(atob(tokenParts[1]));
          addDebugLog('Token descodificado:', 'success', {
            id_utilizador: decodedToken.id_utilizador,
            cargo: decodedToken.id_cargo,
            exp: decodedToken.exp ? new Date(decodedToken.exp * 1000).toISOString() : 'N/A'
          });
          
          setUserId(decodedToken.id_utilizador);
        } catch (tokenError) {
          addDebugLog('Erro ao descodificar token:', 'error', tokenError.message);
          localStorage.removeItem('token');
          navigate('/login');
          return;
        }

        // Verificar primeiro login
        addDebugLog('A verificar dados do perfil...', 'info');
        
        const config = { 
          headers: { 'Authorization': `Bearer ${token}` },
          timeout: 10000
        };
        
        try {
          const response = await axios.get(`${API_BASE}/users/perfil`, config);
          
          addDebugLog('Dados do perfil recebidos:', 'success', {
            primeiro_login: response.data.primeiro_login,
            nome: response.data.nome
          });
          
          const primeiroLogin = response.data.primeiro_login === 1 || 
                               response.data.primeiro_login === '1' || 
                               response.data.primeiro_login === true;

          if (primeiroLogin) {
            addDebugLog('Primeiro login detectado, a mostrar modal', 'info');
            setShowPasswordModal(true);
            setLoading(false);
          } else {
            addDebugLog('Não é primeiro login, a carregar inscrições', 'info');
            await buscarInscricoes();
          }
        } catch (perfilError) {
          addDebugLog('Erro ao verificar perfil, a continuar para inscrições', 'warn', perfilError.message);
          await buscarInscricoes();
        }
        
        setInitialized(true);
        addDebugLog('Inicialização concluída com sucesso', 'success');
        
      } catch (error) {
        addDebugLog('Erro na inicialização geral:', 'error', error.message);
        await buscarInscricoes(); // Tentar carregar inscrições mesmo com erro
        setInitialized(true);
      }
    };

    initializeApp();
  }, []); // ✅ Sem dependências para executar apenas uma vez

  // ✅ Fechar modal de senha - memoizado
  const handleClosePasswordModal = useCallback(async () => {
    addDebugLog('Modal de senha fechado', 'info');
    setShowPasswordModal(false);
    await buscarInscricoes();
  }, [addDebugLog, buscarInscricoes]);

  // Animação do texto no banner
  useEffect(() => {
    let index = 0;
    let charIndex = 0;
    let state = "typing";
    let timeoutId;

    function animateText() {
      const current = texts[index];
      if (!textRef.current) return;

      if (state === "typing") {
        textRef.current.textContent = current.substring(0, charIndex + 1);
        charIndex++;
        if (charIndex === current.length) {
          state = "waitingAfterTyping";
          timeoutId = setTimeout(animateText, 1500);
        } else {
          timeoutId = setTimeout(animateText, 100);
        }
      } else if (state === "waitingAfterTyping") {
        state = "deleting";
        timeoutId = setTimeout(animateText, 100);
      } else if (state === "deleting") {
        textRef.current.textContent = current.substring(0, charIndex - 1);
        charIndex--;
        if (charIndex === 0) {
          index = (index + 1) % texts.length;
          state = "typing";
          timeoutId = setTimeout(animateText, 300);
        } else {
          timeoutId = setTimeout(animateText, 50);
        }
      }
    }

    animateText();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  // ✅ Função para obter URL da imagem - memoizada
  const getImageUrl = useCallback((inscricao) => {
    if (inscricao?.imagem_path) {
      return `${API_BASE}/${inscricao.imagem_path}`;
    }
    if (inscricao?.nomeCurso) {
      const nomeCursoSlug = inscricao.nomeCurso
        .toLowerCase()
        .replace(/ /g, "-")
        .replace(/[^\w-]+/g, "");
      return `${API_BASE}/uploads/cursos/${nomeCursoSlug}/capa.png`;
    }
    return fallbackCurso;
  }, []);

  // ✅ Navegação para curso - memoizada
  const redirecionarParaDetalheCurso = useCallback((cursoId) => {
    addDebugLog('Redirecionando para curso', 'info', { cursoId });
    navigate(`/cursos/${cursoId}`);
  }, [navigate, addDebugLog]);

  // ✅ Filtrar inscrições - memoizada
  const inscricoesFiltradas = React.useMemo(() => {
    if (filtroAtivo === 'ativos') {
      return inscricoes.filter(inscricao => {
        const status = inscricao.status?.toLowerCase() || 'agendado';
        return !['finalizado', 'cancelado', 'concluído', 'terminado', 'encerrado'].includes(status);
      });
    }
    return inscricoes;
  }, [inscricoes, filtroAtivo]);

  // Calcular totais para os botões
  const totalTodos = inscricoes.length;
  const totalAtivos = React.useMemo(() => {
    return inscricoes.filter(inscricao => {
      const status = inscricao.status?.toLowerCase() || 'agendado';
      return !['finalizado', 'cancelado', 'concluído', 'terminado', 'encerrado'].includes(status);
    }).length;
  }, [inscricoes]);


  return (
    <div className="home-container">
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

      <TrocarSenhaModal
        isOpen={showPasswordModal}
        onClose={handleClosePasswordModal}
        userId={userId}
      />

      {/* Banner principal */}
      <div className="banner">
        <img src={banner} alt="banner" />
        <div className="overlay-text">
          <div className="text-animation">
            <h1><span ref={textRef}></span><span className="cursor"></span></h1>
          </div>
          <p>Não vale a pena estar a inventar a roda ou a descobrir a pólvora!</p>
        </div>
      </div>

      <div className="content-container">
        {/* Secção de cursos inscritos */}
        <section className="cursos-section">
          <div className="section-header">
            <h2 className="section-title">Cursos Inscritos</h2>
            
            <div className="filtro-cursos">
              <button 
                className={`filtro-btn ${filtroAtivo === 'todos' ? 'ativo' : ''}`}
                onClick={() => setFiltroAtivo('todos')}
              >
                Todos ({totalTodos})
              </button>
              <button 
                className={`filtro-btn ${filtroAtivo === 'ativos' ? 'ativo' : ''}`}
                onClick={() => setFiltroAtivo('ativos')}
              >
                Ativos ({totalAtivos})
              </button>
            </div>
          </div>

          {loading ? (
            <div className="loading" style={{
              textAlign: 'center',
              padding: '40px',
              fontSize: '16px'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                border: '4px solid #f3f3f3',
                borderTop: '4px solid #3498db',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 15px'
              }}></div>
              A carregar cursos inscritos...
            </div>
          ) : error ? (
            <div style={{
              backgroundColor: '#ffebee',
              border: '1px solid #e57373',
              borderRadius: '8px',
              padding: '20px',
              margin: '20px 0',
              textAlign: 'center'
            }}>
              <h3>⚠️ Erro ao carregar cursos</h3>
              <p>{error}</p>
              <button 
                onClick={() => {
                  addDebugLog('Botão "Tentar Novamente" clicado', 'info');
                  buscarInscricoes();
                }}
                style={{
                  backgroundColor: '#3498db',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  marginTop: '10px'
                }}
              >
                🔄 Tentar Novamente
              </button>
            </div>
          ) : inscricoesFiltradas.length > 0 ? (
            <div className="cursos-grid">
              {inscricoesFiltradas.map((inscricao, index) => {
                const cursoId = inscricao.cursoId || inscricao.id_curso || inscricao.id;
                const nomeCurso = inscricao.nomeCurso || inscricao.curso?.nome || 'Curso sem nome';
                const categoria = inscricao.categoria || inscricao.curso?.categoria?.nome || 'Sem categoria';
                const area = inscricao.area || inscricao.curso?.area?.nome || 'Sem área';
                const status = inscricao.status || inscricao.estado_inscricao || 'Agendado';
                
                return (
                  <div
                    key={`${cursoId}-${index}`}
                    className="cartao-curso"
                    onClick={() => redirecionarParaDetalheCurso(cursoId)}
                  >
                    <div className="curso-imagem-container">
                      <img
                        src={getImageUrl(inscricao)}
                        alt={nomeCurso}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = fallbackCurso;
                        }}
                      />
                    </div>
                    <div className="curso-info">
                      <p className="curso-titulo">{nomeCurso}</p>
                      <p className="curso-detalhe">Categoria: {categoria}</p>
                      <p className="curso-detalhe">Área: {area}</p>
                      <div className={`estado-curso status-${status.toLowerCase().replace(/\s+/g, '-')}`}>
                        {status}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '40px 20px',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              margin: '20px 0'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '20px' }}>📚</div>
              <h3>Nenhum curso encontrado</h3>
              <p>
                {filtroAtivo === 'ativos' 
                  ? 'Não possui cursos ativos no momento.' 
                  : 'Não está inscrito em nenhum curso.'
                }
              </p>
              <button
                onClick={() => navigate('/cursos')}
                style={{
                  backgroundColor: '#3498db',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  marginTop: '20px',
                  fontSize: '16px'
                }}
              >
                🔍 Explorar Cursos Disponíveis
              </button>
            </div>
          )}
        </section>

        {/* Secção de cursos sugeridos */}
        <section className="cursos-section">
          <h2 className="section-title">Cursos Sugeridos</h2>
          <div className="cursos-grid">
            <CursosSugeridos />
          </div>
        </section>
      </div>


      {/* CSS para spinner */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}