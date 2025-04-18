import axios from 'axios';

// Configuração base do axios
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  timeout: 10000
});

// Interceptor para adicionar o token de autenticação
api.interceptors.request.use(
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

// Interceptor para tratar erros de autenticação
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Redirecionar para login se o token expirou ou não é válido
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Redirecionar para a página de login apenas se não estiver já na página de login
      if (!window.location.pathname.includes('/login')) {
        window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
      }
    }
    return Promise.reject(error);
  }
);

// Serviço de Autenticação
export const authService = {
  login: async (email, password) => {
    try {
      const response = await api.post('/users/login', { email, password });
      
      // Salvar token e informações do usuário
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('userId', response.data.id_utilizador);
      localStorage.setItem('user', JSON.stringify({
        id_utilizador: response.data.id_utilizador,
        nome: response.data.nome,
        id_cargo: response.data.id_cargo,
        cargo: response.data.cargo,
        primeiro_login: response.data.primeiro_login
      }));
      
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erro ao realizar login' };
    }
  },
  
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('user');
  },
  
  changePassword: async (id_utilizador, nova_password) => {
    try {
      const response = await api.post('/users/change-password', { id_utilizador, nova_password });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erro ao alterar senha' };
    }
  },
  
  getProfile: async () => {
    try {
      const response = await api.get('/users/perfil');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erro ao obter perfil do usuário' };
    }
  },
  
  updateProfile: async (userData) => {
    try {
      const response = await api.put('/users/perfil', userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erro ao atualizar perfil' };
    }
  }
};

// Serviço de Cursos
export const cursosService = {
  getAllCursos: async (page = 1, limit = 10) => {
    try {
      const response = await api.get(`/cursos?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erro ao buscar cursos' };
    }
  },
  
  getCursoById: async (id) => {
    try {
      const response = await api.get(`/cursos/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erro ao buscar detalhes do curso' };
    }
  },
  
  getCursosByCategoria: async (id_categoria, page = 1, limit = 10) => {
    try {
      const response = await api.get(`/cursos/categoria/${id_categoria}?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erro ao buscar cursos por categoria' };
    }
  },
  
  getCursosByArea: async (id_area, page = 1, limit = 10) => {
    try {
      const response = await api.get(`/cursos/area/${id_area}?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erro ao buscar cursos por área' };
    }
  },
  
  createCurso: async (cursoData) => {
    try {
      // Se contém arquivo, usar FormData
      if (cursoData.imagem instanceof File) {
        const formData = new FormData();
        
        // Adicionar campos ao FormData
        Object.keys(cursoData).forEach(key => {
          if (key === 'imagem') {
            formData.append('imagem', cursoData.imagem);
          } else {
            formData.append(key, cursoData[key]);
          }
        });
        
        const response = await api.post('/cursos', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        
        return response.data;
      } else {
        // Sem imagem, enviar JSON normal
        const response = await api.post('/cursos', cursoData);
        return response.data;
      }
    } catch (error) {
      throw error.response?.data || { message: 'Erro ao criar curso' };
    }
  },
  
  updateCurso: async (id, cursoData) => {
    try {
      // Se contém arquivo, usar FormData
      if (cursoData.imagem instanceof File) {
        const formData = new FormData();
        
        // Adicionar campos ao FormData
        Object.keys(cursoData).forEach(key => {
          if (key === 'imagem') {
            formData.append('imagem', cursoData.imagem);
          } else {
            formData.append(key, cursoData[key]);
          }
        });
        
        const response = await api.put(`/cursos/${id}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        
        return response.data;
      } else {
        // Sem imagem, enviar JSON normal
        const response = await api.put(`/cursos/${id}`, cursoData);
        return response.data;
      }
    } catch (error) {
      throw error.response?.data || { message: 'Erro ao atualizar curso' };
    }
  },
  
  deleteCurso: async (id) => {
    try {
      const response = await api.delete(`/cursos/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erro ao excluir curso' };
    }
  }
};

// Serviço de Inscrições
export const inscricoesService = {
  getMinhasInscricoes: async () => {
    try {
      const response = await api.get('/users/inscricoes');
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erro ao buscar inscrições' };
    }
  },
  
  verificarInscricao: async (id_curso) => {
    try {
      const response = await api.get(`/users/inscrito/${id_curso}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erro ao verificar inscrição' };
    }
  },
  
  inscreverCurso: async (id_curso, dados = {}) => {
    try {
      const userId = localStorage.getItem('userId');
      const response = await api.post('/inscricoes', {
        id_utilizador: userId,
        id_curso,
        ...dados
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erro ao realizar inscrição' };
    }
  },
  
  cancelarInscricao: async (id_curso) => {
    try {
      const response = await api.put(`/users/cancelar-inscricao/${id_curso}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erro ao cancelar inscrição' };
    }
  },
  
  getAlunosInscritos: async (id_curso) => {
    try {
      const response = await api.get(`/cursos/${id_curso}/inscricoes`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erro ao buscar alunos inscritos' };
    }
  }
};

// Serviço de Conteúdos
export const conteudosService = {
  getConteudosCurso: async (id_curso) => {
    try {
      const response = await api.get(`/conteudos/curso/${id_curso}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erro ao buscar conteúdos do curso' };
    }
  },
  
  createConteudo: async (conteudoData) => {
    try {
      // Se contém arquivo, usar FormData
      if (conteudoData.arquivo instanceof File) {
        const formData = new FormData();
        
        // Adicionar campos ao FormData
        Object.keys(conteudoData).forEach(key => {
          if (key === 'arquivo') {
            formData.append('arquivo', conteudoData.arquivo);
          } else {
            formData.append(key, conteudoData[key]);
          }
        });
        
        const response = await api.post('/conteudos', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        
        return response.data;
      } else {
        // Sem arquivo, enviar JSON normal
        const response = await api.post('/conteudos', conteudoData);
        return response.data;
      }
    } catch (error) {
      throw error.response?.data || { message: 'Erro ao criar conteúdo' };
    }
  },
  
  deleteConteudo: async (id) => {
    try {
      const response = await api.delete(`/conteudos/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Erro ao excluir conteúdo' };
    }
  }
};

// Exportar API e serviços
export default api;