const API_BASE = "http://localhost:4000/api";

// Configurações para URLs de imagens
export const IMAGES = {
  // Cursos
  CURSO: (nomeCurso) => `${API_BASE}/uploads/cursos/${nomeCurso}.png`,
  // Users
  USER_AVATAR: (email) => `${API_BASE}/uploads/users/${email}-perfil.png`,
  USER_CAPA: (email) => `${API_BASE}/uploads/users/${email}-capa.png`,
  // Imagens padrão
  DEFAULT_AVATAR: `${API_BASE}/uploads/users/AVATAR.png`,
  DEFAULT_CAPA: `${API_BASE}/uploads/users/CAPA.png`,
};

export default API_BASE;