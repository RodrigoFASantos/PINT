import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';
import API_BASE, { IMAGES } from '../api';
import '../components/css/Categoria_Chat.css';

// Componentes
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const Categoria_Chat = () => {
  const { topicoId } = useParams();
  const [mensagens, setMensagens] = useState([]);
  const [novaMensagem, setNovaMensagem] = useState('');
  const [topico, setTopico] = useState(null);
  const [loading, setLoading] = useState(true);
  const [anexoTipo, setAnexoTipo] = useState(null); // 'imagem', 'video', 'file'
  const [anexoFile, setAnexoFile] = useState(null);
  const [anexoPreview, setAnexoPreview] = useState('');
  const [usuario, setUsuario] = useState(null);
  
  const mensagensContainerRef = useRef(null);
  const socketRef = useRef();
  const fileInputRef = useRef(null);

  // Inicializar socket.io e carregar dados
  useEffect(() => {
    const token = localStorage.getItem('token');
    
    // Obter dados do usuário atual
    const fetchUsuario = async () => {
      try {
        const response = await axios.get(`${API_BASE}/users/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUsuario(response.data);
      } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error);
      }
    };

    // Obter dados do tópico
    const fetchTopico = async () => {
      try {
        const response = await axios.get(`${API_BASE}/topicos/${topicoId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setTopico(response.data);
      } catch (error) {
        console.error('Erro ao carregar tópico:', error);
      }
    };

    // Obter mensagens existentes
    const fetchMensagens = async () => {
      try {
        const response = await axios.get(`${API_BASE}/chat/mensagens/${topicoId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMensagens(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Erro ao carregar mensagens:', error);
        setLoading(false);
      }
    };

    // Inicializar socket
    socketRef.current = io(`${API_BASE}`, {
      query: { token },
      path: '/socket.io',
      transports: ['websocket', 'polling']
    });

    // Registrar tópico atual para receber atualizações
    socketRef.current.emit('joinTopic', topicoId);

    // Ouvir novas mensagens
    socketRef.current.on('novaMensagem', (mensagem) => {
      setMensagens((prev) => [...prev, mensagem]);
    });

    // Executar funções para buscar dados
    fetchUsuario();
    fetchTopico();
    fetchMensagens();

    // Limpeza ao desmontar componente
    return () => {
      if (socketRef.current) {
        socketRef.current.emit('leaveTopic', topicoId);
        socketRef.current.disconnect();
      }
    };
  }, [topicoId]);

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
    setAnexoTipo(null);
    setAnexoFile(null);
    setAnexoPreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Enviar mensagem
  const enviarMensagem = async () => {
    if ((!novaMensagem.trim() && !anexoFile) || !usuario) return;

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      
      formData.append('topicoId', topicoId);
      formData.append('texto', novaMensagem);
      formData.append('tipoAnexo', anexoTipo || '');
      
      if (anexoFile) {
        formData.append('anexo', anexoFile);
      }

      await axios.post(`${API_BASE}/chat/mensagens`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      // Limpar campos após envio
      setNovaMensagem('');
      cancelarAnexo();
      
      // Socket.io envia a mensagem para todos, então não precisamos atualizar state manualmente
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      alert('Não foi possível enviar a mensagem. Tente novamente.');
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
    if (!mensagem.anexoUrl) return null;

    if (mensagem.tipoAnexo === 'imagem') {
      return (
        <div className="anexo-imagem">
          <img 
            src={`${API_BASE}${mensagem.anexoUrl}`} 
            alt="Anexo" 
            onClick={() => window.open(`${API_BASE}${mensagem.anexoUrl}`, '_blank')}
          />
        </div>
      );
    } else if (mensagem.tipoAnexo === 'video') {
      return (
        <div className="anexo-video">
          <video controls>
            <source src={`${API_BASE}${mensagem.anexoUrl}`} type="video/mp4" />
            Seu navegador não suporta vídeos.
          </video>
        </div>
      );
    } else {
      return (
        <div className="anexo-arquivo" onClick={() => window.open(`${API_BASE}${mensagem.anexoUrl}`, '_blank')}>
          <i className="fas fa-file"></i>
          <span>{mensagem.anexoNome || 'Arquivo'}</span>
        </div>
      );
    }
  };

  if (loading) {
    return <div className="loading">Carregando chat...</div>;
  }

  return (
    <div className="chat-container">
      <Navbar />
      <div className="main-content">
        <Sidebar />
        <div className="chat-content">
          {topico && (
            <div className="chat-header">
              <h2>{topico.titulo}</h2>
              <p className="chat-description">{topico.descricao}</p>
              <div className="topico-meta">
                <span className="categoria">{topico.categoria?.nome} &gt; {topico.area?.nome}</span>
                <span className="criado-por">Criado por: {topico.criador?.nome}</span>
              </div>
            </div>
          )}

          <div className="mensagens-container" ref={mensagensContainerRef}>
            {mensagens.length === 0 ? (
              <div className="sem-mensagens">
                Nenhuma mensagem ainda. Seja o primeiro a comentar!
              </div>
            ) : (
              mensagens.map((mensagem) => (
                <div 
                  key={mensagem.id} 
                  className={`mensagem ${mensagem.usuario?.id === usuario?.id ? 'minha-mensagem' : ''}`}
                >
                  <div className="mensagem-header">
                    <img 
                      src={mensagem.usuario?.avatar || IMAGES.DEFAULT_AVATAR} 
                      alt={mensagem.usuario?.nome} 
                      className="avatar"
                    />
                    <span className="nome-usuario">{mensagem.usuario?.nome}</span>
                    <span className="data-mensagem">{formatarData(mensagem.dataCriacao)}</span>
                  </div>
                  
                  <div className="mensagem-conteudo">
                    {mensagem.texto && <p>{mensagem.texto}</p>}
                    {renderAnexo(mensagem)}
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
                placeholder="Digite sua mensagem..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    enviarMensagem();
                  }
                }}
              />
              
              <div className="chat-actions">
                <button className="btn-anexo" onClick={() => fileInputRef.current.click()}>
                  <i className="fas fa-paperclip"></i>
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileChange} 
                  style={{ display: 'none' }}
                />
                
                <button className="btn-enviar" onClick={enviarMensagem}>
                  <i className="fas fa-paper-plane"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Categoria_Chat;