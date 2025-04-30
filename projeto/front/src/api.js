const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';

// Funções para gerar URLs de imagens
const formatarEmailParaURL = (email) => {
  if (!email) return '';
  // Substitui @ por _at_ e . por _ para formar o slug do usuário
  return email.replace(/@/g, '_at_').replace(/\./g, '_');
};

// Objeto com URLs de imagens
const IMAGES = {
  // URLs para imagens padrão
  DEFAULT_AVATAR: `${API_BASE}/uploads/AVATAR.png`,
  DEFAULT_CAPA: `${API_BASE}/uploads/CAPA.png`,

  // Formadores - usando o mesmo caminho dos usuários
  FORMADOR: (email) => `${API_BASE}/uploads/users/${formatarEmailParaURL(email)}/${email}_AVATAR.png`,
  
  // URLs para imagens de users
  USER_AVATAR: (email) => `${API_BASE}/uploads/users/${formatarEmailParaURL(email)}/${email}_AVATAR.png`,
  USER_CAPA: (email) => `${API_BASE}/uploads/users/${formatarEmailParaURL(email)}/${email}_CAPA.png`,
  
  // URLs para imagens de cursos
  CURSO_CAPA: (cursoSlug) => `${API_BASE}/uploads/cursos/${cursoSlug}/capa.png`,
};

export default API_BASE;
export { IMAGES };