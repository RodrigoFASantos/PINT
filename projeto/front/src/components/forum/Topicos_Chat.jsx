import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';
import './css/Topicos_Chat.css';
import API_BASE, {IMAGES} from '../../api';
import Sidebar from '../Sidebar';


const Topicos_Chat = () => {
  const { topicoId } = useParams();
  const navigate = useNavigate();
  const [mensagens, setMensagens] = useState([]);
  const [novaMensagem, setNovaMensagem] = useState('');
  const [topico, setTopico] = useState(null);
  const [loading, setLoading] = useState(true);
  const [anexoTipo, setAnexoTipo] = useState(null); // 'imagem', 'video', 'file'
  const [anexoFile, setAnexoFile] = useState(null);
  const [anexoPreview, setAnexoPreview] = useState('');
  const [usuario, setUsuario] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [erro, setErro] = useState(null);

  const mensagensContainerRef = useRef(null);
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
    console.log("URL completa para tópico:", `${API_BASE}/topicos-area/${topicoId}`);
  }, [topicoId]);

  // Inicializar socket.io e carregar dados
  useEffect(() => {
    const token = localStorage.getItem('token');

    logInfo(`Iniciando carregamento para tópico ID: ${topicoId}`);

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

    // Obter comentários existentes
    const fetchComentarios = async () => {
      try {
        logInfo(`Buscando comentários para o tópico ID: ${topicoId}`);
        const response = await axios.get(`${API_BASE}/topicos-area/${topicoId}/comentarios`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        logInfo(`Obtidos ${response.data.data ? response.data.data.length : 0} comentários`);

        if (response.data && response.data.data) {
          // Garantir que todos os comentários têm um ID único
          const comentariosValidados = response.data.data.map((comentario, index) => {
            if (!comentario.id && !comentario.id_comentario) {
              return { ...comentario, id_comentario: `temp-${index}` };
            }
            if (!comentario.id_comentario && comentario.id) {
              return { ...comentario, id_comentario: comentario.id };
            }
            return comentario;
          });
          setMensagens(comentariosValidados);
        } else {
          setMensagens([]);
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

      // Registrar tópico atual para receber atualizações
      socketRef.current.emit('joinTopic', topicoId);
      logInfo(`Registrado no canal do tópico: ${topicoId}`);

      // Ouvir novos comentários
      socketRef.current.on('novoComentario', (comentario) => {
        logInfo('Novo comentário recebido via socket:', comentario);
        // Verificar se o comentário já existe para evitar duplicações
        setMensagens((prev) => {
          // Verificar pelo id ou id_comentario
          const existe = prev.some(m => 
            (m.id_comentario && m.id_comentario === comentario.id_comentario) || 
            (m.id && m.id === comentario.id) ||
            (m.id && comentario.id_comentario && m.id === comentario.id_comentario) ||
            (m.id_comentario && comentario.id && m.id_comentario === comentario.id)
          );
          if (existe) return prev;
          
          // Garantir que o comentário tem um id_comentario
          const comentarioValidado = comentario;
          if (!comentarioValidado.id_comentario && comentarioValidado.id) {
            comentarioValidado.id_comentario = comentarioValidado.id;
          }
          
          return [...prev, comentarioValidado];
        });
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
    fetchComentarios();

    // Limpeza ao desmontar componente
    return () => {
      if (socketRef.current) {
        logInfo('Desconectando socket');
        socketRef.current.emit('leaveTopic', topicoId);
        socketRef.current.disconnect();
      }
    };
  }, [topicoId, navigate]);

  // Rolar para o final da conversa ao receber novas mensagens
  useEffect(() => {
    if (mensagensContainerRef.current) {
      mensagensContainerRef.current.scrollTop = mensagensContainerRef.current.scrollHeight;
    }
  }, [mensagens]);

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

  // Enviar comentário - CORRIGIDO
  const enviarComentario = async () => {
    if ((!novaMensagem.trim() && !anexoFile) || !usuario) {
      logInfo('Tentativa de enviar mensagem vazia ou sem usuário');
      alert('É necessário fornecer texto ou anexo para o comentário');
      return;
    }

    try {
      logInfo('Enviando comentário');
      const token = localStorage.getItem('token');
      const formData = new FormData();

      formData.append('texto', novaMensagem);
      if (anexoFile) {
        formData.append('anexo', anexoFile);
      }

      // Adicionar logs para depuração
      logInfo('Conteúdo do FormData', {
        texto: novaMensagem,
        anexo: anexoFile ? {
          nome: anexoFile.name,
          tipo: anexoFile.type,
          tamanho: anexoFile.size
        } : 'nenhum'
      });

      // Usar o endpoint correto com URL base correta
      const response = await axios.post(`${API_BASE}/topicos-area/${topicoId}/comentarios`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      logInfo('Resposta do servidor:', response.data);

      // Se o socket não estiver funcionando, adicionar o comentário manualmente
      if (!socketRef.current || !socketRef.current.connected) {
        logInfo('Socket não está conectado, atualizando mensagens manualmente');
        if (response.data && response.data.data) {
          const novoComentario = response.data.data;
          // Garantir que o comentário tem um id_comentario
          if (!novoComentario.id_comentario && novoComentario.id) {
            novoComentario.id_comentario = novoComentario.id;
          }
          
          setMensagens(prev => {
            // Verificar se já existe
            const existe = prev.some(m => 
              (m.id_comentario && m.id_comentario === novoComentario.id_comentario) || 
              (m.id && m.id === novoComentario.id) ||
              (m.id && novoComentario.id_comentario && m.id === novoComentario.id_comentario) ||
              (m.id_comentario && novoComentario.id && m.id_comentario === novoComentario.id)
            );
            if (existe) return prev;
            return [...prev, novoComentario];
          });
        }
      }

      // Limpar campos após envio
      setNovaMensagem('');
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

  // Avaliar comentário (curtir ou descurtir) - CORRIGIDO
  const avaliarComentario = async (idComentario, tipo) => {
    try {
      logInfo(`Avaliando comentário ${idComentario} como ${tipo}`);
      const token = localStorage.getItem('token');

      // Usar o endpoint correto com URL base correta
      await axios.post(`${API_BASE}/topicos-area/${topicoId}/comentarios/${idComentario}/avaliar`,
        { tipo },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      logInfo('Avaliação enviada com sucesso');

      // Atualizar o estado local (para feedback imediato)
      setMensagens(prev => prev.map(mensagem => {
        const mensagemId = mensagem.id_comentario || mensagem.id;
        if (mensagemId === idComentario) {
          return {
            ...mensagem,
            likes: tipo === 'like' ? (mensagem.likes + 1 || 1) : (mensagem.likes || 0),
            dislikes: tipo === 'dislike' ? (mensagem.dislikes + 1 || 1) : (mensagem.dislikes || 0)
          };
        }
        return mensagem;
      }));

    } catch (error) {
      logInfo('Erro ao avaliar comentário:', error.message);
      alert(`Erro ao avaliar comentário: ${error.message}`);
    }
  };

  // Denunciar comentário - CORRIGIDO
  const denunciarComentario = async (idComentario) => {
    const motivo = prompt('Por favor, informe o motivo da denúncia:');
    if (!motivo) return;

    try {
      logInfo(`Denunciando comentário ${idComentario}`);
      const token = localStorage.getItem('token');

      // Usar o endpoint correto com URL base correta
      await axios.post(`${API_BASE}/topicos-area/${topicoId}/comentarios/${idComentario}/denunciar`,
        { motivo },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      logInfo('Denúncia enviada com sucesso');
      alert('Comentário denunciado com sucesso. Obrigado pela sua contribuição.');

    } catch (error) {
      logInfo('Erro ao denunciar comentário:', error.message);
      alert('Ocorreu um erro ao denunciar o comentário. Tente novamente.');
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

  // Exibir conteúdo do anexo - CORRIGIDO
  const renderAnexo = (mensagem) => {
    if (!mensagem.anexo_url) return null;

    // Normalizar URL do anexo
    let anexoUrl = mensagem.anexo_url;
    if (!anexoUrl.startsWith('http') && !anexoUrl.startsWith('/')) {
      anexoUrl = `/${anexoUrl}`;
    }
    
    if (anexoUrl.startsWith('/')) {
      anexoUrl = `${API_BASE.split('/api')[0]}${anexoUrl}`;
    }

    // Adiciona key ao elemento pai, independente do tipo
    const anexoKey = `anexo-${mensagem.id_comentario || mensagem.id || 'unknown'}`;

    if (mensagem.tipo_anexo === 'imagem') {
      return (
        <div className="anexo-imagem" key={anexoKey}>
          <img
            src={anexoUrl}
            alt="Anexo"
            onClick={() => window.open(anexoUrl, '_blank')}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = IMAGES.DEFAULT_AVATAR;
              console.error(`Erro ao carregar imagem: ${anexoUrl}`);
            }}
          />
        </div>
      );
    } else if (mensagem.tipo_anexo === 'video') {
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
          <span>{mensagem.anexo_nome || 'Arquivo'}</span>
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
      <div className="chat-container">
        <div className="main-content">
          <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
          <div className="loading-container">
            <div className="loading">Carregando tópico...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-container">
      <div className="main-content">
        <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        <div className="chat-content">
          {topico && (
            <div className="chat-header">
              <button
                className="voltar-btn"
                onClick={() => navigate('/forum')}
              >
                <i className="fas fa-arrow-left"></i> Voltar ao Fórum
              </button>
              <h2>{topico.titulo}</h2>
              <p className="chat-description">{topico.descricao}</p>
              <div className="topico-meta">
                <span className="categoria">Categoria: {topico.categoria?.nome || 'Não disponível'}</span>
                <span className="criado-por">Criado por: {topico.criador?.nome || 'Não disponível'}</span>
                <span className="data-criacao">Data: {formatarData(topico.data_criacao)}</span>
              </div>
            </div>
          )}

          <div className="mensagens-container" ref={mensagensContainerRef}>
            {mensagens.length === 0 ? (
              <div className="sem-mensagens">
                Nenhum comentário ainda. Seja o primeiro a comentar!
              </div>
            ) : (
              mensagens.map((mensagem, index) => {
                // Garantir um ID único
                const mensagemId = mensagem.id_comentario || mensagem.id || `msg-temp-${index}`;
                const isAutor = mensagem.id_utilizador === (usuario?.id_utilizador || usuario?.id);
                
                return (
                  <div
                    key={`msg-${mensagemId}`}
                    className={`mensagem ${isAutor ? 'minha-mensagem' : ''}`}
                  >
                    <div className="mensagem-header">
                      <img
                        src={mensagem.utilizador?.foto_perfil || IMAGES.DEFAULT_AVATAR}
                        alt={mensagem.utilizador?.nome || 'Usuário'}
                        className="avatar"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = IMAGES.DEFAULT_AVATAR;
                        }}
                      />
                      <span className="nome-usuario">{mensagem.utilizador?.nome || 'Usuário'}</span>
                      <span className="data-mensagem">{formatarData(mensagem.data_criacao)}</span>
                    </div>

                    <div className="mensagem-conteudo">
                      {mensagem.texto && <p key={`texto-${mensagemId}`}>{mensagem.texto}</p>}
                      {renderAnexo(mensagem)}
                    </div>

                    <div className="mensagem-acoes">
                      <button
                        className="acao-btn like-btn"
                        onClick={() => avaliarComentario(mensagemId, 'like')}
                        title="Curtir"
                      >
                        <i className="fas fa-thumbs-up"></i>
                        <span>{mensagem.likes || 0}</span>
                      </button>

                      <button
                        className="acao-btn dislike-btn"
                        onClick={() => avaliarComentario(mensagemId, 'dislike')}
                        title="Descurtir"
                      >
                        <i className="fas fa-thumbs-down"></i>
                        <span>{mensagem.dislikes || 0}</span>
                      </button>

                      <button
                        className="acao-btn denunciar-btn"
                        onClick={() => denunciarComentario(mensagemId)}
                        title="Denunciar"
                      >
                        <i className="fas fa-flag"></i>
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
                value={novaMensagem}
                onChange={(e) => setNovaMensagem(e.target.value)}
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