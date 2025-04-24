const API_BASE = 'http://localhost:4000/api';

export const IMAGES = {
  // Cursos - Função aprimorada que usa o caminho da imagem do backend se disponível
  CURSO: (nomeCursoOuPath) => {
    // Se for um caminho completo (tem /)
    if (typeof nomeCursoOuPath === 'string' && nomeCursoOuPath.includes('/')) {
      return `${API_BASE}/${nomeCursoOuPath}`;
    }
    // Se for apenas o nome do curso (compatibilidade com código existente)
    return `${API_BASE}/uploads/cursos/${nomeCursoOuPath}.png`;
  },

  // Imagens de user - IMPORTANTE: estas funções estavam faltando e são usadas no Navbar
  USER_AVATAR: (email) => `${API_BASE}/uploads/users/${email}_AVATAR.png`,
  USER_CAPA: (email) => `${API_BASE}/uploads/users/${email}_CAPA.png`,
  
  // Imagens padrão 
  DEFAULT_AVATAR: `${API_BASE}/uploads/AVATAR.png`,
  DEFAULT_CAPA: `${API_BASE}/uploads/CAPA.png`,
  
  // Formadores - usando o mesmo caminho dos usuários
  FORMADOR: (email) => `${API_BASE}/uploads/users/${email}_AVATAR.png`,
};

export default API_BASE;