import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';
import './css/Topicos_Chat.css';
import API_BASE, { IMAGES } from '../../api';
import Sidebar from '../Sidebar';

/**
 * Componente responsável por renderizar imagens de forma segura na aplicação
 * Gere URLs automaticamente e trata erros de carregamento para evitar imagens quebradas
 */
const ImageComponent = ({ src, alt = 'Imagem', className = '', onClick, apiBase }) => {
  const [hasError, setHasError] = useState(false);

  /**
   * Normaliza URLs de imagens para garantir caminhos absolutos válidos
   * Trata URLs completas, caminhos absolutos e relativos de forma inteligente
   */
  const normalizeUrl = (url) => {
    if (!url) return IMAGES.DEFAULT_AVATAR;
    if (url.startsWith('http')) return url;
    if (url.startsWith('/')) return `${apiBase.split('/api')[0]}${url}`;
    return `${apiBase.split('/api')[0]}/${url}`;
  };

  return (
    <img
      src={hasError ? IMAGES.DEFAULT_AVATAR : normalizeUrl(src)}
      alt={alt}
      className={className}
      onClick={onClick}
      onError={() => setHasError(true)}
    />
  );
};

/**
 * Componente principal do sistema de chat de tópicos do fórum
 * 
 * Funcionalidades principais:
 * - Visualização de temas e comentários em tempo real
 * - Sistema completo de comentários com anexos multimedia
 * - Avaliações através de likes e dislikes com sincronização servidor
 * - Sistema de denúncias para moderação de conteúdo
 * - Comunicação bidirecional via Socket.IO
 * - Interface responsiva com scroll inteligente
 */
const Topicos_Chat = () => {
  const { topicoId, temaId } = useParams();
  const navigate = useNavigate();
  
  // Estados principais para gestão de dados do servidor
  const [comentarios, setComentarios] = useState([]);
  const [novoComentario, setNovoComentario] = useState('');
  const [topico, setTopico] = useState(null);
  const [tema, setTema] = useState(null);
  const [usuario, setUsuario] = useState(null);
  
  // Estados para controlo da interface e experiência do utilizador
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [erro, setErro] = useState(null);
  
  // Estados para gestão de anexos de ficheiros
  const [anexoTipo, setAnexoTipo] = useState(null);
  const [anexoFile, setAnexoFile] = useState(null);
  const [anexoPreview, setAnexoPreview] = useState('');
  
  // Estado para rastreamento das avaliações do utilizador atual
  const [avaliacoes, setAvaliacoes] = useState({});

  // Referências para elementos DOM e conexões externas
  const socketRef = useRef();
  const fileInputRef = useRef(null);
  const inputAreaRef = useRef(null);

  /**
   * Função melhorada para scroll suave até ao final da conversa
   * Garante que a última mensagem fica visível acima da área de input
   */
  const irParaFinal = () => {
    const alturaTotal = Math.max(
      document.body.scrollHeight,
      document.body.offsetHeight,
      document.documentElement.clientHeight,
      document.documentElement.scrollHeight,
      document.documentElement.offsetHeight
    );

    window.scrollTo({
      top: alturaTotal + 200,
      behavior: 'smooth'
    });

    setTimeout(() => {
      window.scrollTo({
        top: document.documentElement.scrollHeight + 100,
        behavior: 'smooth'
      });
    }, 150);
  };

  /**
   * Controla a visibilidade da barra lateral
   */
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  /**
   * Sistema inteligente de scroll automático para novos comentários
   * Apenas funciona quando o utilizador está próximo do final da página
   */
  useEffect(() => {
    const isNearBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 400;
    
    if (isNearBottom && comentarios.length > 0) {
      setTimeout(() => {
        irParaFinal();
      }, 200);
    }
  }, [comentarios]);

  /**
   * Carrega as avaliações existentes do utilizador para todos os comentários
   * Permite mostrar o estado correto dos botões de like/dislike
   */
  const carregarAvaliacoesUtilizador = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token || !usuario) return;

      // Criar um objeto com as avaliações do utilizador
      const avaliacoesUtilizador = {};
      
      // Para cada comentário, verificar se o utilizador já avaliou
      for (const comentario of comentarios) {
        try {
          const response = await axios.get(
            `${API_BASE}/forum-tema/comentario/${comentario.id_comentario}/avaliacao-status`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          
          if (response.data && response.data.data && response.data.data.avaliado) {
            avaliacoesUtilizador[comentario.id_comentario] = response.data.data.tipo;
          }
        } catch (error) {
          // Se não conseguir carregar, assume que não avaliou
        }
      }
      
      setAvaliacoes(avaliacoesUtilizador);
    } catch (error) {
      // Falha silenciosa - não afeta funcionamento principal
    }
  };

  /**
   * Hook principal de inicialização do componente
   * Carrega todos os dados necessários e configura conexões WebSocket
   */
  useEffect(() => {
    const token = localStorage.getItem('token');

    /**
     * Carrega perfil completo do utilizador autenticado
     * Necessário para identificação em comentários e avaliações
     */
    const fetchUsuario = async () => {
      try {
        const response = await axios.get(`${API_BASE}/users/perfil`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUsuario(response.data);
      } catch (error) {
        setErro('Erro ao carregar perfil do utilizador');
      }
    };

    /**
     * Carrega dados completos do tópico selecionado
     * Valida estrutura da resposta para garantir integridade dos dados
     */
    const fetchTopico = async () => {
      try {
        const response = await axios.get(`${API_BASE}/topicos-area/${topicoId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data && response.data.data) {
          setTopico(response.data.data);
        } else {
          throw new Error('Estrutura de dados do tópico inválida');
        }
      } catch (error) {
        setErro(`Erro ao carregar tópico: ${error.message}`);
      }
    };

    /**
     * Carrega informações detalhadas do tema do fórum
     * Inclui metadados, estatísticas e anexos originais do tema
     */
    const fetchTema = async () => {
      try {
        const response = await axios.get(`${API_BASE}/forum-tema/tema/${temaId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data && response.data.data) {
          setTema(response.data.data);
        } else {
          throw new Error('Estrutura de dados do tema inválida');
        }
      } catch (error) {
        setErro(`Erro ao carregar tema: ${error.message}`);
      }
    };

    /**
     * Carrega histórico completo de comentários do tema
     * Ordena cronologicamente para apresentação adequada na interface
     */
    const fetchComentarios = async () => {
      try {
        const response = await axios.get(`${API_BASE}/forum-tema/tema/${temaId}/comentarios`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data && response.data.data) {
          setComentarios(response.data.data);
        } else {
          setComentarios([]);
        }

        setLoading(false);
      } catch (error) {
        setErro(`Erro ao carregar comentários: ${error.message}`);
        setLoading(false);
      }
    };

    /**
     * Configuração da conexão Socket.IO para atualizações em tempo real
     * Gere entrada/saída de canais e eventos de novos comentários
     */
    try {
      socketRef.current = io(`${API_BASE.split('/api')[0]}`, {
        query: { token },
        path: '/socket.io',
        transports: ['websocket', 'polling']
      });

      // Junta-se ao canal específico do tema atual
      socketRef.current.emit('joinTema', temaId);

      // Escuta chegada de novos comentários de outros utilizadores
      socketRef.current.on('novoComentario', (comentario) => {
        setComentarios(prev => [...prev, comentario]);
      });

      // Escuta atualizações de avaliações em tempo real
      socketRef.current.on('comentarioAvaliado', (dadosAvaliacao) => {
        setComentarios(prev => prev.map(comentario => {
          if (comentario.id_comentario === dadosAvaliacao.id_comentario) {
            return {
              ...comentario,
              likes: dadosAvaliacao.likes,
              dislikes: dadosAvaliacao.dislikes
            };
          }
          return comentario;
        }));
      });

    } catch (error) {
      // Falha silenciosa - aplicação funciona sem WebSocket
    }

    // Executa carregamento sequencial de todos os dados necessários
    const carregarDados = async () => {
      await fetchUsuario();
      await fetchTopico();
      await fetchTema();
      await fetchComentarios();
    };

    carregarDados();

    // Limpeza da conexão WebSocket ao desmontar o componente
    return () => {
      if (socketRef.current) {
        socketRef.current.emit('leaveTema', temaId);
        socketRef.current.disconnect();
      }
    };
  }, [topicoId, temaId, navigate]);

  /**
   * Carrega avaliações do utilizador após os comentários serem carregados
   */
  useEffect(() => {
    if (comentarios.length > 0 && usuario) {
      carregarAvaliacoesUtilizador();
    }
  }, [comentarios, usuario]);

  /**
   * Processa ficheiro selecionado pelo utilizador para anexo
   * Determina automaticamente o tipo e gera preview quando aplicável
   */
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileType = file.type.split('/')[0];
    setAnexoFile(file);

    if (fileType === 'image') {
      setAnexoTipo('imagem');
      const reader = new FileReader();
      reader.onload = (e) => setAnexoPreview(e.target.result);
      reader.readAsDataURL(file);
    } else if (fileType === 'video') {
      setAnexoTipo('video');
      const reader = new FileReader();
      reader.onload = (e) => setAnexoPreview(e.target.result);
      reader.readAsDataURL(file);
    } else {
      setAnexoTipo('file');
      setAnexoPreview(file.name);
    }
  };

  /**
   * Remove anexo selecionado e limpa todos os previews
   */
  const cancelarAnexo = () => {
    setAnexoTipo(null);
    setAnexoFile(null);
    setAnexoPreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  /**
   * Envia novo comentário para o servidor com suporte a anexos
   * Suporta texto puro e/ou anexos de ficheiros diversos
   */
  const enviarComentario = async () => {
    if ((!novoComentario.trim() && !anexoFile) || !usuario) {
      alert('É necessário escrever algo ou anexar um ficheiro para comentar');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();

      formData.append('texto', novoComentario);
      if (anexoFile) {
        formData.append('anexo', anexoFile);
      }

      const response = await axios.post(`${API_BASE}/forum-tema/tema/${temaId}/comentario`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      // Sistema de fallback caso o WebSocket não esteja funcional
      if (!socketRef.current || !socketRef.current.connected) {
        if (response.data && response.data.data) {
          setComentarios(prev => [...prev, response.data.data]);
        }
      }

      // Limpa todos os campos após envio bem-sucedido
      setNovoComentario('');
      cancelarAnexo();
    } catch (error) {
      setErro(`Falha ao enviar comentário: ${error.message}`);
      alert('Não foi possível enviar o comentário. Tenta novamente.');
    }
  };

  /**
   * Sistema completo de avaliação de comentários com likes e dislikes
   * Implementa toggle inteligente e atualização otimista da interface
   * ENDPOINT CORRIGIDO: Utiliza a rota correta do forum-tema
   */
  const avaliarComentario = async (idComentario, tipo) => {
    try {
      const token = localStorage.getItem('token');

      // Atualização otimista da interface para resposta imediata
      const avaliacaoAnterior = avaliacoes[idComentario];
      const jaAvaliado = avaliacaoAnterior === tipo;
      
      // Atualizar estado local das avaliações
      let novasAvaliacoes = { ...avaliacoes };
      if (jaAvaliado) {
        // Remove avaliação (toggle)
        delete novasAvaliacoes[idComentario];
      } else {
        // Adiciona ou altera avaliação
        novasAvaliacoes[idComentario] = tipo;
      }
      setAvaliacoes(novasAvaliacoes);

      // Atualizar contadores na interface otimisticamente
      setComentarios(prev => prev.map(comentario => {
        if (comentario.id_comentario === idComentario) {
          if (jaAvaliado) {
            // Remove avaliação
            return {
              ...comentario,
              likes: tipo === 'like' ? Math.max(0, comentario.likes - 1) : comentario.likes,
              dislikes: tipo === 'dislike' ? Math.max(0, comentario.dislikes - 1) : comentario.dislikes
            };
          } else {
            // Adiciona nova avaliação ou troca tipo
            return {
              ...comentario,
              likes: tipo === 'like'
                ? comentario.likes + 1
                : (avaliacaoAnterior === 'like' ? Math.max(0, comentario.likes - 1) : comentario.likes),
              dislikes: tipo === 'dislike'
                ? comentario.dislikes + 1
                : (avaliacaoAnterior === 'dislike' ? Math.max(0, comentario.dislikes - 1) : comentario.dislikes)
            };
          }
        }
        return comentario;
      }));

      // Sincronização com servidor utilizando endpoint correto
      const response = await axios.post(
        `${API_BASE}/forum-tema/comentario/${idComentario}/avaliar`,
        { tipo },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Corrige contadores com valores reais vindos do servidor
      if (response.data && response.data.data) {
        const { id_comentario, likes, dislikes } = response.data.data;

        setComentarios(prev => prev.map(comentario => {
          if (comentario.id_comentario === id_comentario) {
            return { ...comentario, likes, dislikes };
          }
          return comentario;
        }));
      }
    } catch (error) {
      // Reverter mudanças otimistas em caso de erro
      carregarAvaliacoesUtilizador();
      
      const mensagemErro = error.response?.data?.message || error.message;
      alert(`Erro ao avaliar comentário: ${mensagemErro}`);
    }
  };

  /**
   * Sistema de denúncia de comentários inadequados para moderação
   * ENDPOINT CORRIGIDO: Utiliza a rota correta do forum-tema
   */
  const denunciarComentario = async (idComentario) => {
    const motivo = prompt('Por favor, indica o motivo da denúncia:');
    if (!motivo) return;

    try {
      const token = localStorage.getItem('token');

      await axios.post(
        `${API_BASE}/forum-tema/comentario/${idComentario}/denunciar`,
        { motivo },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Marca comentário como denunciado na interface
      setComentarios(prev => prev.map(comentario => {
        if (comentario.id_comentario === idComentario) {
          return { ...comentario, foi_denunciado: true };
        }
        return comentario;
      }));

      alert('Comentário denunciado com sucesso. Obrigado pela contribuição para manter a comunidade segura.');

    } catch (error) {
      const mensagemErro = error.response?.data?.message || error.message;
      alert(`Erro ao processar denúncia: ${mensagemErro}`);
    }
  };

  /**
   * Formata timestamps para apresentação em português europeu
   * Trata adequadamente casos de datas inválidas
   */
  const formatarData = (dataString) => {
    if (!dataString) return 'Data indisponível';

    try {
      const data = new Date(dataString);
      return data.toLocaleString('pt-PT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Data inválida';
    }
  };

  /**
   * Renderiza anexos baseado no tipo específico de ficheiro
   * Suporta imagens clicáveis, vídeos com controlos e ficheiros gerais
   */
  const renderAnexo = (item) => {
    if (!item.anexo_url) return null;

    // Normalização de URL para garantir caminho absoluto válido
    let anexoUrl = item.anexo_url;
    if (!anexoUrl.startsWith('http') && !anexoUrl.startsWith('/')) {
      anexoUrl = `/${anexoUrl}`;
    }

    if (anexoUrl.startsWith('/')) {
      anexoUrl = `${API_BASE.split('/api')[0]}${anexoUrl}`;
    }

    const anexoKey = `anexo-${item.id_comentario || item.id || Date.now()}`;

    if (item.tipo_anexo === 'imagem') {
      return (
        <div className="anexo-imagem" key={anexoKey}>
          <ImageComponent
            src={anexoUrl}
            alt="Anexo de imagem"
            className="anexo-img"
            onClick={() => window.open(anexoUrl, '_blank')}
            apiBase={API_BASE}
          />
        </div>
      );
    } else if (item.tipo_anexo === 'video') {
      return (
        <div className="anexo-video" key={anexoKey}>
          <video controls>
            <source src={anexoUrl} type="video/mp4" />
            O teu navegador não suporta reprodução de vídeos.
          </video>
        </div>
      );
    } else {
      return (
        <div className="anexo-arquivo" key={anexoKey} onClick={() => window.open(anexoUrl, '_blank')}>
          <i className="fas fa-file"></i>
          <span>{item.anexo_nome || 'Ficheiro'}</span>
        </div>
      );
    }
  };

  // Renderização para estados de erro
  if (erro && !loading) {
    return (
      <div className="chat-container">
        <div className="main-content">
          <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
          <div className="erro-container">
            <h2>Ocorreu um erro</h2>
            <p>{erro}</p>
          </div>
        </div>
      </div>
    );
  }

  // Renderização para estado de carregamento
  if (loading) {
    return (
      <div className="chat-container">
        <div className="main-content">
          <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
          <div className="loading-container">
            <div className="loading">A carregar comentários...</div>
          </div>
        </div>
      </div>
    );
  }

  // Renderização principal da interface completa do chat
  return (
    <div>
      <div className="main-content">
        <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        <div className="chat-content">
          
          {/* Cabeçalho com informações do tema */}
          {tema && (
            <div className="chat-header">
              <div className="header-content">
                <h2>{tema.titulo || "Tema sem título"}</h2>
                <p className="chat-description">{tema.texto || "Sem descrição disponível"}</p>
                
                {/* Container para anexo do tema original */}
                <div className="tema-anexo-container">
                  {renderAnexo(tema)}
                </div>
                
                {/* Metadados e estatísticas do tema */}
                <div className="tema-meta">
                  <span className="autor">Autor: {tema.utilizador?.nome || 'Não disponível'}</span>
                  <span className="data-criacao">Criado em: {formatarData(tema.data_criacao)}</span>
                  <div className="tema-stats">
                    <span className="likes">
                      <i className="fas fa-thumbs-up"></i> {tema.likes || 0}
                    </span>
                    <span className="dislikes">
                      <i className="fas fa-thumbs-down"></i> {tema.dislikes || 0}
                    </span>
                    <span className="comentarios">
                      <i className="fas fa-comment"></i> {tema.comentarios || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Lista cronológica de comentários */}
          <div className="comentarios-container">
            {comentarios.map((comentario, index) => {
              const comentarioId = comentario.id_comentario;
              const isAutor = comentario.id_utilizador === (usuario?.id_utilizador || usuario?.id);

              return (
                <div
                  key={`comentario-${comentarioId || index}`}
                  className={`comentario ${isAutor ? 'meu-comentario' : ''} ${comentario.foi_denunciado ? 'comentario-denunciado' : ''}`}
                >
                  
                  {/* Cabeçalho de cada comentário */}
                  <div className="comentario-header">
                    <ImageComponent
                      src={comentario.utilizador?.foto_perfil}
                      alt={comentario.utilizador?.nome || 'Utilizador'}
                      className="avatar"
                      apiBase={API_BASE}
                    />
                    <span className="nome-usuario">
                      {comentario.utilizador?.nome || 'Utilizador'}
                    </span>
                    <span className="data-comentario">
                      {formatarData(comentario.data_criacao)}
                    </span>
                  </div>

                  {/* Conteúdo principal do comentário */}
                  <div className="comentario-conteudo">
                    {comentario.texto && <p>{comentario.texto}</p>}
                    {renderAnexo(comentario)}
                  </div>

                  {/* Ações disponíveis para comentários de outros utilizadores */}
                  {!isAutor && (
                    <div className="comentario-acoes">
                      <button
                        className={`acao-btn like-btn ${avaliacoes[comentarioId] === 'like' ? 'active' : ''}`}
                        onClick={() => avaliarComentario(comentarioId, 'like')}
                        title="Curtir este comentário"
                      >
                        <i className="fas fa-thumbs-up"></i>
                        <span>{comentario.likes || 0}</span>
                      </button>

                      <button
                        className={`acao-btn dislike-btn ${avaliacoes[comentarioId] === 'dislike' ? 'active' : ''}`}
                        onClick={() => avaliarComentario(comentarioId, 'dislike')}
                        title="Não curtir este comentário"
                      >
                        <i className="fas fa-thumbs-down"></i>
                        <span>{comentario.dislikes || 0}</span>
                      </button>

                      <button
                        className="acao-btn denunciar-btn"
                        onClick={() => denunciarComentario(comentarioId)}
                        title="Denunciar comentário inadequado"
                        disabled={comentario.foi_denunciado}
                      >
                        <i className="fas fa-flag"></i>
                        {comentario.foi_denunciado && (
                          <span className="denuncia-status">Denunciado</span>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Área fixa inferior para entrada de novos comentários */}
      <div className="chat-input-area" ref={inputAreaRef}>
        
        {/* Preview do anexo selecionado */}
        {anexoTipo && (
          <div className="anexo-preview">
            {anexoTipo === 'imagem' && (
              <img src={anexoPreview} alt="Preview da imagem selecionada" />
            )}
            {anexoTipo === 'video' && (
              <video src={anexoPreview} controls />
            )}
            {anexoTipo === 'file' && (
              <span className="nome-arquivo">{anexoPreview}</span>
            )}
            <button className="btn-cancelar-anexo" onClick={cancelarAnexo}>
              <i className="fas fa-times"></i>
            </button>
          </div>
        )}

        {/* Área principal de entrada de texto e ações */}
        <div className="input-wrapper">
          <textarea
            value={novoComentario}
            onChange={(e) => setNovoComentario(e.target.value)}
            placeholder="Escreve o teu comentário aqui..."
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                enviarComentario();
              }
            }}
          />

          {/* Grupo de ações principais */}
          <div className="chat-actions">
            <button 
              className="btn-anexo" 
              onClick={() => fileInputRef.current.click()} 
              title="Anexar ficheiro"
            >
              <i className="fas fa-paperclip"></i>
            </button>
            
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*,video/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              style={{ display: 'none' }}
            />

            <button 
              className="btn-enviar" 
              onClick={enviarComentario} 
              title="Enviar comentário"
            >
              <i className="fas fa-paper-plane"></i>
            </button>
          </div>

          {/* Botão para navegação rápida ao final */}
          <button 
            className="btn-ir-final" 
            onClick={irParaFinal} 
            title="Ir para o final da conversa"
          >
            <i className="fas fa-chevron-down"></i>
          </button>
        </div>
      </div>
    </div>
  );
}

export default Topicos_Chat;