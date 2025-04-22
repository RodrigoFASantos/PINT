const API_BASE = "http://localhost:4000/api";

// Configurações para URLs de imagens
export const IMAGES = {
  // Cursos
  CURSO: (nomeCurso) => `${API_BASE}/uploads/cursos/${nomeCurso}.png`,

  // Users
  DEFAULT_AVATAR: 'http://localhost:4000/uploads/AVATAR.png',
  DEFAULT_CAPA: 'http://localhost:4000/uploads/CAPA.png',

  // Imagens de user
  USER_AVATAR: (email) => `${API_BASE}/uploads/users/${email}_AVATAR.png`,
  USER_CAPA: (email) => `${API_BASE}/uploads/users/${email}_CAPA.png`,
  
  // Formadores - usando o mesmo caminho dos usuários, pois todos são armazenados na mesma pasta
  FORMADOR: (email) => `${API_BASE}/uploads/users/${email}_AVATAR.png`,
};

export default API_BASE;