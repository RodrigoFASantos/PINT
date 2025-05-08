import axios from 'axios';

// URL base da API corrigida para porta 4000
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';

// Criar uma instância do axios com a configuração necessária
const axiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptador para adicionar o token a todas as requisições
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptador para logs e tratamento de erros
axiosInstance.interceptors.response.use(
  (response) => {
    // Adicionar logs para depuração em desenvolvimento
    console.log(`[API] Resposta de ${response.config.url}:`, response.data);
    return response;
  },
  (error) => {
    if (error.response) {
      console.error(`[API] Erro ${error.response.status} em ${error.config?.url}:`, error.response.data);
      
      // Tratamento específico para 401 (não autorizado)
      if (error.response.status === 401) {
        // Lógica para redirecionamento ao login ou refresh token
        console.warn('Sessão expirada ou inválida. Redirecionando...');
        localStorage.removeItem('token');
        localStorage.removeItem('nomeUsuario');
        window.location.href = '/login';
      }
    } else if (error.request) {
      console.error('[API] Sem resposta do servidor:', error.request);
    } else {
      console.error('[API] Erro ao configurar requisição:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// Serviço para notificações
export const notificacoesService = {
  // Buscar todas as notificações do usuário
  getNotificacoes: () => {
    return axiosInstance.get('/notificacoes');
  },
  
  // Buscar contagem de notificações não lidas
  getNotificacoesNaoLidasContagem: () => {
    return axiosInstance.get('/notificacoes/nao-lidas/contagem');
  },
  
  // Marcar uma notificação como lida
  marcarComoLida: (idNotificacao) => {
    return axiosInstance.put(`/notificacoes/${idNotificacao}/lida`);
  },
  
  // Marcar todas as notificações como lidas
  marcarTodasComoLidas: () => {
    return axiosInstance.put('/notificacoes/marcar-todas-como-lidas');
  }
};

export default axiosInstance;