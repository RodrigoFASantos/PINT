import axios from 'axios';

// Criar uma instância do axios com configurações padrão
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Adicionar interceptor para incluir token de autenticação
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Adicionar interceptor para tratamento de erros
api.interceptors.response.use(
  response => {
    return response;
  },
  error => {
    // Tratar erros de autenticação (401)
    if (error.response && error.response.status === 401) {
      // Token expirado ou inválido
      localStorage.removeItem('token');
      localStorage.removeItem('nomeUsuario');
      
      // Redirecionar para a página de login
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

// Serviços específicos

// Autenticação
export const authService = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (userData) => api.post('/auth/register', userData),
  resetPassword: (email) => api.post('/auth/reset-password', { email }),
  changePassword: (data) => api.post('/auth/change-password', data)
};

// Usuários
export const userService = {
  getProfile: () => api.get('/user/profile'),
  updateProfile: (data) => api.put('/user/profile', data),
  getAllUsers: () => api.get('/admin/usuarios'),
  getUserById: (id) => api.get(`/admin/usuarios/${id}`),
  createUser: (data) => api.post('/admin/usuarios', data),
  updateUser: (id, data) => api.put(`/admin/usuarios/${id}`, data),
  toggleUserStatus: (id, ativo) => api.post(`/admin/usuarios/${id}/ativar-desativar`, { ativo }),
  // Adicionando métodos para inscrições
  getInscricoes: () => api.get('/users/inscricoes'),
  verificarInscricao: (cursoId) => api.get(`/users/inscrito/${cursoId}`),
  cancelarInscricao: (cursoId) => api.put(`/users/cancelar-inscricao/${cursoId}`)
};

// Cursos
export const cursoService = {
  getAllCursos: () => api.get('/cursos'),
  getCursoById: (id) => api.get(`/cursos/${id}`),
  getCursosByCategoria: (categoria) => api.get('/cursos', { params: { categoria } }),
  getMeusCursos: () => api.get('/formandos/meus-cursos'),
  getPercursoFormativo: () => api.get('/formandos/percurso-formativo'),
  inscricaoCurso: (id, data) => api.post(`/cursos/${id}/inscricao`, data),
  getCursosFormador: () => api.get('/formador/cursos'),
  addConteudoCurso: (id, data) => api.post(`/cursos/${id}/conteudos`, data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  avaliarAluno: (cursoId, alunoId, data) => api.post(`/cursos/${cursoId}/alunos/${alunoId}/avaliacao`, data),
  getCursosAdmin: (params) => api.get('/admin/cursos', { params }),
  createCurso: (data) => api.post('/admin/cursos', data),
  updateCurso: (id, data) => api.put(`/admin/cursos/${id}`, data),
  toggleCursoStatus: (id, ativo) => api.post(`/admin/cursos/${id}/ativar-desativar`, { ativo }),
  getInscritosCurso: (id) => api.get(`/admin/cursos/${id}/inscritos`),
  // Adicionando métodos para o novo fluxo de inscrição
  getConteudosCurso: (id) => api.get(`/conteudos/curso/${id}`),
  verificarVagasCurso: (id) => api.get(`/cursos/${id}/vagas`),
  inscreverCurso: (cursoId, dados) => api.post(`/inscricoes`, { id_curso: cursoId, ...dados })
};

// Fórum
export const forumService = {
  getCategorias: () => api.get('/categorias'),
  getTopicos: (params) => api.get('/forum/topicos', { params }),
  getTopicoById: (id) => api.get(`/forum/topico/${id}`),
  getComentarios: (topicoId) => api.get(`/forum/topico/${topicoId}/comentarios`),
  createTopico: (data) => api.post('/forum/topicos', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  addComentario: (topicoId, data) => api.post(`/forum/topico/${topicoId}/comentario`, data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  avaliarComentario: (comentarioId, avaliacao) => api.post(`/forum/comentario/${comentarioId}/avaliar`, { avaliacao }),
  denunciarComentario: (comentarioId, motivo) => api.post(`/forum/comentario/${comentarioId}/denunciar`, { motivo })
};

// Quiz (Bônus)
export const quizService = {
  getQuizByCurso: (cursoId) => api.get(`/cursos/${cursoId}/quiz`),
  getQuizById: (id) => api.get(`/quizzes/${id}`),
  submitQuiz: (id, respostas) => api.post(`/quizzes/${id}/submeter`, { respostas }),
  createQuiz: (cursoId, data) => api.post(`/cursos/${cursoId}/quiz`, data),
  updateQuiz: (id, data) => api.put(`/quizzes/${id}`, data)
};

// Inscrições (novo serviço)
export const inscricoesService = {
  getAllInscricoes: () => api.get('/inscricoes'),
  getMinhasInscricoes: () => api.get('/users/inscricoes'),
  verificarInscricao: (cursoId) => api.get(`/users/inscrito/${cursoId}`),
  inscreverCurso: (cursoId, dados) => api.post('/inscricoes', {
    id_curso: cursoId,
    ...dados
  }),
  cancelarInscricao: (cursoId) => api.put(`/users/cancelar-inscricao/${cursoId}`),
  getAlunosInscritos: (cursoId) => api.get(`/cursos/${cursoId}/inscricoes`)
};

// Conteúdos (novo serviço)
export const conteudosService = {
  getConteudosCurso: (cursoId) => api.get(`/conteudos/curso/${cursoId}`),
  createConteudo: (data) => {
    // Se contém arquivo, usar FormData
    if (data.arquivo && typeof data.arquivo !== 'string') {
      const formData = new FormData();
      
      Object.keys(data).forEach(key => {
        if (key === 'arquivo') {
          formData.append('arquivo', data.arquivo);
        } else {
          formData.append(key, data[key]);
        }
      });
      
      return api.post('/conteudos', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    } else {
      return api.post('/conteudos', data);
    }
  },
  deleteConteudo: (id) => api.delete(`/conteudos/${id}`)
};

export default api;