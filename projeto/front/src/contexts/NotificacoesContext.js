import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import axios from 'axios';
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
      const response = await axios.get('/api/notificacoes');
      
      // Ordenar por data de criação (mais recentes primeiro)
      const notificacoesOrdenadas = response.data.sort((a, b) => 
        new Date(b.notificacao.data_criacao) - new Date(a.notificacao.data_criacao)
      );
      
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
      const response = await axios.get('/api/notificacoes/nao-lidas/contagem');
      setNotificacoesNaoLidas(response.data.count);
    } catch (error) {
      console.error('Erro ao buscar notificações não lidas:', error);
    }
  }, [currentUser]);
  
  // Função para marcar uma notificação como lida
  const marcarComoLida = useCallback(async (idNotificacao) => {
    try {
      await axios.put(`/api/notificacoes/${idNotificacao}/lida`);
      
      // Atualizar estado local
      setNotificacoes(prevNotificacoes => 
        prevNotificacoes.map(notif => 
          notif.id_notificacao === idNotificacao 
            ? { ...notif, lida: true } 
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
      await axios.put('/api/notificacoes/marcar-todas-como-lidas');
      
      // Atualizar estado local
      setNotificacoes(prevNotificacoes =>
        prevNotificacoes.map(notif => ({ ...notif, lida: true }))
      );
      
      // Atualizar contagem
      setNotificacoesNaoLidas(0);
      
      return { success: true, message: 'Todas as notificações foram marcadas como lidas' };
    } catch (err) {
      console.error('Erro ao marcar todas notificações como lidas:', err);
      return { success: false, message: 'Erro ao marcar todas notificações como lidas' };
    }
  }, []);
  
  // Carregar contagem inicial de notificações não lidas
  useEffect(() => {
    if (currentUser) {
      buscarNotificacoesNaoLidas();
    }
  }, [currentUser, buscarNotificacoesNaoLidas]);
  
  // Configurar escuta de socket.io para novas notificações
  useEffect(() => {
    if (!currentUser) return;
    
    if (window.socket) {
      window.socket.on('nova_notificacao', () => {
        buscarNotificacoesNaoLidas();
        buscarNotificacoes();
      });
    }
    
    return () => {
      if (window.socket) {
        window.socket.off('nova_notificacao');
      }
    };
  }, [currentUser, buscarNotificacoesNaoLidas, buscarNotificacoes]);
  
  // Definir função global
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