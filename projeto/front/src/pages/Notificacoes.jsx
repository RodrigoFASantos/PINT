import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotificacoes } from '../contexts/NotificacoesContext';
import Sidebar from "../components/Sidebar";
import "./css/Notificacoes.css";

/**
 * Componente principal da página de notificações pessoais
 * 
 * Centraliza toda a gestão e visualização de notificações do utilizador,
 * incluindo marcação como lida, navegação para itens relacionados e
 * receção de alertas em tempo real através de WebSocket.
 */
const Notificacoes = () => {
  const {
    notificacoes,
    loading,
    error,
    buscarNotificacoes,
    marcarComoLida,
    marcarTodasComoLidas
  } = useNotificacoes();

  // Estados locais para controlo da interface
  const [message, setMessage] = useState('');
  const [showMessage, setShowMessage] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  /**
   * Configuração inicial e listeners WebSocket para notificações em tempo real
   * 
   * Estabelece ligação com o servidor WebSocket para receber notificações
   * instantâneas e configura handlers para diferentes tipos de eventos.
   */
  useEffect(() => {
    // Carregar notificações existentes na inicialização
    buscarNotificacoes();

    // Configurar listeners WebSocket se a ligação estiver disponível
    if (window.socket) {
      console.log('🔔 A configurar listeners de notificação WebSocket...');
      
      /**
       * Handler principal para novas notificações recebidas via WebSocket
       * Atualiza a lista de notificações e mostra feedback visual ao utilizador
       */
      const handleNovaNotificacao = (data) => {
        console.log('📨 Nova notificação recebida via WebSocket:', data);
        
        // Recarregar lista de notificações para incluir a nova
        buscarNotificacoes();
        
        // Mostrar mensagem temporária ao utilizador
        const mensagem = data.mensagem || data.titulo || 'Nova notificação recebida';
        setMessage(mensagem);
        setShowMessage(true);
        setTimeout(() => setShowMessage(false), 4000);
      };

      /**
       * Handler específico para atualizações de cursos
       * Processa notificações sobre alterações em cursos onde o utilizador está inscrito
       */
      const handleCursoAtualizado = (data) => {
        console.log('📚 Curso atualizado via WebSocket:', data);
        buscarNotificacoes();
        
        const mensagem = data.nome_curso 
          ? `O curso "${data.nome_curso}" foi atualizado`
          : 'Um curso foi atualizado';
        
        setMessage(mensagem);
        setShowMessage(true);
        setTimeout(() => setShowMessage(false), 5000);
      };

      /**
       * Handler para alterações de formador
       * Alerta sobre mudanças de responsável em cursos inscritos
       */
      const handleFormadorAlterado = (data) => {
        console.log('👨‍🏫 Formador alterado via WebSocket:', data);
        buscarNotificacoes();
        
        const mensagem = data.nome_curso 
          ? `Alteração de formador no curso "${data.nome_curso}"`
          : 'Formador de um curso foi alterado';
        
        setMessage(mensagem);
        setShowMessage(true);
        setTimeout(() => setShowMessage(false), 5000);
      };

      /**
       * Handler para alterações de cronograma
       * Notifica sobre mudanças nas datas de início/fim de cursos
       */
      const handleDatasAlteradas = (data) => {
        console.log('📅 Datas de curso alteradas via WebSocket:', data);
        buscarNotificacoes();
        
        const mensagem = data.nome_curso 
          ? `Datas alteradas no curso "${data.nome_curso}"`
          : 'Datas de um curso foram alteradas';
        
        setMessage(mensagem);
        setShowMessage(true);
        setTimeout(() => setShowMessage(false), 5000);
      };

      /**
       * Handler para novos cursos disponíveis
       * Anuncia criação de novos cursos na plataforma
       */
      const handleNovoCurso = (data) => {
        console.log('✨ Novo curso disponível via WebSocket:', data);
        buscarNotificacoes();
        
        const mensagem = data.nome_curso 
          ? `Novo curso disponível: "${data.nome_curso}"`
          : 'Novo curso disponível no sistema';
        
        setMessage(mensagem);
        setShowMessage(true);
        setTimeout(() => setShowMessage(false), 6000);
      };

      // Registar todos os listeners de eventos WebSocket
      window.socket.on('nova_notificacao', handleNovaNotificacao);
      window.socket.on('curso_atualizado', handleCursoAtualizado);
      window.socket.on('formador_alterado', handleFormadorAlterado);
      window.socket.on('datas_alteradas', handleDatasAlteradas);
      window.socket.on('novo_curso', handleNovoCurso);

      // Teste de conectividade WebSocket
      window.socket.emit('ping');
      window.socket.on('pong', (response) => {
        console.log('🏓 WebSocket ping/pong bem-sucedido:', response);
      });

    } else {
      console.warn('⚠️ Socket WebSocket não disponível para notificações');
      console.log('ℹ️ As notificações funcionarão apenas ao recarregar a página');
    }

    // Limpeza dos listeners quando o componente é desmontado
    return () => {
      if (window.socket) {
        console.log('🧹 A remover listeners de notificação WebSocket...');
        window.socket.off('nova_notificacao');
        window.socket.off('curso_atualizado');
        window.socket.off('formador_alterado');
        window.socket.off('datas_alteradas');
        window.socket.off('novo_curso');
        window.socket.off('pong');
      }
    };
  }, [buscarNotificacoes]);

  /**
   * Marca uma notificação específica como lida
   * Atualiza o estado da notificação e mostra feedback ao utilizador
   */
  const handleMarcarComoLida = async (idNotificacao) => {
    const result = await marcarComoLida(idNotificacao);
    setMessage(result.message);
    setShowMessage(true);
    setTimeout(() => setShowMessage(false), 3000);
  };

  /**
   * Marca todas as notificações como lidas numa operação em lote
   * Útil para limpar rapidamente o centro de notificações
   */
  const handleMarcarTodasComoLidas = async () => {
    const result = await marcarTodasComoLidas();
    setMessage(result.message);
    setShowMessage(true);
    setTimeout(() => setShowMessage(false), 3000);
  };

  /**
   * Navega para a página relacionada com a notificação
   * Determina o destino baseado no tipo de notificação e ID de referência
   */
  const navegarParaItem = (notificacao) => {
    if (!notificacao || !notificacao.notificacao) {
      return;
    }

    const { tipo, id_referencia } = notificacao.notificacao;

    // Determinar rota de destino baseada no tipo de notificação
    switch (tipo) {
      case 'curso_adicionado':
      case 'formador_alterado':
      case 'data_curso_alterada':
      case 'curso_alterado':
        navigate(`/cursos/${id_referencia}`);
        break;
      
      case 'formador_criado':
        navigate(`/formadores/${id_referencia}`);
        break;
      
      case 'admin_criado':
        navigate(`/admin/users/${id_referencia}`);
        break;
      
      default:
        console.log('Tipo de notificação sem navegação definida:', tipo);
        break;
    }
  };

  /**
   * Retorna emoji apropriado para o tipo de notificação
   * Melhora a experiência visual do utilizador
   */
  const getNotificacaoIconText = (tipo) => {
    const icones = {
      'curso_adicionado': '📚',
      'formador_alterado': '✏️',
      'formador_criado': '👤',
      'admin_criado': '👑',
      'data_curso_alterada': '📅',
      'curso_alterado': '🔄'
    };

    return icones[tipo] || '🔔';
  };

  /**
   * Retorna classe CSS específica para o tipo de notificação
   * Permite estilização diferenciada por categoria de alerta
   */
  const getNotificacaoClass = (tipo) => {
    const classes = {
      'curso_adicionado': 'notificacao-curso',
      'formador_alterado': 'notificacao-formador',
      'formador_criado': 'notificacao-formador',
      'admin_criado': 'notificacao-admin',
      'data_curso_alterada': 'notificacao-data',
      'curso_alterado': 'notificacao-curso-alterado'
    };

    return classes[tipo] || '';
  };

  /**
   * Formata timestamp numa string relativa legível (há X tempo)
   * Converte datas absolutas em texto contextual para melhor UX
   */
  const formatRelativeTime = (dateString) => {
    if (!dateString) return 'data desconhecida';

    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInSeconds = Math.floor((now - date) / 1000);

      // Menos de 1 minuto
      if (diffInSeconds < 60) return 'há poucos segundos';

      // Menos de 1 hora
      const diffInMinutes = Math.floor(diffInSeconds / 60);
      if (diffInMinutes < 60) {
        return `há ${diffInMinutes} minuto${diffInMinutes > 1 ? 's' : ''}`;
      }

      // Menos de 1 dia
      const diffInHours = Math.floor(diffInMinutes / 60);
      if (diffInHours < 24) {
        return `há ${diffInHours} hora${diffInHours > 1 ? 's' : ''}`;
      }

      // Menos de 1 mês
      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays < 30) {
        return `há ${diffInDays} dia${diffInDays > 1 ? 's' : ''}`;
      }

      // Mais de 1 mês
      const diffInMonths = Math.floor(diffInDays / 30);
      return `há ${diffInMonths} mês${diffInMonths > 1 ? 'es' : ''}`;
    } catch (error) {
      return 'data inválida';
    }
  };

  // Contar notificações não lidas com validação de segurança
  const notificacoesNaoLidas = Array.isArray(notificacoes) ? 
    notificacoes.filter(n => n && !n.lida).length : 0;

  /**
   * Renderização especial para erro de serviço indisponível
   * Mostra interface amigável durante manutenção do sistema
   */
  if (error && error.includes('503')) {
    return (
      <div className="notificacoes-container">
        <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        
        <div className="notificacoes-error-container">
          <div className="notificacoes-error-icon">⚠️</div>
          <h2>Serviço Temporariamente Indisponível</h2>
          <p>O sistema de notificações está a ser atualizado.</p>
          <p>Por favor, tenta novamente em alguns momentos.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="retry-button"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="notificacoes-container">
      <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      
      {/* Cabeçalho com título e contagem de notificações pendentes */}
      <div className="notificacoes-header">
        <h1 className="notificacoes-title">
          Notificações 
          {notificacoesNaoLidas > 0 && (
            <span className="badge" title={`${notificacoesNaoLidas} notificações não lidas`}>
              {notificacoesNaoLidas}
            </span>
          )}
        </h1>

        {/* Botão para marcar todas como lidas (só aparece se houver pendentes) */}
        {notificacoesNaoLidas > 0 && (
          <button
            onClick={handleMarcarTodasComoLidas}
            className="mark-all-button"
            title="Marcar todas as notificações como lidas"
          >
            Marcar todas como lidas
          </button>
        )}
      </div>

      {/* Estados da aplicação: carregamento, erro ou lista de notificações */}
      {loading ? (
        <div className="notificacoes-loading">
          <div className="loading-spinner"></div>
          <p>A carregar notificações...</p>
        </div>
      ) : error ? (
        <div className="notificacoes-error">
          <span className="error-icon">❌</span>
          <span className="error-text">{error}</span>
          <button 
            onClick={buscarNotificacoes} 
            className="retry-small-button"
          >
            Tentar novamente
          </button>
        </div>
      ) : !Array.isArray(notificacoes) || notificacoes.length === 0 ? (
        <div className="notificacoes-empty">
          <div className="empty-icon">🔔</div>
          <h3>Sem notificações</h3>
          <p>Não tens notificações neste momento. Quando houver novidades, aparecerão aqui.</p>
        </div>
      ) : (
        <ul className="notificacoes-list">
          {notificacoes.map((notificacao) => {
            // Verificar se a notificação tem estrutura válida
            if (!notificacao || !notificacao.notificacao) {
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
                  {/* Ícone visual da notificação */}
                  <div className="notificacao-icone" title={`Notificação: ${tipo}`}>
                    {getNotificacaoIconText(tipo)}
                  </div>
                  
                  {/* Conteúdo principal da notificação */}
                  <div className="notificacao-texto">
                    <h3 className={`notificacao-titulo ${!notificacao.lida ? 'nao-lida' : ''}`}>
                      {notificacao.notificacao.titulo}
                    </h3>
                    <p className="notificacao-mensagem">
                      {notificacao.notificacao.mensagem}
                    </p>
                    
                    {/* Rodapé com timestamp e ações disponíveis */}
                    <div className="notificacao-footer">
                      <small className="notificacao-time" title={new Date(notificacao.notificacao.data_criacao).toLocaleString('pt-PT')}>
                        {formatRelativeTime(notificacao.notificacao.data_criacao)}
                      </small>
                      
                      {/* Botão de navegação para item relacionado */}
                      {notificacao.notificacao.id_referencia && (
                        <button
                          onClick={() => navegarParaItem(notificacao)}
                          className="notificacao-action"
                          title="Ver detalhes relacionados"
                        >
                          Ver detalhes
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* Botão para marcar como lida (só aparece se não estiver lida) */}
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

      {/* Mensagem toast para feedback de ações do utilizador */}
      {showMessage && (
        <div className="toast-message" role="alert">
          <span className="toast-icon">ℹ️</span>
          <span className="toast-text">{message}</span>
        </div>
      )}
    </div>
  );
};

export default Notificacoes;