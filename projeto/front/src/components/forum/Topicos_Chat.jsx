import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';
import './css/Topicos_Chat.css';
import API_BASE, { IMAGES } from '../../api';
import Sidebar from '../Sidebar';

const ImageComponent = ({ src, alt = 'Imagem', className = '', onClick, apiBase }) => {
  const [hasError, setHasError] = useState(false);

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

const Topicos_Chat = () => {
  const { topicoId, temaId } = useParams();
  const navigate = useNavigate();
  const [comentarios, setComentarios] = useState([]);
  const [novoComentario, setNovoComentario] = useState('');
  const [topico, setTopico] = useState(null);
  const [tema, setTema] = useState(null);
  const [loading, setLoading] = useState(true);
  const [anexoTipo, setAnexoTipo] = useState(null); // 'imagem', 'video', 'file'
  const [anexoFile, setAnexoFile] = useState(null);
  const [anexoPreview, setAnexoPreview] = useState('');
  const [usuario, setUsuario] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [erro, setErro] = useState(null);
  const [avaliacoes, setAvaliacoes] = useState({});

  const comentariosContainerRef = useRef(null);
  const socketRef = useRef();
  const fileInputRef = useRef(null);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // Função de debug para log consistente
  const logInfo = (message, data) => {
    console.log(`[TopicosChat] ${message}`, data || '');
  };

  // Verificando e imprimindo a URL base para depuração
  useEffect(() => {
    console.log("URL base da API:", API_BASE);
    console.log("ID do tópico:", topicoId);
    console.log("ID do tema:", temaId);
    console.log("URL completa para tema:", `${API_BASE}/forum/tema/${temaId}`);
  }, [topicoId, temaId]);

  // Inicializar socket.io e carregar dados
  useEffect(() => {
    const token = localStorage.getItem('token');

    logInfo(`Iniciando carregamento para tópico ID: ${topicoId}, tema ID: ${temaId}`);

    // Obter dados do usuário atual
    const fetchUsuario = async () => {
      try {
        logInfo('Buscando dados do usuário');
        const response = await axios.get(`${API_BASE}/users/perfil`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUsuario(response.data);
        logInfo('Dados do usuário obtidos com sucesso', response.data);
      } catch (error) {
        logInfo('Erro ao carregar dados do usuário:', error.message);
      }
    };

    // Obter dados do tópico
    const fetchTopico = async () => {
      try {
        logInfo(`Buscando dados do tópico ID: ${topicoId}`);
        const response = await axios.get(`${API_BASE}/topicos-area/${topicoId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        logInfo('Resposta obtida do servidor:', response.data);

        if (response.data && response.data.data) {
          setTopico(response.data.data);
          logInfo('Tópico definido com sucesso', response.data.data);
        } else {
          throw new Error('Formato de resposta inválido');
        }
      } catch (error) {
        logInfo('Erro ao carregar tópico:', error.message);
        setErro(`Erro ao carregar tópico: ${error.message}`);
      }
    };

    // Obter dados do tema
    const fetchTema = async () => {
      try {
        logInfo(`Buscando dados do tema ID: ${temaId}`);
        const response = await axios.get(`${API_BASE}/forum-tema/tema/${temaId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        logInfo('Resposta obtida do servidor:', response.data);

        if (response.data && response.data.data) {
          setTema(response.data.data);
          logInfo('Tema definido com sucesso', response.data.data);
        } else {
          throw new Error('Formato de resposta inválido');
        }
      } catch (error) {
        logInfo('Erro ao carregar tema:', error.message);
        setErro(`Erro ao carregar tema: ${error.message}`);
      }
    };

    // Obter comentários existentes
    const fetchComentarios = async () => {
      try {
        logInfo(`Buscando comentários para o tema ID: ${temaId}`);
        const response = await axios.get(`${API_BASE}/forum-tema/tema/${temaId}/comentarios`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        logInfo(`Obtidos ${response.data.data ? response.data.data.length : 0} comentários`);

        if (response.data && response.data.data) {
          setComentarios(response.data.data);
        } else {
          setComentarios([]);
        }

        setLoading(false);
      } catch (error) {
        logInfo('Erro ao carregar comentários:', error.message);
        setErro(`Erro ao carregar comentários: ${error.message}`);
        setLoading(false);
      }
    };

    // Inicializar socket
    try {
      logInfo('Inicializando socket.io');
      socketRef.current = io(`${API_BASE.split('/api')[0]}`, {
        query: { token },
        path: '/socket.io',
        transports: ['websocket', 'polling']
      });

      // Registrar tema atual para receber atualizações
      socketRef.current.emit('joinTema', temaId);
      logInfo(`Registrado no canal do tema: ${temaId}`);

      // Ouvir novos comentários
      socketRef.current.on('novoComentario', (comentario) => {
        logInfo('Novo comentário recebido via socket:', comentario);
        setComentarios(prev => [...prev, comentario]);
      });

      // Lidar com erros de conexão
      socketRef.current.on('connect_error', (error) => {
        logInfo('Erro na conexão socket:', error.message);
      });
    } catch (error) {
      logInfo('Erro ao inicializar socket:', error.message);
    }

    // Executar funções para buscar dados
    fetchUsuario();
    fetchTopico();
    fetchTema();
    fetchComentarios();

    // Limpeza ao desmontar componente
    return () => {
      if (socketRef.current) {
        logInfo('Desconectando socket');
        socketRef.current.emit('leaveTema', temaId);
        socketRef.current.disconnect();
      }
    };
  }, [topicoId, temaId, navigate]);

  // Rolar para o final da conversa ao receber novos comentários
  useEffect(() => {
    if (comentariosContainerRef.current) {
      comentariosContainerRef.current.scrollTop = comentariosContainerRef.current.scrollHeight;
    }
  }, [comentarios]);

  // Funções para lidar com anexos
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    logInfo('Arquivo selecionado:', file.name);

    // Verificar tipo de arquivo
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

  const cancelarAnexo = () => {
    logInfo('Cancelando anexo');
    setAnexoTipo(null);
    setAnexoFile(null);
    setAnexoPreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Enviar comentário
  const enviarComentario = async () => {
    if ((!novoComentario.trim() && !anexoFile) || !usuario) {
      logInfo('Tentativa de enviar comentário vazio ou sem usuário');
      alert('É necessário fornecer texto ou anexo para o comentário');
      return;
    }

    try {
      logInfo('Enviando comentário');
      const token = localStorage.getItem('token');
      const formData = new FormData();

      formData.append('texto', novoComentario);
      if (anexoFile) {
        formData.append('anexo', anexoFile);
      }

      // Adicionar logs para depuração
      logInfo('Conteúdo do FormData', {
        texto: novoComentario,
        anexo: anexoFile ? {
          nome: anexoFile.name,
          tipo: anexoFile.type,
          tamanho: anexoFile.size
        } : 'nenhum'
      });

      // Usar o endpoint correto para comentários de tema
      const response = await axios.post(`${API_BASE}/forum-tema/tema/${temaId}/comentario`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      logInfo('Resposta do servidor:', response.data);

      // Se o socket não estiver funcionando, adicionar o comentário manualmente
      if (!socketRef.current || !socketRef.current.connected) {
        logInfo('Socket não está conectado, atualizando comentários manualmente');
        if (response.data && response.data.data) {
          setComentarios(prev => [...prev, response.data.data]);
        }
      }

      // Limpar campos após envio
      setNovoComentario('');
      cancelarAnexo();
    } catch (error) {
      logInfo('Erro ao enviar comentário:', error.message);
      if (error.response) {
        logInfo('Detalhes da resposta de erro:', error.response.data);
      }
      setErro(`Não foi possível enviar o comentário: ${error.message}`);
      alert('Não foi possível enviar o comentário. Tente novamente.');
    }
  };

  // Avaliar comentário (curtir ou descurtir)
  const avaliarComentario = async (idComentario, tipo) => {
    try {
      logInfo(`Avaliando comentário ${idComentario} como ${tipo}`);
      const token = localStorage.getItem('token');

      // Atualizar o estado local para feedback imediato
      setComentarios(prev => prev.map(comentario => {
        if (comentario.id_comentario === idComentario) {
          // Verificar se o usuário já avaliou este comentário (toggle)
          const jaAvaliado = avaliacoes[idComentario] === tipo;

          // Atualizar o estado de avaliações
          const novasAvaliacoes = { ...avaliacoes };

          if (jaAvaliado) {
            // Remover avaliação (toggle off)
            delete novasAvaliacoes[idComentario];
            setAvaliacoes(novasAvaliacoes);

            return {
              ...comentario,
              likes: tipo === 'like' ? Math.max(0, comentario.likes - 1) : comentario.likes,
              dislikes: tipo === 'dislike' ? Math.max(0, comentario.dislikes - 1) : comentario.dislikes
            };
          } else {
            // Adicionar nova avaliação ou trocar tipo
            const tipoAnterior = avaliacoes[idComentario];
            novasAvaliacoes[idComentario] = tipo;
            setAvaliacoes(novasAvaliacoes);

            return {
              ...comentario,
              likes: tipo === 'like'
                ? comentario.likes + 1
                : (tipoAnterior === 'like' ? Math.max(0, comentario.likes - 1) : comentario.likes),
              dislikes: tipo === 'dislike'
                ? comentario.dislikes + 1
                : (tipoAnterior === 'dislike' ? Math.max(0, comentario.dislikes - 1) : comentario.dislikes)
            };
          }
        }
        return comentario;
      }));

      // Fazer a requisição para o servidor
      const response = await axios.post(
        `${API_BASE}/forum/comentario/${idComentario}/avaliar`,
        { tipo },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      logInfo('Avaliação enviada com sucesso', response.data);

      // Atualizar os contadores com valores reais do servidor
      if (response.data && response.data.data) {
        const { id_comentario, likes, dislikes } = response.data.data;

        setComentarios(prev => prev.map(comentario => {
          if (comentario.id_comentario === id_comentario) {
            return {
              ...comentario,
              likes,
              dislikes
            };
          }
          return comentario;
        }));
      }
    } catch (error) {
      logInfo('Erro ao avaliar comentário:', error.message);

      // Exibir mensagem de erro com mais detalhes
      if (error.response) {
        const mensagemErro = error.response.data.message || 'Erro desconhecido';
        alert(`Erro ao avaliar comentário: ${mensagemErro}`);
      } else {
        alert(`Erro ao avaliar comentário: ${error.message}`);
      }
    }
  };

  // Denunciar comentário
  const denunciarComentario = async (idComentario) => {
    const motivo = prompt('Por favor, informe o motivo da denúncia:');
    if (!motivo) return;

    try {
      logInfo(`Denunciando comentário ${idComentario}`);
      const token = localStorage.getItem('token');

      // Usar o endpoint correto
      const response = await axios.post(
        `${API_BASE}/forum/comentario/${idComentario}/denunciar`,
        { motivo },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      logInfo('Denúncia enviada com sucesso', response.data);

      // Marcar o comentário como denunciado localmente
      setComentarios(prev => prev.map(comentario => {
        if (comentario.id_comentario === idComentario) {
          return {
            ...comentario,
            foi_denunciado: true
          };
        }
        return comentario;
      }));

      alert('Comentário denunciado com sucesso. Obrigado pela sua contribuição.');

    } catch (error) {
      logInfo('Erro ao denunciar comentário:', error.message);

      if (error.response) {
        const mensagemErro = error.response.data.message || 'Erro desconhecido';
        alert(`Erro ao denunciar comentário: ${mensagemErro}`);
      } else {
        alert(`Ocorreu um erro ao denunciar o comentário: ${error.message}`);
      }
    }
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

  // Exibir conteúdo do anexo
  const renderAnexo = (item) => {
    if (!item.anexo_url) return null;

    // Normalizar URL do anexo
    let anexoUrl = item.anexo_url;
    if (!anexoUrl.startsWith('http') && !anexoUrl.startsWith('/')) {
      anexoUrl = `/${anexoUrl}`;
    }

    if (anexoUrl.startsWith('/')) {
      anexoUrl = `${API_BASE.split('/api')[0]}${anexoUrl}`;
    }

    // Adiciona key ao elemento pai, independente do tipo
    const anexoKey = `anexo-${item.id_comentario || item.id || 'unknown'}`;

    if (item.tipo_anexo === 'imagem') {
      return (
        <div className="anexo-imagem" key={anexoKey}>
          <ImageComponent
            src={anexoUrl}
            alt="Anexo"
            className="anexo-img"
            onClick={() => window.open(anexoUrl, '_blank')}
            apiBase={API_BASE}
          />
        </div>
      );
    } else if (item.tipo_anexo === 'video') {
      return (
        <div className="anexo-video" key={anexoKey}>
          <video controls onError={(e) => console.error(`Erro ao carregar vídeo: ${anexoUrl}`)}>
            <source src={anexoUrl} type="video/mp4" />
            Seu navegador não suporta vídeos.
          </video>
        </div>
      );
    } else {
      return (
        <div className="anexo-arquivo" key={anexoKey} onClick={() => window.open(anexoUrl, '_blank')}>
          <i className="fas fa-file"></i>
          <span>{item.anexo_nome || 'Arquivo'}</span>
        </div>
      );
    }
  };

  // Renderizar estado de erro
  if (erro && !loading) {
    return (
      <div className="chat-container">
        <div className="main-content">
          <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
          <div className="erro-container">
            <h2>Ocorreu um erro</h2>
            <p>{erro}</p>
            <button
              className="voltar-btn"
              onClick={() => navigate(`/forum/topico/${topicoId}`)}
            >
              <i className="fas fa-arrow-left"></i> Voltar ao Tópico
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Renderizar estado de carregamento
  if (loading) {
    return (
      <div className="chat-container">
        <div className="main-content">
          <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
          <div className="loading-container">
            <div className="loading">Carregando comentários...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <button className="voltar-btn" onClick={() => navigate(`/forum/topico/${topicoId}`)} >
        <i className="fas fa-arrow-left"></i>
      </button>
      <div className="main-content">
        <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        <div className="chat-content">
          {tema && (
            <div className="chat-header">
              <h2>{tema.titulo || "Tema sem título"}</h2>
              <p className="chat-description">{tema.texto || "Sem descrição"}</p>
              <div className="tema-anexo-container">
                {renderAnexo(tema)}
              </div>
              <div className="tema-meta">
                <span className="autor">Por: {tema.utilizador?.nome || 'Não disponível'}</span>
                <span className="data-criacao">Data: {formatarData(tema.data_criacao)}</span>
                <div className="tema-stats">
                  <span className="likes"><i className="fas fa-thumbs-up"></i> {tema.likes || 0}</span>
                  <span className="dislikes"><i className="fas fa-thumbs-down"></i> {tema.dislikes || 0}</span>
                  <span className="comentarios"><i className="fas fa-comment"></i> {tema.comentarios || 0}</span>
                </div>
              </div>
            </div>
          )}

          <div className="comentarios-container" ref={comentariosContainerRef}>
            {comentarios.length === 0 ? (
              <div className="sem-comentarios">
                Nenhum comentário ainda. Seja o primeiro a comentar!
              </div>
            ) : (
              comentarios.map((comentario, index) => {
                const comentarioId = comentario.id_comentario;
                const isAutor = comentario.id_utilizador === (usuario?.id_utilizador || usuario?.id);

                return (
                  <div
                    key={`comentario-${comentarioId || index}`}
                    className={`comentario ${isAutor ? 'meu-comentario' : ''} ${comentario.foi_denunciado ? 'comentario-denunciado' : ''}`}
                  >
                    <div className="comentario-header">
                      <ImageComponent
                        src={comentario.utilizador?.foto_perfil}
                        alt={comentario.utilizador?.nome || 'Usuário'}
                        className="avatar"
                        apiBase={API_BASE}
                      />
                      <span className="nome-usuario">{comentario.utilizador?.nome || 'Usuário'}</span>
                      <span className="data-comentario">{formatarData(comentario.data_criacao)}</span>
                    </div>

                    <div className="comentario-conteudo">
                      {comentario.texto && <p>{comentario.texto}</p>}
                      {renderAnexo(comentario)}
                    </div>

                    <div className="comentario-acoes">
                      <button
                        className={`acao-btn like-btn ${avaliacoes[comentarioId] === 'like' ? 'active' : ''}`}
                        onClick={() => avaliarComentario(comentarioId, 'like')}
                        title="Curtir"
                      >
                        <i className="fas fa-thumbs-up"></i>
                        <span>{comentario.likes || 0}</span>
                      </button>

                      <button
                        className={`acao-btn dislike-btn ${avaliacoes[comentarioId] === 'dislike' ? 'active' : ''}`}
                        onClick={() => avaliarComentario(comentarioId, 'dislike')}
                        title="Descurtir"
                      >
                        <i className="fas fa-thumbs-down"></i>
                        <span>{comentario.dislikes || 0}</span>
                      </button>

                      <button
                        className="acao-btn denunciar-btn"
                        onClick={() => denunciarComentario(comentarioId)}
                        title="Denunciar"
                        disabled={comentario.foi_denunciado}
                      >
                        <i className="fas fa-flag"></i>
                        {comentario.foi_denunciado && <span className="denuncia-status">Denunciado</span>}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="chat-input-area">
            {anexoTipo && (
              <div className="anexo-preview">
                {anexoTipo === 'imagem' && <img src={anexoPreview} alt="Preview" />}
                {anexoTipo === 'video' && <video src={anexoPreview} controls />}
                {anexoTipo === 'file' && <span className="nome-arquivo">{anexoPreview}</span>}
                <button className="btn-cancelar-anexo" onClick={cancelarAnexo}>
                  <i className="fas fa-times"></i>
                </button>
              </div>
            )}

            <div className="input-wrapper">
              <textarea
                value={novoComentario}
                onChange={(e) => setNovoComentario(e.target.value)}
                placeholder="Escreva um comentário..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    enviarComentario();
                  }
                }}
              />

              <div className="chat-actions">
                <button className="btn-anexo" onClick={() => fileInputRef.current.click()} title="Anexar arquivo">
                  <i className="fas fa-paperclip"></i>
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*,video/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  style={{ display: 'none' }}
                />

                <button className="btn-enviar" onClick={enviarComentario} title="Enviar comentário">
                  <i className="fas fa-paper-plane"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Topicos_Chat;