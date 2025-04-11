const API_BASE = "http://localhost:4000/api";

// Configurações para URLs de imagens
export const IMAGES = {
  // Cursos
  CURSO: (nomeCurso) => `${API_BASE}/uploads/cursos/${nomeCurso}.png`,

  // Users
  DEFAULT_AVATAR: 'http://localhost:4000/uploads/AVATAR.png',
  DEFAULT_CAPA: 'http://localhost:4000/uploads/CAPA.png',

  // Imagens padrão
  USER_AVATAR: (userName) => `/uploads/users/${userName}_avatar.png`,
  USER_CAPA: (userName) => `/uploads/users/${userName}_capa.png`,
};

export default API_BASE;