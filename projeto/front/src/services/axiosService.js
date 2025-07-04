/**
 * Serviço HTTP centralizado usando Axios
 * 
 * Este módulo configura uma instância do Axios com:
 * - URL base importada da configuração da API
 * - Interceptadores para autenticação automática
 * - Tratamento centralizado de erros
 * - Serviços específicos para notificações
 */

import axios from 'axios';
import API_BASE from '../api';

/**
 * Instância configurada do Axios
 * 
 * Configurações:
 * - baseURL: URL base da API
 * - timeout: 10 segundos
 * - headers: Content-Type padrão JSON
 */
const axiosInstance = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

/**
 * Interceptador de requisições
 * 
 * Adiciona automaticamente o token de autorização a todas as requisições
 * se estiver disponível no localStorage
 */
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Erro no interceptador de requisição:', error);
    return Promise.reject(error);
  }
);

/**
 * Interceptador de respostas
 * 
 * Trata erros de forma centralizada e gere casos específicos como:
 * - 401: Sessão expirada (redireciona para login)
 * - Outros erros HTTP
 * - Erros de rede
 */
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Log do erro para diagnóstico
    if (error.response) {
      console.error(`Erro ${error.response.status} na API:`, error.response.data);
      
      // Tratamento específico para erro 401 (não autorizado)
      if (error.response.status === 401) {
        console.warn('Sessão expirada. A redirecionar para o login...');
        
        // Limpar dados de autenticação
        localStorage.removeItem('token');
        localStorage.removeItem('nomeUsuario');
        
        // Redirecionar para página de login
        window.location.href = '/login';
      }
    } else if (error.request) {
      // Erro de rede ou servidor inacessível
      console.error('Servidor inacessível ou erro de rede:', error.message);
    } else {
      // Erro na configuração da requisição
      console.error('Erro na configuração da requisição:', error.message);
    }
    
    return Promise.reject(error);
  }
);

/**
 * Serviço para gestão de notificações
 * 
 * Centraliza todas as operações relacionadas com notificações
 */
export const notificacoesService = {
  /**
   * Buscar todas as notificações do utilizador autenticado
   * 
   * @returns {Promise} Promise com a resposta da API
   */
  getNotificacoes: () => {
    return axiosInstance.get('/notificacoes');
  },
  
  /**
   * Buscar contagem de notificações não lidas
   * 
   * @returns {Promise} Promise com a contagem de notificações não lidas
   */
  getNotificacoesNaoLidasContagem: () => {
    return axiosInstance.get('/notificacoes/nao-lidas/contagem');
  },
  
  /**
   * Marcar uma notificação específica como lida
   * 
   * @param {number} idNotificacao - ID da notificação a marcar como lida
   * @returns {Promise} Promise com a resposta da API
   */
  marcarComoLida: (idNotificacao) => {
    return axiosInstance.put(`/notificacoes/${idNotificacao}/lida`);
  },
  
  /**
   * Marcar todas as notificações como lidas
   * 
   * @returns {Promise} Promise com a resposta da API
   */
  marcarTodasComoLidas: () => {
    return axiosInstance.put('/notificacoes/marcar-todas-como-lidas');
  }
};

export default axiosInstance;