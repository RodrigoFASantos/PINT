import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { notificacoesService } from '../services/axiosService';
import { useAuth } from './AuthContext';

// Criar o contexto
const NotificacoesContext = createContext();

// Hook personalizado para acessar o contexto
export function useNotificacoes() {
  return useContext(NotificacoesContext);
}

// Provider que envolve a aplicação
export function NotificacoesProvider({ children }) {
  const [notificacoes, setNotificacoes] = useState([]);
  const [notificacoesNaoLidas, setNotificacoesNaoLidas] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const { currentUser } = useAuth();
  
  // Função para buscar notificações
  const buscarNotificacoes = useCallback(async () => {
    if (!currentUser) return;
    
    try {
      setLoading(true);
      console.log('Buscando notificações do usuário...');
      
      const response = await notificacoesService.getNotificacoes();
      
      console.log('Resposta da API de notificações:', response.data);
      
      if (!response.data) {
        console.error('Resposta vazia da API');
        throw new Error('Resposta vazia da API');
      }
      
      // Ordenar por data de criação (mais recentes primeiro)
      const notificacoesOrdenadas = response.data.sort((a, b) => {
        const dataA = a.notificacao?.data_criacao || '';
        const dataB = b.notificacao?.data_criacao || '';
        return new Date(dataB) - new Date(dataA);
      });
      
      console.log('Notificações processadas:', notificacoesOrdenadas);
      
      setNotificacoes(notificacoesOrdenadas);
      setError(null);
    } catch (err) {
      console.error('Erro ao carregar notificações:', err);
      setError('Não foi possível carregar as notificações. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  }, [currentUser]);
  
  // Função para buscar contagem de notificações não lidas
  const buscarNotificacoesNaoLidas = useCallback(async () => {
    if (!currentUser) return;
    
    try {
      console.log('Buscando contagem de notificações não lidas...');
      
      const response = await notificacoesService.getNotificacoesNaoLidasContagem();
      
      console.log('Contagem de notificações não lidas:', response.data);
      
      if (response.data && typeof response.data.count === 'number') {
        setNotificacoesNaoLidas(response.data.count);
      } else {
        console.warn('Formato inesperado para contagem:', response.data);
        // Tentar extrair a contagem de outra forma, caso o formato da resposta seja diferente
        const count = response.data?.count || response.data?.naoLidas || 0;
        setNotificacoesNaoLidas(count);
      }
    } catch (error) {
      console.error('Erro ao buscar notificações não lidas:', error);
      // Não definir erro aqui para não afetar a experiência do usuário
    }
  }, [currentUser]);
  
  // Função para marcar uma notificação como lida
  const marcarComoLida = useCallback(async (idNotificacao) => {
    try {
      console.log(`Marcando notificação ${idNotificacao} como lida...`);
      
      await notificacoesService.marcarComoLida(idNotificacao);
      
      console.log(`Notificação ${idNotificacao} marcada como lida`);
      
      // Atualizar estado local
      setNotificacoes(prevNotificacoes => 
        prevNotificacoes.map(notif => 
          notif.id_notificacao === idNotificacao 
            ? { ...notif, lida: true, data_leitura: new Date().toISOString() } 
            : notif
        )
      );
      
      // Atualizar contagem de não lidas
      buscarNotificacoesNaoLidas();
      
      return { success: true, message: 'Notificação marcada como lida' };
    } catch (err) {
      console.error('Erro ao marcar notificação como lida:', err);
      return { success: false, message: 'Erro ao marcar notificação como lida' };
    }
  }, [buscarNotificacoesNaoLidas]);
  
  // Função para marcar todas as notificações como lidas
  const marcarTodasComoLidas = useCallback(async () => {
    try {
      console.log('Marcando todas as notificações como lidas...');
      
      await notificacoesService.marcarTodasComoLidas();
      
      console.log('Todas as notificações marcadas como lidas');
      
      // Atualizar estado local
      setNotificacoes(prevNotificacoes =>
        prevNotificacoes.map(notif => ({ 
          ...notif, 
          lida: true, 
          data_leitura: new Date().toISOString() 
        }))
      );
      
      // Atualizar contagem
      setNotificacoesNaoLidas(0);
      
      return { success: true, message: 'Todas as notificações foram marcadas como lidas' };
    } catch (err) {
      console.error('Erro ao marcar todas notificações como lidas:', err);
      return { success: false, message: 'Erro ao marcar todas notificações como lidas' };
    }
  }, []);
  
  // Carregar notificações e contagem inicial ao montar o componente
  useEffect(() => {
    if (currentUser) {
      buscarNotificacoesNaoLidas();
      buscarNotificacoes();
    }
  }, [currentUser, buscarNotificacoes, buscarNotificacoesNaoLidas]);
  
  // Configurar escuta de socket.io para novas notificações
  useEffect(() => {
    if (!currentUser) return;
    
    if (window.socket) {
      console.log('Configurando socket para notificações');
      window.socket.on('nova_notificacao', (data) => {
        console.log('Nova notificação recebida via socket:', data);
        buscarNotificacoesNaoLidas();
        buscarNotificacoes();
      });
    }
    
    return () => {
      if (window.socket) {
        console.log('Removendo listener de socket para notificações');
        window.socket.off('nova_notificacao');
      }
    };
  }, [currentUser, buscarNotificacoesNaoLidas, buscarNotificacoes]);
  
  // Definir função global para atualização de notificações
  useEffect(() => {
    window.atualizarContagemNotificacoes = buscarNotificacoesNaoLidas;
    
    return () => {
      window.atualizarContagemNotificacoes = undefined;
    };
  }, [buscarNotificacoesNaoLidas]);
  
  // Disponibilizar o contexto
  const value = {
    notificacoes,
    notificacoesNaoLidas,
    loading,
    error,
    buscarNotificacoes,
    buscarNotificacoesNaoLidas,
    marcarComoLida,
    marcarTodasComoLidas
  };
  
  return (
    <NotificacoesContext.Provider value={value}>
      {children}
    </NotificacoesContext.Provider>
  );
}