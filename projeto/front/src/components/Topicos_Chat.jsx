import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';
import './css/Topicos_Chat.css';

import Sidebar from '../components/Sidebar';

// IMPORTANTE: Definindo a URL base correta manualmente
const API_BASE = 'http://localhost:4000/api';
// Constante para imagens default
const IMAGES = {
  DEFAULT_AVATAR: '/default-avatar.png'
};

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
    console.log("URL completa para tópico:", `${API_BASE}/topicos-categoria/${topicoId}`);
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
        logInfo('Dados do usuário obtidos com sucesso');
      } catch (error) {
        logInfo('Erro ao carregar dados do usuário:', error.message);
      }
    };

    // Obter dados do tópico - CORRIGIDO
    const fetchTopico = async () => {
      try {
        logInfo(`Buscando dados do tópico ID: ${topicoId}`);
        // Usando o endpoint correto agora com a URL base correta
        const response = await axios.get(`${API_BASE}/topicos-categoria/${topicoId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        logInfo('Resposta obtida do servidor:', response.data);
        
        if (response.data && response.data.data) {
          setTopico(response.data.data);
          logInfo('Tópico definido com sucesso');
        } else {
          throw new Error('Formato de resposta inválido');
        }
      } catch (error) {
        logInfo('Erro ao carregar tópico:', error.message);
        setErro(`Erro ao carregar tópico: ${error.message}`);
        // Não redirecionamos imediatamente para dar chance ao usuário de ver o erro
      }
    };

    // Obter comentários existentes - CORRIGIDO
    const fetchComentarios = async () => {
      try {
        logInfo(`Buscando comentários para o tópico ID: ${topicoId}`);
        // Usando o endpoint correto agora com a URL base correta
        const response = await axios.get(`${API_BASE}/topicos-categoria/${topicoId}/comentarios`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        logInfo(`Obtidos ${response.data.data ? response.data.data.length : 0} comentários`);
        
        if (response.data && response.data.data) {
          setMensagens(response.data.data);
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
        setMensagens((prev) => [...prev, comentario]);
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

  // Enviar comentário - CORRIGIDO COM URL BASE CORRETA
  const enviarComentario = async () => {
    if ((!novaMensagem.trim() && !anexoFile) || !usuario) {
      logInfo('Tentativa de enviar mensagem vazia ou sem usuário');
      return;
    }

    try {
      logInfo('Enviando comentário');
      const token = localStorage.getItem('token');
      const formData = new FormData();
      
      formData.append('texto', novaMensagem);
      
      if (anexoFile) {
        formData.append('anexo', anexoFile);
        logInfo('Anexando arquivo:', anexoFile.name);
      }

      // Usando o endpoint correto com URL base correta
      const response = await axios.post(`${API_BASE}/topicos-categoria/${topicoId}/comentarios`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      logInfo('Comentário enviado com sucesso');
      
      // Se o socket não estiver funcionando, adicionar o comentário manualmente
      if (!socketRef.current || !socketRef.current.connected) {
        logInfo('Socket não está conectado, atualizando mensagens manualmente');
        setMensagens(prev => [...prev, response.data.data]);
      }

      // Limpar campos após envio
      setNovaMensagem('');
      cancelarAnexo();
    } catch (error) {
      logInfo('Erro ao enviar comentário:', error.message);
      alert('Não foi possível enviar o comentário. Tente novamente.');
    }
  };

  // Avaliar comentário (curtir ou descurtir) - CORRIGIDO COM URL BASE CORRETA
  const avaliarComentario = async (idComentario, tipo) => {
    try {
      logInfo(`Avaliando comentário ${idComentario} como ${tipo}`);
      const token = localStorage.getItem('token');
      
      // Usando o endpoint correto com URL base correta
      await axios.post(`${API_BASE}/topicos-categoria/${topicoId}/comentarios/${idComentario}/avaliar`, 
        { tipo }, // 'like' ou 'dislike'
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      logInfo('Avaliação enviada com sucesso');
      
      // Atualizar o estado local (para feedback imediato)
      setMensagens(prev => prev.map(mensagem => {
        if (mensagem.id_comentario === idComentario) {
          return {
            ...mensagem,
            likes: tipo === 'like' ? mensagem.likes + 1 : mensagem.likes,
            dislikes: tipo === 'dislike' ? mensagem.dislikes + 1 : mensagem.dislikes
          };
        }
        return mensagem;
      }));
      
    } catch (error) {
      logInfo('Erro ao avaliar comentário:', error.message);
    }
  };

  // Denunciar comentário - CORRIGIDO COM URL BASE CORRETA
  const denunciarComentario = async (idComentario) => {
    const motivo = prompt('Por favor, informe o motivo da denúncia:');
    if (!motivo) return;
    
    try {
      logInfo(`Denunciando comentário ${idComentario}`);
      const token = localStorage.getItem('token');
      
      // Usando o endpoint correto com URL base correta
      await axios.post(`${API_BASE}/topicos-categoria/${topicoId}/comentarios/${idComentario}/denunciar`, 
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
    const data = new Date(dataString);
    return data.toLocaleString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Exibir conteúdo do anexo
  const renderAnexo = (mensagem) => {
    if (!mensagem.anexo_url) return null;
  
    // Corrigir o URL do anexo - garantir que não tenha caminho absoluto
    const anexoUrl = mensagem.anexo_url.startsWith('/') 
      ? `${API_BASE.split('/api')[0]}${mensagem.anexo_url}` 
      : `${API_BASE.split('/api')[0]}/${mensagem.anexo_url}`;
  
    if (mensagem.tipo_anexo === 'imagem') {
      return (
        <div className="anexo-imagem">
          <img 
            src={anexoUrl} 
            alt="Anexo" 
            onClick={() => window.open(anexoUrl, '_blank')}
          />
        </div>
      );
    } else if (mensagem.tipo_anexo === 'video') {
      return (
        <div className="anexo-video">
          <video controls>
            <source src={anexoUrl} type="video/mp4" />
            Seu navegador não suporta vídeos.
          </video>
        </div>
      );
    } else {
      return (
        <div className="anexo-arquivo" onClick={() => window.open(anexoUrl, '_blank')}>
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
                <span className="categoria">Categoria: {topico.categoria?.nome}</span>
                <span className="criado-por">Criado por: {topico.criador?.nome}</span>
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
              mensagens.map((mensagem) => (
                <div 
                  key={mensagem.id_comentario} 
                  className={`mensagem ${mensagem.id_utilizador === usuario?.id ? 'minha-mensagem' : ''}`}
                >
                  <div className="mensagem-header">
                    <img 
                      src={mensagem.utilizador?.foto_perfil || IMAGES.DEFAULT_AVATAR} 
                      alt={mensagem.utilizador?.nome} 
                      className="avatar"
                    />
                    <span className="nome-usuario">{mensagem.utilizador?.nome}</span>
                    <span className="data-mensagem">{formatarData(mensagem.data_criacao)}</span>
                  </div>
                  
                  <div className="mensagem-conteudo">
                    {mensagem.texto && <p>{mensagem.texto}</p>}
                    {renderAnexo(mensagem)}
                  </div>
                  
                  <div className="mensagem-acoes">
                    <button 
                      className="acao-btn like-btn" 
                      onClick={() => avaliarComentario(mensagem.id_comentario, 'like')}
                      title="Curtir"
                    >
                      <i className="fas fa-thumbs-up"></i> 
                      <span>{mensagem.likes || 0}</span>
                    </button>
                    
                    <button 
                      className="acao-btn dislike-btn" 
                      onClick={() => avaliarComentario(mensagem.id_comentario, 'dislike')}
                      title="Descurtir"
                    >
                      <i className="fas fa-thumbs-down"></i>
                      <span>{mensagem.dislikes || 0}</span>
                    </button>
                    
                    <button 
                      className="acao-btn denunciar-btn" 
                      onClick={() => denunciarComentario(mensagem.id_comentario)}
                      title="Denunciar"
                    >
                      <i className="fas fa-flag"></i>
                    </button>
                  </div>
                </div>
              ))
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