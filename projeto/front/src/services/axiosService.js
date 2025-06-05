import axios from 'axios';

// Importar a URL base do arquivo api.js para manter consistência
import API_BASE from '../api';

console.log('🔧 [AXIOS SERVICE] =================================');
console.log('🔧 [AXIOS SERVICE] URL Base importada:', API_BASE);
console.log('🔧 [AXIOS SERVICE] =================================');

// Criar uma instância do axios com a configuração necessária
const axiosInstance = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptador para adicionar o token a todas as requisições
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    console.log('🔧 [AXIOS SERVICE] Interceptor request:', {
      url: config.url,
      baseURL: config.baseURL,
      fullURL: `${config.baseURL}${config.url}`,
      hasToken: !!token
    });
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('🔧 [AXIOS SERVICE] Erro no interceptor request:', error);
    return Promise.reject(error);
  }
);

// Interceptador para logs e tratamento de erros
axiosInstance.interceptors.response.use(
  (response) => {
    // Adicionar logs para depuração em desenvolvimento
    console.log(`✅ [AXIOS SERVICE] Resposta de ${response.config.url}:`, response.data);
    return response;
  },
  (error) => {
    console.error('❌ [AXIOS SERVICE] Erro na requisição:', {
      url: error.config?.url,
      baseURL: error.config?.baseURL,
      fullURL: error.config ? `${error.config.baseURL}${error.config.url}` : 'N/A',
      status: error.response?.status,
      message: error.message,
      type: error.code
    });
    
    if (error.response) {
      console.error(`❌ [AXIOS SERVICE] Erro ${error.response.status} em ${error.config?.url}:`, error.response.data);
      
      // Tratamento específico para 401 (não autorizado)
      if (error.response.status === 401) {
        // Lógica para redirecionamento ao login ou refresh token
        console.warn('🚨 [AXIOS SERVICE] Sessão expirada ou inválida. Redirecionando...');
        localStorage.removeItem('token');
        localStorage.removeItem('nomeUsuario');
        window.location.href = '/login';
      }
    } else if (error.request) {
      console.error('🚨 [AXIOS SERVICE] Sem resposta do servidor:', error.request);
      console.error('🚨 [AXIOS SERVICE] Possível problema de conectividade ou CORS');
    } else {
      console.error('🚨 [AXIOS SERVICE] Erro ao configurar requisição:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// Serviço para notificações
export const notificacoesService = {
  // Buscar todas as notificações do usuário
  getNotificacoes: () => {
    console.log('📬 [AXIOS SERVICE] Buscando notificações...');
    return axiosInstance.get('/notificacoes');
  },
  
  // Buscar contagem de notificações não lidas
  getNotificacoesNaoLidasContagem: () => {
    console.log('📬 [AXIOS SERVICE] Buscando contagem de notificações não lidas...');
    return axiosInstance.get('/notificacoes/nao-lidas/contagem');
  },
  
  // Marcar uma notificação como lida
  marcarComoLida: (idNotificacao) => {
    console.log(`📬 [AXIOS SERVICE] Marcando notificação ${idNotificacao} como lida...`);
    return axiosInstance.put(`/notificacoes/${idNotificacao}/lida`);
  },
  
  // Marcar todas as notificações como lidas
  marcarTodasComoLidas: () => {
    console.log('📬 [AXIOS SERVICE] Marcando todas as notificações como lidas...');
    return axiosInstance.put('/notificacoes/marcar-todas-como-lidas');
  }
};

export default axiosInstance;