import React, { useState, useEffect, useRef, useMemo, memo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';
import API_BASE, { IMAGES } from '../../api';
import Sidebar from '../../components/Sidebar';
import './css/Chat_Conversas.css';
import CriarTemaModal from '../../components/forum/Criar_Tema_Modal';

// Cache de avatares no escopo do módulo para evitar múltiplas solicitações
const avatarCache = new Map();

// Componente de tema memorizado para evitar renderizações desnecessárias
const TemaCard = memo(({ 
  tema, 
  denunciarTema, 
  avaliarTema, 
  navegarParaTema, 
  avaliacoes, 
  formatarData,
  renderAnexo,
  utilizador,
  apagarTema
}) => {
  const temaId = tema.id_tema;
  
  // Função para obter URL do avatar com cache
  const getAvatarUrl = (utilizadorDados) => {
    if (!utilizadorDados?.foto_perfil) return IMAGES.DEFAULT_AVATAR;
    
    const userId = utilizadorDados.id_utilizador;
    const cacheKey = `${userId}-${utilizadorDados.foto_perfil}`;
    
    // Verificar cache
    if (avatarCache.has(cacheKey)) {
      return avatarCache.get(cacheKey);
    }
    
    // Criar URL com timestamp único fixo (não regenerado a cada render)
    let url = utilizadorDados.foto_perfil;
    if (!url.startsWith('http') && !url.startsWith('/')) {
      url = `/${url}`;
    }
    
    if (url.startsWith('/')) {
      url = `${API_BASE.split('/api')[0]}${url}`;
    }
    
    // Adicionar timestamp apenas uma vez para evitar cache do navegador
    const timestamp = Date.now();
    url = `${url}?t=${timestamp}`;
    
    // Armazenar no cache
    avatarCache.set(cacheKey, url);
    return url;
  };

  // Memorizar a URL do avatar para evitar recalcular a cada renderização
  const avatarUrl = useMemo(() => 
    getAvatarUrl(tema.utilizador), 
    [tema.utilizador?.id_utilizador, tema.utilizador?.foto_perfil]
  );

  // Verificar se o utilizador pode apagar o tema (admin ou criador)
  const podeApagarTema = () => {
    if (!utilizador) return false;
    // Admin (id_cargo === 1) ou criador do tema
    return utilizador.id_cargo === 1 || utilizador.id_utilizador === tema.utilizador?.id_utilizador;
  };

  return (
    <div
      className={`tema-card ${tema.foi_denunciado ? 'tema-denunciado' : ''}`}
      onClick={() => navegarParaTema(temaId)}
    >
      {/* Botão de apagar no canto superior direito */}
      {podeApagarTema() && (
        <button
          className="apagar-tema-btn"
          onClick={(e) => {
            e.stopPropagation();
            apagarTema(temaId);
          }}
          title="Apagar tema"
        >
          <i className="fas fa-trash"></i>
        </button>
      )}

      <div className="tema-header">
        <div className="tema-autor">
          <img
            src={avatarUrl}
            alt="Avatar"
            className="avatar"
            onError={(e) => {
              e.target.src = IMAGES.DEFAULT_AVATAR;
              // Evitar loop de erros
              e.target.onerror = null;
            }}
          />
          <div className="autor-info">
            <span className="nome-utilizador">{tema.utilizador?.nome || 'Utilizador'}</span>
            <span className="data-tema">{formatarData(tema.data_criacao)}</span>
          </div>
        </div>
      </div>

      <div className="tema-conteudo">
        {tema.titulo && <h3 className="tema-titulo">{tema.titulo}</h3>}
        <p className="tema-texto">{tema.texto}</p>
        {renderAnexo(tema)}
      </div>

      <div className="tema-acoes" onClick={(e) => e.stopPropagation()}>
        <div className="acoes-esquerda">
          <button
            className={`acao-btn ${avaliacoes[temaId] === 'like' ? 'active' : ''}`}
            onClick={() => avaliarTema(temaId, 'like')}
            title="Curtir"
          >
            <i className="fas fa-thumbs-up"></i>
            <span>{tema.likes || 0}</span>
          </button>

          <button
            className={`acao-btn ${avaliacoes[temaId] === 'dislike' ? 'active' : ''}`}
            onClick={() => avaliarTema(temaId, 'dislike')}
            title="Descurtir"
          >
            <i className="fas fa-thumbs-down"></i>
            <span>{tema.dislikes || 0}</span>
          </button>
        </div>

        <div className="acoes-centro">
          <button
            className="comentar-btn"
            onClick={(e) => {
              e.stopPropagation();
              navegarParaTema(temaId);
            }}
          >
            <i className="fas fa-comment"></i>
            <span>Comentários ({tema.comentarios || 0})</span>
          </button>
        </div>

        <div className="acoes-direita">
          <button
            className="denunciar-btn"
            onClick={(e) => {
              e.stopPropagation();
              denunciarTema(temaId);
            }}
            disabled={tema.foi_denunciado}
            title={tema.foi_denunciado ? "Já denunciado" : "Denunciar"}
          >
            <i className="fas fa-flag"></i>
            {tema.foi_denunciado && <span className="denuncia-badge">!</span>}
          </button>
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Otimização: comparação personalizada para evitar re-renderizações desnecessárias
  return (
    prevProps.tema.id_tema === nextProps.tema.id_tema &&
    prevProps.tema.foi_denunciado === nextProps.tema.foi_denunciado &&
    prevProps.tema.likes === nextProps.tema.likes &&
    prevProps.tema.dislikes === nextProps.tema.dislikes &&
    prevProps.avaliacoes[prevProps.tema.id_tema] === nextProps.avaliacoes[nextProps.tema.id_tema] &&
    prevProps.utilizador?.id_utilizador === nextProps.utilizador?.id_utilizador &&
    prevProps.utilizador?.id_cargo === nextProps.utilizador?.id_cargo
  );
});

const Chat_Conversas = () => {
  const { topicoId } = useParams();
  const navigate = useNavigate();
  const [topico, setTopico] = useState(null);
  const [temas, setTemas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('recentes'); // 'recentes', 'likes', 'dislikes', 'comentarios'
  const [showCriarTema, setShowCriarTema] = useState(false);
  const [utilizador, setUtilizador] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [erro, setErro] = useState(null);
  const [avaliacoes, setAvaliacoes] = useState({});
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const socketRef = useRef();
  const [temasDenunciados, setTemasDenunciados] = useState([]);
  const dataCarregadaRef = useRef(false); // Referência para controlar carregamentos duplicados

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // Função de debug para log consistente
  const logInfo = (message, data) => {
    console.log(`[ChatConversas] ${message}`, data || '');
  };

  useEffect(() => {
    const token = localStorage.getItem('token');

    logInfo(`A iniciar carregamento para tópico ID: ${topicoId}`);

    // Inicializar socket
    try {
      logInfo('A inicializar socket.io');
      socketRef.current = io(`${API_BASE.split('/api')[0]}`, {
        query: { token },
        path: '/socket.io',
        transports: ['websocket', 'polling']
      });

      // Registrar no canal do tópico para receber atualizações
      socketRef.current.emit('joinTopic', topicoId);
      logInfo(`Registado no canal do tópico: ${topicoId}`);

      // Configurar eventos do socket
      socketRef.current.on('novoTema', (tema) => {
        logInfo('Novo tema recebido via socket:', tema);
        setTemas(prev => [tema, ...prev]);
      });

      socketRef.current.on('temaAvaliado', (data) => {
        logInfo('Tema avaliado via socket:', data);
        atualizarAvaliacaoTema(data);
      });

      socketRef.current.on('temaExcluido', (data) => {
        logInfo('Tema excluído via socket:', data);
        setTemas(prev => prev.filter(t => (t.id_tema !== data.id_tema)));
      });

      // Tratar desconexões
      socketRef.current.on('connect_error', (error) => {
        logInfo('Erro na conexão socket:', error.message);
      });

    } catch (error) {
      logInfo('Erro ao inicializar socket:', error.message);
    }

    // Evitar carregamento duplicado dos dados
    if (!dataCarregadaRef.current) {
      dataCarregadaRef.current = true;
      
      const fetchDados = async () => {
        try {
          // Carregar em paralelo para melhor desempenho
          const [utilizadorResponse, topicoResponse, temasResponse, denunciasResponse] = await Promise.all([
            // Obter dados do utilizador atual
            axios.get(`${API_BASE}/users/perfil`, {
              headers: { Authorization: `Bearer ${token}` }
            }),
            
            // Obter dados do tópico
            axios.get(`${API_BASE}/topicos-area/${topicoId}`, {
              headers: { Authorization: `Bearer ${token}` }
            }),
            
            // Obter temas existentes
            axios.get(`${API_BASE}/forum-tema/topico/${topicoId}/temas`, {
              params: { filtro, page: pagina, limit: 10 },
              headers: { Authorization: `Bearer ${token}` }
            }),
            
            // Obter temas já denunciados pelo utilizador
            axios.get(`${API_BASE}/denuncias/usuario/denuncias-temas`, {
              headers: { Authorization: `Bearer ${token}` }
            })
          ]);
          
          // Processar resultados
          setUtilizador(utilizadorResponse.data);
          logInfo('Dados do utilizador obtidos com sucesso', utilizadorResponse.data);
          
          if (topicoResponse.data && topicoResponse.data.data) {
            setTopico(topicoResponse.data.data);
            logInfo('Tópico definido com sucesso', topicoResponse.data.data);
          }
          
          if (temasResponse.data && temasResponse.data.data) {
            const temasData = temasResponse.data.data;
            if (temasResponse.data.pagination) {
              setTotalPaginas(temasResponse.data.pagination.totalPages);
            }
            logInfo(`Obtidos ${temasData.length} temas`);
            
            // Obter temas denunciados
            if (denunciasResponse.data && denunciasResponse.data.data) {
              const temasDenunciadosData = denunciasResponse.data.data;
              setTemasDenunciados(temasDenunciadosData);
              logInfo(`Encontrados ${temasDenunciadosData.length} temas já denunciados pelo utilizador`);
              
              // Aplicar marcação de denúncias aos temas
              const temasComDenuncias = temasData.map(tema => ({
                ...tema,
                foi_denunciado: temasDenunciadosData.includes(tema.id_tema)
              }));
              
              setTemas(temasComDenuncias);
            } else {
              setTemas(temasData);
            }
          } else {
            setTemas([]);
            logInfo('Nenhum tema encontrado');
          }
          
        } catch (error) {
          logInfo('Erro ao carregar dados:', error.message);
          setErro(`Erro ao carregar dados: ${error.message}`);
        } finally {
          setLoading(false);
        }
      };
      
      fetchDados();
    }

    // Limpar socket ao desmontar
    return () => {
      if (socketRef.current) {
        socketRef.current.emit('leaveTopic', topicoId);
        socketRef.current.disconnect();
        logInfo('Socket desconectado');
      }
      
      // Resetar flag para recarregar dados se o componente for remontado
      dataCarregadaRef.current = false;
    };
  }, [topicoId, filtro, pagina]);

  // Efeito para sincronizar estado quando filtro ou página mudar
  useEffect(() => {
    if (dataCarregadaRef.current) {
      dataCarregadaRef.current = false; // Força recarregar dados
      setLoading(true);
    }
  }, [filtro, pagina]);

  // Função para atualizar avaliação de um tema recebida via websocket
  const atualizarAvaliacaoTema = (data) => {
    const { id_tema, likes, dislikes } = data;

    setTemas(prev => prev.map(tema => {
      if (tema.id_tema === id_tema) {
        return {
          ...tema,
          likes,
          dislikes
        };
      }
      return tema;
    }));
  };

  // Formatar data para exibição
  const formatarData = (dataString) => {
    if (!dataString) return 'Data indisponível';

    try {
      const data = new Date(dataString);
      return data.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      return 'Data inválida';
    }
  };

  // Função para avaliar um tema (like/dislike)
  const avaliarTema = async (temaId, tipo) => {
    try {
      logInfo(`A avaliar tema ${temaId} como ${tipo}`);
      const token = localStorage.getItem('token');

      // Atualizar estado local para feedback imediato
      setTemas(prevTemas => prevTemas.map(tema => {
        if (tema.id_tema === temaId) {
          // Verificar se o utilizador já avaliou este tema (toggle)
          const jaAvaliado = avaliacoes[temaId] === tipo;

          // Atualizar o estado de avaliações
          const novasAvaliacoes = { ...avaliacoes };

          if (jaAvaliado) {
            // Remover avaliação (toggle off)
            delete novasAvaliacoes[temaId];
            setAvaliacoes(novasAvaliacoes);

            return {
              ...tema,
              likes: tipo === 'like' ? Math.max(0, tema.likes - 1) : tema.likes,
              dislikes: tipo === 'dislike' ? Math.max(0, tema.dislikes - 1) : tema.dislikes
            };
          } else {
            // Adicionar nova avaliação ou trocar tipo
            const tipoAnterior = avaliacoes[temaId];
            novasAvaliacoes[temaId] = tipo;
            setAvaliacoes(novasAvaliacoes);

            return {
              ...tema,
              likes: tipo === 'like'
                ? tema.likes + 1
                : (tipoAnterior === 'like' ? Math.max(0, tema.likes - 1) : tema.likes),
              dislikes: tipo === 'dislike'
                ? tema.dislikes + 1
                : (tipoAnterior === 'dislike' ? Math.max(0, tema.dislikes - 1) : tema.dislikes)
            };
          }
        }
        return tema;
      }));

      // Fazer a requisição para o servidor
      const response = await axios.post(
  `${API_BASE}/forum-tema/tema/${temaId}/avaliar`,
  { tipo },
  { headers: { Authorization: `Bearer ${token}` } }
);

      logInfo('Avaliação enviada com sucesso', response.data);

      // Atualiza com dados do servidor se necessário
      if (response.data && response.data.data) {
        atualizarAvaliacaoTema(response.data.data);
      }
    } catch (error) {
      logInfo('Erro ao avaliar tema:', error.message);
      alert(`Erro ao avaliar tema: ${error.message}`);
    }
  };

  // Função para apagar um tema
  const apagarTema = async (temaId) => {
    const confirmacao = window.confirm('Tem certeza de que deseja apagar este tema? Esta ação não pode ser desfeita.');
    if (!confirmacao) return;

    try {
      logInfo(`A apagar tema ${temaId}`);
      const token = localStorage.getItem('token');

      const response = await axios.delete(
        `${API_BASE}/forum-tema/tema/${temaId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      logInfo('Tema apagado com sucesso', response.data);

      // Remover o tema da lista local
      setTemas(prevTemas => prevTemas.filter(tema => tema.id_tema !== temaId));

      alert('Tema apagado com sucesso!');
    } catch (error) {
      logInfo('Erro ao apagar tema:', error.message);
      console.error('Detalhes do erro:', error.response);
      alert(`Erro ao apagar tema: ${error.response?.data?.message || error.message}`);
    }
  };

  // Função para denunciar um tema
  const denunciarTema = async (temaId) => {
    // Verificar se o tema já foi denunciado por este utilizador
    if (temasDenunciados.includes(temaId)) {
      alert('Já denunciou este tema anteriormente.');
      return;
    }

    const motivo = prompt('Por favor, informe o motivo da denúncia:');
    if (!motivo) return;

    try {
      logInfo(`A denunciar tema ${temaId}`);
      const token = localStorage.getItem('token');

      // Atualizar estados locais IMEDIATAMENTE para feedback visual instantâneo
      setTemasDenunciados(prev => [...prev, temaId]);
      
      // Atualizar o estado do tema para refletir visualmente a denúncia
      setTemas(prevTemas => prevTemas.map(tema => {
        if (tema.id_tema === temaId) {
          return {
            ...tema,
            foi_denunciado: true
          };
        }
        return tema;
      }));

      // Enviar a denúncia para o servidor
      const response = await axios.post(
        `${API_BASE}/denuncias/forum-tema/denunciar`,
        {
          id_tema: temaId,
          motivo
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      logInfo('Denúncia enviada com sucesso', response.data);
      alert('Tema denunciado com sucesso. Obrigado pela sua contribuição.');
    } catch (error) {
      // Se ocorrer um erro, reverter as alterações de estado locais
      setTemasDenunciados(prev => prev.filter(id => id !== temaId));
      setTemas(prevTemas => prevTemas.map(tema => {
        if (tema.id_tema === temaId) {
          return {
            ...tema,
            foi_denunciado: false
          };
        }
        return tema;
      }));
      
      logInfo('Erro ao denunciar tema:', error.message);
      alert(`Erro ao denunciar tema: ${error.message}`);
    }
  };

  // Função para redirecionar para o chat do tema
  const navegarParaTema = (temaId) => {
    logInfo(`A navegar para o chat do tema ${temaId}`);
    navigate(`/forum/topico/${topicoId}/tema/${temaId}`);
  };

  // Função chamada após a criação bem-sucedida de um tema
  const handleTemaCriado = (novoTema) => {
    logInfo('Tema criado com sucesso', novoTema);
    setTemas([novoTema, ...temas]);
    setShowCriarTema(false);
  };

  // Renderizar conteúdo do anexo - Memoizado para evitar recálculos
  const renderAnexo = useMemo(() => {
    return (tema) => {
      if (!tema.anexo_url) return null;
  
      // Normalizar URL do anexo
      let anexoUrl = tema.anexo_url;
      if (!anexoUrl.startsWith('http') && !anexoUrl.startsWith('/')) {
        anexoUrl = `/${anexoUrl}`;
      }
  
      if (anexoUrl.startsWith('/')) {
        anexoUrl = `${API_BASE.split('/api')[0]}${anexoUrl}`;
      }
  
      const anexoKey = `anexo-${tema.id_tema || 'unknown'}`;
  
      if (tema.tipo_anexo === 'imagem') {
        return (
          <div className="tema-imagem" key={anexoKey}>
            <img
              src={anexoUrl}
              alt="Anexo"
              className="tema-img"
              onClick={(e) => {
                e.stopPropagation();
                window.open(anexoUrl, '_blank');
              }}
              onError={(e) => {
                e.target.src = IMAGES.DEFAULT_AVATAR;
                e.target.onerror = null;
              }}
            />
          </div>
        );
      } else if (tema.tipo_anexo === 'video') {
        return (
          <div className="tema-video" key={anexoKey} onClick={(e) => e.stopPropagation()}>
            <video controls>
              <source src={anexoUrl} type="video/mp4" />
              Seu navegador não suporta vídeos.
            </video>
          </div>
        );
      } else {
        return (
          <div
            className="tema-arquivo"
            key={anexoKey}
            onClick={(e) => {
              e.stopPropagation();
              window.open(anexoUrl, '_blank');
            }}
          >
            <i className="fas fa-file"></i>
            <span>{tema.anexo_nome || 'Arquivo'}</span>
          </div>
        );
      }
    };
  }, [API_BASE]);  // Dependências mínimas

  // Renderizar estado de erro
  if (erro && !loading) {
    return (
      <div className="chat-conversas-container">
        <div className="main-content">
          <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
          <div className="erro-container">
            <h2>Ocorreu um erro</h2>
            <p>{erro}</p>
            <button
              className="botao-voltar"
              onClick={() => navigate('/forum')}
            >
              <i className="fas fa-arrow-left"></i> Voltar ao Fórum
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Renderizar estado de carregamento
  if (loading) {
    return (
      <div className="chat-conversas-container">
        <div className="main-content">
          <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
          <div className="loading-container">
            <div className="loading">A carregar tópico...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-conversas-container">
      <button className="botao-voltar" onClick={() => navigate('/forum')}>
        <i className="fas fa-arrow-left"></i>
      </button>

      <div className="main-content">
        <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

        <div className="temas-content">

          {topico && (
            <div className="topico-header">
              <span className="categoria-label">Categoria: {topico.categoria?.nome || 'Não disponível'}</span>

              <div className="topico-center">
                <h2 className="topico-titulo">{topico.titulo}</h2>
                <p className="topico-description">{topico.descricao}</p>
              </div>

              <div className="topico-info">
                <span className="data-criacao">Data: {formatarData(topico.data_criacao)}</span>
              </div>
            </div>
          )}

          {/* Filtros e botão criar tema */}
          <div className="filtros-container">
            <div className="filtros-grupo-esquerda">
              <button
                className={`filtro-btn ${filtro === 'recentes' ? 'active' : ''}`}
                onClick={() => { setFiltro('recentes'); setPagina(1); }}
              >
                Recentes
              </button>
              <button
                className={`filtro-btn ${filtro === 'likes' ? 'active' : ''}`}
                onClick={() => { setFiltro('likes'); setPagina(1); }}
              >
                Likes
              </button>
              <button
                className={`filtro-btn ${filtro === 'dislikes' ? 'active' : ''}`}
                onClick={() => { setFiltro('dislikes'); setPagina(1); }}
              >
                Deslikes
              </button>
              <button
                className={`filtro-btn ${filtro === 'comentarios' ? 'active' : ''}`}
                onClick={() => { setFiltro('comentarios'); setPagina(1); }}
              >
                Mais Comentados
              </button>
            </div>

            <div className="filtros-grupo-direita">
              <button
                className="criar-tema-btn"
                onClick={() => setShowCriarTema(true)}
              >
                <i className="fas fa-plus"></i> Criar Tema
              </button>
            </div>
          </div>

          <div className="temas-lista">
            {temas.length === 0 ? (
              <div className="sem-temas">
                <p>Ainda não existem temas neste tópico.</p>
                <p>Seja o primeiro a criar um tema!</p>
              </div>
            ) : (
              temas.map(tema => (
                <TemaCard
                  key={`tema-${tema.id_tema}`}
                  tema={tema}
                  denunciarTema={denunciarTema}
                  avaliarTema={avaliarTema}
                  navegarParaTema={navegarParaTema}
                  avaliacoes={avaliacoes}
                  formatarData={formatarData}
                  renderAnexo={renderAnexo}
                  utilizador={utilizador}
                  apagarTema={apagarTema}
                />
              ))
            )}
          </div>

          {/* Paginação */}
          {totalPaginas > 1 && (
            <div className="paginacao">
              <button
                onClick={() => setPagina(Math.max(1, pagina - 1))}
                disabled={pagina === 1}
                className="paginacao-btn"
              >
                <i className="fas fa-chevron-left"></i>
              </button>
              <span className="pagina-info">Página {pagina} de {totalPaginas}</span>
              <button
                onClick={() => setPagina(Math.min(totalPaginas, pagina + 1))}
                disabled={pagina === totalPaginas}
                className="paginacao-btn"
              >
                <i className="fas fa-chevron-right"></i>
              </button>
            </div>
          )}
        </div>
      </div>

      {showCriarTema && (
        <CriarTemaModal
          topicoId={topicoId}
          onClose={() => setShowCriarTema(false)}
          onSuccess={handleTemaCriado}
        />
      )}
    </div>
  );
};

export default Chat_Conversas;