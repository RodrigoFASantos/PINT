import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import { notificacoesService } from '../services/axiosService';
import { useAuth } from './AuthContext';

/**
 * Contexto principal para gestão de notificações em tempo real
 * 
 * Este contexto centraliza toda a lógica de notificações da aplicação,
 * integrando WebSocket para tempo real e persistência na base de dados.
 * Gere estados de leitura, contadores e atualizações automáticas.
 */

const NotificacoesContext = createContext();

/**
 * Hook personalizado para aceder ao contexto de notificações
 * Garante que o componente está envolvido pelo NotificacoesProvider
 */
export function useNotificacoes() {
  const context = useContext(NotificacoesContext);
  if (!context) {
    throw new Error('useNotificacoes tem de ser usado dentro de um NotificacoesProvider');
  }
  return context;
}

/**
 * Provider do contexto de notificações
 * Gere estados centralizados e comunicação WebSocket
 */
export function NotificacoesProvider({ children }) {
  // Estados principais das notificações
  const [notificacoes, setNotificacoes] = useState([]);
  const [notificacoesNaoLidas, setNotificacoesNaoLidas] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [webSocketConnected, setWebSocketConnected] = useState(false);
  
  // Refs para controlo de execução e prevenção de loops
  const isLoadingRef = useRef(false);
  const lastUserIdRef = useRef(null);
  
  const { currentUser } = useAuth();
  
  /**
   * Carrega notificações da API de forma segura
   * Evita requisições simultâneas e gere estados de carregamento
   */
  const buscarNotificacoes = useCallback(async () => {
    const userId = currentUser?.id_utilizador || currentUser?.id;
    
    // Limpar dados se não há utilizador autenticado
    if (!userId) {
      console.log('👤 Sem utilizador - a limpar notificações');
      setNotificacoes([]);
      setNotificacoesNaoLidas(0);
      setError(null);
      return;
    }
    
    // Prevenir múltiplas requisições simultâneas
    if (isLoadingRef.current) {
      console.log('⏳ Já a carregar notificações - a ignorar requisição duplicada');
      return;
    }
    
    try {
      isLoadingRef.current = true;
      setLoading(true);
      setError(null);
      
      console.log('📥 A carregar notificações da API...');
      const response = await notificacoesService.getNotificacoes();
      
      // Validar resposta da API
      if (!response || !response.data) {
        throw new Error('Resposta inválida da API de notificações');
      }
      
      // Filtrar apenas notificações válidas com dados completos
      const notificacoesValidas = Array.isArray(response.data) 
        ? response.data.filter(notif => 
            notif && 
            notif.notificacao && 
            notif.notificacao.titulo && 
            notif.notificacao.mensagem
          )
        : [];
      
      // Ordenar por data de criação (mais recentes primeiro)
      const notificacoesOrdenadas = notificacoesValidas.sort((a, b) => {
        const dataA = new Date(a.notificacao?.data_criacao || 0);
        const dataB = new Date(b.notificacao?.data_criacao || 0);
        return dataB - dataA;
      });
      
      setNotificacoes(notificacoesOrdenadas);
      console.log(`✅ ${notificacoesOrdenadas.length} notificações carregadas`);
      
      // Calcular contador de não lidas localmente
      const naoLidas = notificacoesOrdenadas.filter(n => !n.lida).length;
      setNotificacoesNaoLidas(naoLidas);
      console.log(`📊 ${naoLidas} notificações não lidas`);
      
    } catch (err) {
      console.error('❌ Erro ao carregar notificações:', err);
      
      // Mensagens específicas baseadas no tipo de erro
      if (err.response?.status === 503) {
        setError('Serviço de notificações temporariamente indisponível.');
      } else if (err.response?.status === 401) {
        setError('Sessão expirada. Inicia sessão novamente.');
      } else if (err.response?.status === 403) {
        setError('Não tens permissão para aceder às notificações.');
      } else if (!navigator.onLine) {
        setError('Sem ligação à internet. Verifica a tua ligação.');
      } else {
        setError('Não foi possível carregar as notificações. Tenta novamente mais tarde.');
      }
      
      // Limpar dados em caso de erro
      setNotificacoes([]);
      setNotificacoesNaoLidas(0);
      
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, []);
  
  /**
   * Atualiza apenas o contador de notificações não lidas
   * Função otimizada para atualizações frequentes de badges
   */
  const buscarNotificacoesNaoLidas = useCallback(async () => {
    const userId = currentUser?.id_utilizador || currentUser?.id;
    
    if (!userId) {
      setNotificacoesNaoLidas(0);
      return;
    }
    
    try {
      console.log('🔢 A atualizar contagem de não lidas...');
      const response = await notificacoesService.getNotificacoesNaoLidasContagem();
      
      const count = response?.data?.count || 0;
      setNotificacoesNaoLidas(count);
      console.log(`📊 ${count} notificações não lidas (API)`);
      
    } catch (error) {
      console.error('⚠️ Erro ao buscar contagem:', error);
      
      // Fallback: calcular localmente se API falhar
      const contadorLocal = notificacoes.filter(n => !n.lida).length;
      setNotificacoesNaoLidas(contadorLocal);
      console.log(`📊 ${contadorLocal} notificações não lidas (local)`);
    }
  }, [notificacoes]);
  
  /**
   * Marca uma notificação específica como lida
   * Atualiza primeiro localmente, depois confirma na API
   */
  const marcarComoLida = useCallback(async (idNotificacao) => {
    if (!idNotificacao) {
      return { success: false, message: 'ID de notificação inválido' };
    }
    
    try {
      console.log(`✓ A marcar notificação ${idNotificacao} como lida...`);
      
      // Atualização otimista: atualizar interface primeiro
      setNotificacoes(prev => 
        prev.map(notif => 
          notif.id_notificacao === idNotificacao 
            ? { ...notif, lida: true, data_leitura: new Date().toISOString() } 
            : notif
        )
      );
      
      setNotificacoesNaoLidas(prev => Math.max(0, prev - 1));
      
      // Confirmar na API
      await notificacoesService.marcarComoLida(idNotificacao);
      
      return { success: true, message: 'Notificação marcada como lida' };
    } catch (err) {
      console.error('❌ Erro ao marcar como lida:', err);
      
      // Reverter alteração se API falhar
      setNotificacoes(prev => 
        prev.map(notif => 
          notif.id_notificacao === idNotificacao 
            ? { ...notif, lida: false, data_leitura: null } 
            : notif
        )
      );
      
      // Recarregar contagem correta
      buscarNotificacoesNaoLidas();
      
      return { success: false, message: 'Erro ao marcar notificação como lida' };
    }
  }, [buscarNotificacoesNaoLidas]);
  
  /**
   * Marca todas as notificações como lidas
   * Operação em lote com atualização otimista
   */
  const marcarTodasComoLidas = useCallback(async () => {
    const naoLidas = notificacoes.filter(n => !n.lida);
    
    if (naoLidas.length === 0) {
      return { success: true, message: 'Todas as notificações já estão marcadas como lidas' };
    }
    
    try {
      console.log(`✓ A marcar ${naoLidas.length} notificações como lidas...`);
      
      // Atualização otimista local
      setNotificacoes(prev =>
        prev.map(notif => ({ 
          ...notif, 
          lida: true, 
          data_leitura: new Date().toISOString() 
        }))
      );
      
      setNotificacoesNaoLidas(0);
      
      // Confirmar na API
      await notificacoesService.marcarTodasComoLidas();
      
      return { 
        success: true, 
        message: `${naoLidas.length} notificações marcadas como lidas` 
      };
    } catch (err) {
      console.error('❌ Erro ao marcar todas como lidas:', err);
      
      // Recarregar se falhar
      buscarNotificacoes();
      
      return { success: false, message: 'Erro ao marcar todas notificações como lidas' };
    }
  }, [notificacoes, buscarNotificacoes]);
  
  /**
   * Efeito principal que carrega notificações quando o utilizador muda
   * Só executa quando há mudança real de utilizador
   */
  useEffect(() => {
    const userId = currentUser?.id_utilizador || currentUser?.id;
    
    // Verificar se o utilizador realmente mudou
    if (lastUserIdRef.current === userId) {
      return;
    }
    
    lastUserIdRef.current = userId;
    
    if (userId) {
      console.log(`👤 Utilizador ${userId} autenticado - a carregar notificações`);
      buscarNotificacoes();
    } else {
      console.log('👤 Utilizador não autenticado - a limpar notificações');
      setNotificacoes([]);
      setNotificacoesNaoLidas(0);
      setError(null);
      setWebSocketConnected(false);
    }
  }, [currentUser?.id_utilizador, currentUser?.id, buscarNotificacoes]);
  
  /**
   * Configuração do WebSocket para notificações em tempo real
   * Liga-se aos eventos do socket e processa notificações instantâneas
   */
  useEffect(() => {
    const userId = currentUser?.id_utilizador || currentUser?.id;
    
    if (!userId || !window.socket) {
      setWebSocketConnected(false);
      return;
    }
    
    const socket = window.socket;
    console.log('🔌 A configurar WebSocket para notificações...');
    
    /**
     * Processa chegada de nova notificação via WebSocket
     * Recarrega lista e mostra notificação nativa do browser
     */
    const handleNovaNotificacao = (data) => {
      console.log('📨 Nova notificação via WebSocket:', data);
      
      // Recarregar notificações para sincronizar
      buscarNotificacoes();
      
      // Mostrar notificação nativa do browser se permitida
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(data.titulo || 'Nova notificação', {
          body: data.mensagem || 'Tens uma nova notificação',
          icon: '/logo.png',
          tag: 'notificacao-' + Date.now()
        });
      }
    };
    
    /**
     * Handlers para eventos de conexão WebSocket
     */
    const handleConnect = () => {
      console.log('✅ WebSocket conectado');
      setWebSocketConnected(true);
    };
    
    const handleDisconnect = () => {
      console.log('❌ WebSocket desconectado');
      setWebSocketConnected(false);
    };
    
    // Registar listeners para todos os tipos de notificações
    socket.on('nova_notificacao', handleNovaNotificacao);
    socket.on('curso_atualizado', handleNovaNotificacao);
    socket.on('formador_alterado', handleNovaNotificacao);
    socket.on('datas_alteradas', handleNovaNotificacao);
    socket.on('novo_curso', handleNovaNotificacao);
    socket.on('curso_alterado', handleNovaNotificacao);
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    
    // Estado inicial da conexão
    setWebSocketConnected(socket.connected);
    
    // Cleanup: remover listeners quando componente desmonta
    return () => {
      socket.off('nova_notificacao', handleNovaNotificacao);
      socket.off('curso_atualizado', handleNovaNotificacao);
      socket.off('formador_alterado', handleNovaNotificacao);
      socket.off('datas_alteradas', handleNovaNotificacao);
      socket.off('novo_curso', handleNovaNotificacao);
      socket.off('curso_alterado', handleNovaNotificacao);
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
    };
  }, [currentUser?.id_utilizador, currentUser?.id, buscarNotificacoes]);
  
  /**
   * Disponibiliza funções globalmente no window para chamadas externas
   * Permite que outros componentes atualizem notificações diretamente
   */
  useEffect(() => {
    window.atualizarContagemNotificacoes = buscarNotificacoesNaoLidas;
    window.atualizarNotificacoes = buscarNotificacoes;
    
    return () => {
      window.atualizarContagemNotificacoes = undefined;
      window.atualizarNotificacoes = undefined;
    };
  }, [buscarNotificacoesNaoLidas, buscarNotificacoes]);
  
  /**
   * Força recarregamento completo das notificações
   * Reseta estados de erro e carregamento antes de recarregar
   */
  const recarregarNotificacoes = useCallback(() => {
    console.log('🔄 A forçar recarregamento de notificações...');
    setError(null);
    setLoading(false);
    isLoadingRef.current = false;
    buscarNotificacoes();
  }, [buscarNotificacoes]);
  
  // Valor do contexto com todos os estados e funções
  const value = {
    // Estados das notificações
    notificacoes,
    notificacoesNaoLidas,
    loading,
    error,
    webSocketConnected,
    
    // Funções de gestão
    buscarNotificacoes: recarregarNotificacoes,
    buscarNotificacoesNaoLidas,
    marcarComoLida,
    marcarTodasComoLidas,
    
    // Informações derivadas
    temNotificacoesNaoLidas: notificacoesNaoLidas > 0
  };
  
  return (
    <NotificacoesContext.Provider value={value}>
      {children}
    </NotificacoesContext.Provider>
  );
}