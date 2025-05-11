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
    const timestamp = Date.now();
    return `${API_BASE}/uploads/users/${formatarEmailParaURL(email)}/${email}_AVATAR.png?t=${timestamp}`;
  },
  USER_CAPA: (email) => {
    const timestamp = Date.now();
    return `${API_BASE}/uploads/users/${formatarEmailParaURL(email)}/${email}_CAPA.png?t=${timestamp}`;
  },

  CURSO: (nomeCurso) => {
    return `${API_BASE}/uploads/cursos/${nomeCurso}/capa.png`;
  }
};

export default API_BASE;
export { IMAGES };