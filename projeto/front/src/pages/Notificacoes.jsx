import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotificacoes } from '../contexts/NotificacoesContext';
import Sidebar from "../components/Sidebar";
import "./css/Notificacoes.css";

const Notificacoes = () => {
  const {
    notificacoes,
    loading,
    error,
    buscarNotificacoes,
    marcarComoLida,
    marcarTodasComoLidas
  } = useNotificacoes();

  const [message, setMessage] = useState('');
  const [showMessage, setShowMessage] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // Carregar notificações inicialmente
  useEffect(() => {
    console.log('Componente Notificacoes montado');
    buscarNotificacoes();

    // Setup socket for new notifications
    if (window.socket) {
      console.log('Configurando socket em Notificacoes.jsx');
      window.socket.on('nova_notificacao', (data) => {
        console.log('Nova notificação recebida em Notificacoes.jsx:', data);
        buscarNotificacoes();
        setMessage(data.mensagem || 'Nova notificação recebida');
        setShowMessage(true);
        setTimeout(() => setShowMessage(false), 3000);
      });
    }

    return () => {
      if (window.socket) {
        console.log('Removendo listener de socket em Notificacoes.jsx');
        window.socket.off('nova_notificacao');
      }
    };
  }, [buscarNotificacoes]);

  // Manipulador para marcar uma notificação como lida
  const handleMarcarComoLida = async (idNotificacao) => {
    const result = await marcarComoLida(idNotificacao);
    setMessage(result.message);
    setShowMessage(true);
    setTimeout(() => setShowMessage(false), 3000);
  };

  // Manipulador para marcar todas as notificações como lidas
  const handleMarcarTodasComoLidas = async () => {
    const result = await marcarTodasComoLidas();
    setMessage(result.message);
    setShowMessage(true);
    setTimeout(() => setShowMessage(false), 3000);
  };

  // Navegação para o item relacionado à notificação
  const navegarParaItem = (notificacao) => {
    if (!notificacao || !notificacao.notificacao) {
      console.error('Dados de notificação inválidos:', notificacao);
      return;
    }

    console.log('Navegando para item de notificação:', notificacao);
    const { tipo, id_referencia } = notificacao.notificacao;

    if (tipo === 'curso_adicionado' || tipo === 'formador_alterado' || tipo === 'data_curso_alterada') {
      navigate(`/cursos/${id_referencia}`);
    } else if (tipo === 'formador_criado') {
      navigate(`/formadores/${id_referencia}`);
    } else if (tipo === 'admin_criado') {
      navigate(`/admin/users/${id_referencia}`);
    }
  };

  // Obter ícone baseado no tipo de notificação
  const getNotificacaoIconText = (tipo) => {
    switch (tipo) {
      case 'curso_adicionado':
        return '📚';
      case 'formador_alterado':
        return '✏️';
      case 'formador_criado':
        return '👤';
      case 'admin_criado':
        return '👑';
      case 'data_curso_alterada':
        return '📅';
      default:
        return '🔔';
    }
  };

  // Obter classe CSS baseada no tipo de notificação
  const getNotificacaoClass = (tipo) => {
    switch (tipo) {
      case 'curso_adicionado':
        return 'notificacao-curso';
      case 'formador_alterado':
      case 'formador_criado':
        return 'notificacao-formador';
      case 'admin_criado':
        return 'notificacao-admin';
      case 'data_curso_alterada':
        return 'notificacao-data';
      default:
        return '';
    }
  };

  // Formatar data relativa
  const formatRelativeTime = (dateString) => {
    if (!dateString) return 'data desconhecida';

    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInSeconds = Math.floor((now - date) / 1000);

      if (diffInSeconds < 60) return 'há poucos segundos';

      const diffInMinutes = Math.floor(diffInSeconds / 60);
      if (diffInMinutes < 60) return `há ${diffInMinutes} minuto${diffInMinutes > 1 ? 's' : ''}`;

      const diffInHours = Math.floor(diffInMinutes / 60);
      if (diffInHours < 24) return `há ${diffInHours} hora${diffInHours > 1 ? 's' : ''}`;

      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays < 30) return `há ${diffInDays} dia${diffInDays > 1 ? 's' : ''}`;

      const diffInMonths = Math.floor(diffInDays / 30);
      return `há ${diffInMonths} mês${diffInMonths > 1 ? 'es' : ''}`;
    } catch (error) {
      console.error('Erro ao formatar data:', error, dateString);
      return 'data inválida';
    }
  };

  // Contagem de notificações não lidas
  const notificacoesNaoLidas = notificacoes.filter(n => !n.lida).length;

  console.log('Renderizando componente Notificacoes', {
    totalNotificacoes: notificacoes.length,
    naoLidas: notificacoesNaoLidas,
    loading,
    error
  });

  return (
    <div className="notificacoes-container">
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      
      <div className="notificacoes-header">
        <h1 className="notificacoes-title">
          Notificações {notificacoesNaoLidas > 0 && 
            <span className="badge">{notificacoesNaoLidas}</span>
          }
        </h1>

        {notificacoesNaoLidas > 0 && (
          <button
            onClick={handleMarcarTodasComoLidas}
            className="mark-all-button"
          >
            Marcar todas como lidas
          </button>
        )}
      </div>

      {loading ? (
        <p className="notificacoes-loading">Carregando notificações...</p>
      ) : error ? (
        <div className="notificacoes-error">
          {error}
        </div>
      ) : notificacoes.length === 0 ? (
        <div className="notificacoes-empty">
          Você não tem notificações.
        </div>
      ) : (
        <ul className="notificacoes-list">
          {notificacoes.map((notificacao) => {
            // Verificar se a estrutura da notificação é válida
            if (!notificacao || !notificacao.notificacao) {
              console.error('Notificação inválida:', notificacao);
              return null;
            }

            const tipo = notificacao.notificacao.tipo;
            const estiloTipo = getNotificacaoClass(tipo);

            return (
              <li 
                key={notificacao.id || notificacao.id_notificacao} 
                className={`notificacao-item ${!notificacao.lida ? 'nao-lida' : ''} ${estiloTipo}`}
              >
                <div className="notificacao-conteudo">
                  <div className="notificacao-icone">
                    {getNotificacaoIconText(tipo)}
                  </div>
                  <div className="notificacao-texto">
                    <h3 className={`notificacao-titulo ${!notificacao.lida ? 'nao-lida' : ''}`}>
                      {notificacao.notificacao.titulo}
                    </h3>
                    <p className="notificacao-mensagem">{notificacao.notificacao.mensagem}</p>
                    <div className="notificacao-footer">
                      <small className="notificacao-time">
                        {formatRelativeTime(notificacao.notificacao.data_criacao)}
                      </small>
                      {notificacao.notificacao.id_referencia && (
                        <button
                          onClick={() => navegarParaItem(notificacao)}
                          className="notificacao-action"
                        >
                          Ver detalhes
                        </button>
                      )}
                    </div>
                  </div>
                  {!notificacao.lida && (
                    <button
                      onClick={() => handleMarcarComoLida(notificacao.id_notificacao)}
                      title="Marcar como lida"
                      className="notificacao-mark-read"
                    >
                      ✓
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Simple message toast */}
      {showMessage && (
        <div className="toast-message">
          {message}
        </div>
      )}
    </div>
  );
};

export default Notificacoes;