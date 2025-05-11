const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';

const formatarEmailParaURL = (email) => {
  if (!email) return '';
  return email.replace(/@/g, '_at_').replace(/\./g, '_');
};

const IMAGES = {
  DEFAULT_AVATAR: `${API_BASE}/uploads/AVATAR.png`,
  DEFAULT_CAPA: `${API_BASE}/uploads/CAPA.png`,
   
  // URLs para imagens de users com nomes fixos
  USER_AVATAR: (email) => {
    // Adicionamos um parâmetro de query para evitar cache do navegador
    const timestamp = Date.now();
    return `${API_BASE}/uploads/users/${formatarEmailParaURL(email)}/${email}_AVATAR.png?t=${timestamp}`;
  },
  USER_CAPA: (email) => {
    // Adicionamos um parâmetro de query para evitar cache do navegador
    const timestamp = Date.now();
    return `${API_BASE}/uploads/users/${formatarEmailParaURL(email)}/${email}_CAPA.png?t=${timestamp}`;
  },

  CURSO: (cursoNome) => {
    // Normalizar o nome do curso para usar no caminho (opcional)
    const cursoSlug = cursoNome.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    // Adicionar timestamp para evitar cache
    const timestamp = Date.now();
    return `${API_BASE}/uploads/cursos/${cursoSlug}/capa.png?t=${timestamp}`;
  }
};

export default API_BASE;
export { IMAGES };