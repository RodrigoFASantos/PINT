/**
 * Configuração centralizada da API - Deteção automática de ambiente
 * 
 * Este módulo configura automaticamente a URL base da API baseado no ambiente
 * de execução (desenvolvimento ou produção) e fornece funções auxiliares
 * para formatação de URLs e gestão de recursos de imagem.
 */

/**
 * Determina automaticamente a URL base da API
 * 
 * Hierarquia de prioridades:
 * 1. Variável de ambiente REACT_APP_API_URL (configuração manual)
 * 2. localhost:4000 para ambiente de desenvolvimento local
 * 3. Mesmo hostname/IP do frontend para produção
 * 
 * @returns {string} URL base da API completa
 */
const getApiBase = () => {
  // Verificar se existe configuração manual via variável de ambiente
  if (process.env.REACT_APP_API_URL) {
    console.log('🔧 A usar URL da API definida manualmente:', process.env.REACT_APP_API_URL);
    return process.env.REACT_APP_API_URL;
  }
  
  // Obter informações do ambiente atual
  const protocol = window.location.protocol; // http: ou https:
  const hostname = window.location.hostname; // localhost, IP ou domínio
  const port = 4000; // Porta padrão do servidor backend
  
  // Determinar ambiente baseado no hostname
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    // Ambiente de desenvolvimento local
    const apiUrl = `${protocol}//${hostname}:${port}/api`;
    console.log('🏠 Ambiente de desenvolvimento detetado. API:', apiUrl);
    return apiUrl;
  }
  
  // Ambiente de produção - usar o mesmo hostname/IP do frontend
  const apiUrl = `${protocol}//${hostname}:${port}/api`;
  console.log('🚀 Ambiente de produção detetado. API:', apiUrl);
  return apiUrl;
};

// URL base da API detetada automaticamente
const API_BASE = getApiBase();

/**
 * Formata endereços de email para uso seguro em URLs
 * 
 * Substitui caracteres especiais por equivalentes seguros para evitar
 * problemas de encoding e conflitos em paths de URL.
 * 
 * @param {string} email - Endereço de email a ser formatado
 * @returns {string} Email formatado para URL ou string vazia se inválido
 */
const formatarEmailParaURL = (email) => {
  if (!email || typeof email !== 'string') {
    console.warn('⚠️ Email inválido fornecido para formatação:', email);
    return '';
  }
  
  // Substituir caracteres problemáticos por equivalentes seguros
  const emailFormatado = email
    .replace(/@/g, '_at_')    // @ → _at_
    .replace(/\./g, '_')      // . → _
    .replace(/\+/g, '_plus_') // + → _plus_
    .toLowerCase();           // Normalizar para minúsculas
  
  console.log('📧 Email formatado para URL:', email, '→', emailFormatado);
  return emailFormatado;
};

/**
 * Configuração centralizada de URLs para recursos de imagem
 * 
 * Centraliza todas as URLs de imagens para facilitar manutenção,
 * garantir consistência e permitir cache busting automático.
 */
const IMAGES = {
  /**
   * Imagens padrão do sistema para fallbacks
   */
  DEFAULT_AVATAR: `${API_BASE}/uploads/AVATAR.png`,
  DEFAULT_CAPA: `${API_BASE}/uploads/CAPA.png`,
   
  /**
   * Gera URL do avatar de um utilizador específico
   * 
   * Inclui timestamp para evitar problemas de cache quando o avatar é atualizado.
   * 
   * @param {string} email - Email do utilizador
   * @returns {string} URL completa do avatar com cache busting
   */
  USER_AVATAR: (email) => {
    if (!email) {
      console.warn('⚠️ Email não fornecido para avatar, a usar imagem padrão');
      return IMAGES.DEFAULT_AVATAR;
    }
    
    const timestamp = Date.now();
    const emailFormatado = formatarEmailParaURL(email);
    const avatarUrl = `${API_BASE}/uploads/users/${emailFormatado}/${email}_AVATAR.png?t=${timestamp}`;
    
    console.log('👤 URL do avatar gerada:', avatarUrl);
    return avatarUrl;
  },

  /**
   * Gera URL da imagem de capa de um utilizador
   * 
   * Para perfis com imagens de fundo personalizadas.
   * 
   * @param {string} email - Email do utilizador
   * @returns {string} URL completa da capa com cache busting
   */
  USER_CAPA: (email) => {
    if (!email) {
      console.warn('⚠️ Email não fornecido para capa, a usar imagem padrão');
      return IMAGES.DEFAULT_CAPA;
    }
    
    const timestamp = Date.now();
    const emailFormatado = formatarEmailParaURL(email);
    const capaUrl = `${API_BASE}/uploads/users/${emailFormatado}/${email}_CAPA.png?t=${timestamp}`;
    
    console.log('🖼️ URL da capa gerada:', capaUrl);
    return capaUrl;
  },

  /**
   * Gera URL da imagem de capa de um curso
   * 
   * Para imagens principais dos cursos organizadas por nome do curso.
   * 
   * @param {string} nomeCurso - Nome do curso (será normalizado automaticamente)
   * @returns {string} URL completa da imagem do curso
   */
  CURSO: (nomeCurso) => {
    if (!nomeCurso) {
      console.warn('⚠️ Nome do curso não fornecido para imagem');
      return `${API_BASE}/uploads/cursos/default/capa.png`;
    }
    
    // Normalizar nome do curso para nome de pasta seguro
    const nomeNormalizado = nomeCurso
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '') // Remover caracteres especiais
      .replace(/\s+/g, '_')        // Espaços → underscores
      .trim();
    
    const cursoUrl = `${API_BASE}/uploads/cursos/${nomeNormalizado}/capa.png`;
    
    console.log('📚 URL da imagem do curso gerada:', cursoUrl);
    return cursoUrl;
  },

  /**
   * Gera URL para imagem de conteúdo específico
   * 
   * Para imagens dentro de conteúdos de cursos ou outros recursos.
   * 
   * @param {string} path - Caminho relativo da imagem
   * @returns {string} URL completa da imagem de conteúdo
   */
  CONTEUDO: (path) => {
    if (!path) {
      console.warn('⚠️ Caminho não fornecido para imagem de conteúdo');
      return `${API_BASE}/uploads/default.png`;
    }
    
    // Garantir que o path não começa com /
    const pathLimpo = path.startsWith('/') ? path.slice(1) : path;
    const conteudoUrl = `${API_BASE}/uploads/${pathLimpo}`;
    
    console.log('📄 URL de conteúdo gerada:', conteudoUrl);
    return conteudoUrl;
  }
};

/**
 * Funções auxiliares para validação e manipulação de URLs
 */
const URL_HELPERS = {
  /**
   * Valida se uma URL é válida e acessível
   * 
   * @param {string} url - URL a ser validada
   * @returns {Promise<boolean>} True se a URL for válida e acessível
   */
  validarURL: async (url) => {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    } catch (error) {
      console.warn('⚠️ URL não acessível:', url, error.message);
      return false;
    }
  },

  /**
   * Adiciona timestamp a uma URL para cache busting
   * 
   * @param {string} url - URL original
   * @returns {string} URL com timestamp adicionado
   */
  adicionarTimestamp: (url) => {
    if (!url) return '';
    
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}t=${Date.now()}`;
  },

  /**
   * Remove timestamp de uma URL
   * 
   * @param {string} url - URL com timestamp
   * @returns {string} URL limpa sem timestamp
   */
  removerTimestamp: (url) => {
    if (!url) return '';
    
    return url.replace(/[?&]t=\d+/, '');
  }
};

/**
 * Configurações de timeout e retry para requisições
 */
const API_CONFIG = {
  TIMEOUT_DEFAULT: 30000,        // 30 segundos para requisições normais
  TIMEOUT_UPLOAD: 120000,        // 2 minutos para uploads
  TIMEOUT_DOWNLOAD: 60000,       // 1 minuto para downloads
  MAX_RETRIES: 3,                // Máximo de tentativas em caso de falha
  RETRY_DELAY: 1000              // Delay entre tentativas (1 segundo)
};

/**
 * Headers padrão para requisições
 */
const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'X-Requested-With': 'XMLHttpRequest'
};

// Log da configuração carregada
console.log('🔧 Configuração da API carregada:');
console.log('   URL Base:', API_BASE);
console.log('   Timeout padrão:', API_CONFIG.TIMEOUT_DEFAULT, 'ms');
console.log('   Ambiente:', 
  API_BASE.includes('localhost') ? 'Desenvolvimento' : 'Produção'
);

// Exportar configuração principal
export default API_BASE;

// Exportar módulos auxiliares
export { 
  IMAGES, 
  URL_HELPERS, 
  API_CONFIG, 
  DEFAULT_HEADERS,
  formatarEmailParaURL 
};