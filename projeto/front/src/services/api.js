// Detecção automática da URL da API
const getApiBase = () => {
  console.log('🔍 [API DEBUG] Iniciando detecção da URL base...');
  
  // Debug das variáveis de ambiente
  console.log('🔍 [API DEBUG] process.env.REACT_APP_API_URL:', process.env.REACT_APP_API_URL);
  
  // Se há variável de ambiente definida, usar essa
  if (process.env.REACT_APP_API_URL) {
    console.log('✅ [API DEBUG] Usando variável de ambiente');
    return process.env.REACT_APP_API_URL;
  }
  
  // Obter o hostname e porta atual
  const protocol = window.location.protocol; // http: ou https:
  const hostname = window.location.hostname; // localhost, 192.168.x.x, ou IP público
  const port = 4000; // porta do teu backend
  
  console.log('🔍 [API DEBUG] window.location.protocol:', protocol);
  console.log('🔍 [API DEBUG] window.location.hostname:', hostname);
  console.log('🔍 [API DEBUG] window.location.href completo:', window.location.href);
  console.log('🔍 [API DEBUG] Porta do backend:', port);
  
  // Se for localhost, usar localhost (desenvolvimento)
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    const apiUrl = `${protocol}//${hostname}:${port}/api`;
    console.log('🏠 [API DEBUG] Detectado ambiente local, URL:', apiUrl);
    return apiUrl;
  }
  
  // Caso contrário, usar o mesmo hostname/IP (produção)
  const apiUrl = `${protocol}//${hostname}:${port}/api`;
  console.log('🌍 [API DEBUG] Detectado ambiente externo, URL:', apiUrl);
  return apiUrl;
};

const API_BASE = getApiBase();

console.log('🌐 [API] =================================');
console.log('🌐 [API] URL Base FINAL detectada:', API_BASE);
console.log('🌐 [API] =================================');

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