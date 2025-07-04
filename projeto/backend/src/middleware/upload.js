const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

/**
 * Sistema completo de upload de ficheiros para a plataforma
 * Gere uploads de utilizadores, cursos, conteúdos e chat
 * Inclui validação de tipos, organização de pastas e segurança
 */

// Configuração do caminho base para uploads
const BASE_UPLOAD_DIR = path.join(process.cwd(), process.env.CAMINHO_PASTA_UPLOADS || 'uploads');

/**
 * Garante que a estrutura básica de diretorias existe
 * Cria pastas essenciais se não existirem
 */
const ensureBaseDirs = () => {
  const baseDirs = [
    BASE_UPLOAD_DIR,
    path.join(BASE_UPLOAD_DIR, 'utilizadores'),
    path.join(BASE_UPLOAD_DIR, 'cursos'),
    path.join(BASE_UPLOAD_DIR, 'chat'),
    path.join(BASE_UPLOAD_DIR, 'temp'),
  ];

  baseDirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  // Criar ficheiros placeholder se não existirem
  const avatarPath = path.join(BASE_UPLOAD_DIR, 'AVATAR.png');
  const capaPath = path.join(BASE_UPLOAD_DIR, 'CAPA.png');

  if (!fs.existsSync(avatarPath)) {
    fs.writeFileSync(avatarPath, 'Placeholder para AVATAR.png');
  }

  if (!fs.existsSync(capaPath)) {
    fs.writeFileSync(capaPath, 'Placeholder para CAPA.png');
  }
};

/**
 * Normaliza nomes de ficheiros e pastas
 * Remove acentos, espaços e caracteres especiais
 * @param {string} nome - Nome a ser normalizado
 * @returns {string} Nome normalizado
 */
const normalizarNome = (nome) => {
  if (!nome) return '';
  return nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9]+/g, '_')     // Substitui por underscores
    .replace(/^_+|_+$/g, '');        // Remove underscores nas extremidades
};

/**
 * Gera nome único para ficheiro
 * @param {string} originalname - Nome original do ficheiro
 * @returns {string} Nome único normalizado
 */
const gerarNomeUnico = (originalname) => {
  const extension = path.extname(originalname);
  const basename = path.basename(originalname, extension);
  return `${normalizarNome(basename)}${extension}`;
};

/**
 * Garante que um directório existe, criando-o se necessário
 * @param {string} dirPath - Caminho do directório
 * @returns {boolean} True se o directório foi criado ou já existia
 */
const ensureDir = (dirPath) => {
  // Verificar e bloquear criação de pastas indesejadas
  if (dirPath.includes('avaliacao')) {
    if ((dirPath.includes('submissoes') && dirPath.includes('Submissoes')) ||
        (dirPath.includes('conteudos') && dirPath.includes('Conteudos')) ||
        dirPath.includes('enunciado')) {
      console.log(`Pasta bloqueada: ${dirPath}`);
      return false;
    }
  }
  
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    return true;
  }
  
  return false;
};

/**
 * Determina o tipo de ficheiro baseado no MIME type
 * @param {string} mimetype - Tipo MIME do ficheiro
 * @returns {string} Categoria do ficheiro
 */
const getFileType = (mimetype) => {
  if (mimetype && mimetype.startsWith('image/')) return 'imagem';
  if (mimetype && mimetype.startsWith('video/')) return 'vídeo';
  if (mimetype && mimetype.startsWith('audio/')) return 'áudio';
  if (mimetype && mimetype.startsWith('application/pdf')) return 'pdf';
  if (mimetype && (mimetype.startsWith('application/') || mimetype.startsWith('text/'))) return 'documento';
  return 'ficheiro';
};

/**
 * Filtro robusto para validação de tipos de ficheiros
 * @param {Object} req - Requisição HTTP
 * @param {Object} file - Ficheiro enviado
 * @param {Function} cb - Callback de resposta
 */
const fileFilter = (req, file, cb) => {
  // Verificar se o mimetype está presente
  if (!file.mimetype || file.mimetype === 'undefined' || file.mimetype === 'null') {
    // Tentar determinar tipo pela extensão
    if (file.originalname) {
      const ext = path.extname(file.originalname).toLowerCase();
      
      // Mapeamento de extensões para mimetypes
      const extensionToMimetype = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
        '.svg': 'image/svg+xml',
        '.pdf': 'application/pdf',
        '.doc': 'application/msword',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.xls': 'application/vnd.ms-excel',
        '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        '.ppt': 'application/vnd.ms-powerpoint',
        '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        '.txt': 'text/plain',
        '.mp4': 'video/mp4',
        '.mpeg': 'video/mpeg',
        '.mov': 'video/quicktime',
        '.webm': 'video/webm',
        '.mp3': 'audio/mpeg',
        '.wav': 'audio/wav',
        '.ogg': 'audio/ogg'
      };
      
      const detectedMimetype = extensionToMimetype[ext];
      if (detectedMimetype) {
        return cb(null, true);
      } else {
        return cb(new Error(`Extensão "${ext}" não é suportada.`), false);
      }
    } else {
      return cb(new Error('Tipo de ficheiro não determinado.'), false);
    }
  }

  // Lista de tipos MIME permitidos
  const allowedMimeTypes = [
    // Imagens
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/svg+xml', 
    'image/webp', 'image/bmp', 'image/tiff',
    
    // Documentos
    'application/pdf', 'application/msword', 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel', 
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint', 
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain', 'text/csv', 'application/rtf',
    
    // Vídeos
    'video/mp4', 'video/mpeg', 'video/quicktime', 'video/webm',
    'video/avi', 'video/x-msvideo',
    
    // Áudio
    'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp3', 'audio/x-wav'
  ];

  // Verificar se o mimetype está permitido
  if (allowedMimeTypes.includes(file.mimetype)) {
    return cb(null, true);
  }

  // Verificação adicional para imagens com mimetype não standard
  if (file.originalname) {
    const ext = path.extname(file.originalname).toLowerCase();
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'];
    
    if (imageExtensions.includes(ext) && file.mimetype && file.mimetype.startsWith('image/')) {
      return cb(null, true);
    }
    
    // Casos específicos de browsers
    if (imageExtensions.includes(ext) && (
      file.mimetype === 'application/octet-stream' || 
      file.mimetype === 'binary/octet-stream' ||
      !file.mimetype.includes('/')
    )) {
      return cb(null, true);
    }
  }

  // Rejeitar ficheiro
  const errorMessage = `Tipo de ficheiro não permitido: "${file.mimetype}".`;
  return cb(new Error(errorMessage), false);
};

// Limites de upload
const limits = {
  fileSize: 15 * 1024 * 1024, // 15MB
  files: 1,
  fields: 50
};

// ==========================================
// CONFIGURAÇÕES DE STORAGE
// ==========================================

/**
 * Storage para ficheiros de utilizadores (avatares e capas)
 */
const userStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!req.utilizador || !req.utilizador.email) {
      return cb(new Error('Utilizador não identificado'), null);
    }

    const userSlug = req.utilizador.email.replace(/@/g, '_at_').replace(/\./g, '_');
    const userDir = path.join(BASE_UPLOAD_DIR, 'utilizadores', userSlug);

    ensureDir(userDir);
    cb(null, userDir);
  },
  filename: (req, file, cb) => {
    if (!req.utilizador || !req.utilizador.email) {
      return cb(new Error('Utilizador não identificado'), null);
    }

    const tipoFicheiro = req.body.tipo || 'AVATAR';
    const fileName = `${req.utilizador.email}_${tipoFicheiro}.png`;
    
    cb(null, fileName);
  }
});

/**
 * Storage para capas de cursos
 */
const cursoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const { nome } = req.body;
    
    if (!nome) {
      return cb(new Error('Nome do curso não fornecido'), null);
    }

    const cursoSlug = normalizarNome(nome);
    const cursoDir = path.join(BASE_UPLOAD_DIR, 'cursos', cursoSlug);

    ensureDir(cursoDir);
    cb(null, cursoDir);
  },
  filename: (req, file, cb) => {
    cb(null, 'capa.png');
  }
});

/**
 * Storage temporário para conteúdos
 */
const conteudoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const tempDir = path.join(BASE_UPLOAD_DIR, 'temp');
    ensureDir(tempDir);
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    cb(null, gerarNomeUnico(file.originalname));
  }
});

/**
 * Storage temporário para chat
 */
const chatStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const tempDir = path.join(BASE_UPLOAD_DIR, 'temp');
    ensureDir(tempDir);
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    cb(null, gerarNomeUnico(file.originalname));
  }
});

// ==========================================
// CONFIGURAÇÕES MULTER
// ==========================================

const upload = multer({
  storage: multer.memoryStorage(),
  limits,
  fileFilter
});

const uploadUser = multer({
  storage: userStorage,
  limits,
  fileFilter
});

const uploadCurso = multer({
  storage: cursoStorage,
  limits,
  fileFilter
});

const uploadConteudo = multer({
  storage: conteudoStorage,
  limits,
  fileFilter
});

const uploadChat = multer({
  storage: chatStorage,
  limits,
  fileFilter
});

// ==========================================
// FUNÇÕES DE GESTÃO DE DIRETORIAS
// ==========================================

/**
 * Cria estrutura completa de diretorias para um curso
 * @param {Object} curso - Dados do curso
 * @returns {Object} Caminhos criados
 */
const criarDiretoriosCurso = (curso) => {
  const cursoSlug = normalizarNome(curso.nome);
  const cursoDir = path.join(BASE_UPLOAD_DIR, 'cursos', cursoSlug);
  
  ensureDir(cursoDir);
  
  const topicosDir = path.join(cursoDir, 'topicos');
  const avaliacaoDir = path.join(cursoDir, 'avaliacao');
  
  ensureDir(topicosDir);
  ensureDir(avaliacaoDir);

  return {
    dirPath: cursoDir,
    topicosPath: topicosDir,
    avaliacaoPath: avaliacaoDir,
    urlPath: `uploads/cursos/${cursoSlug}`,
    topicosUrlPath: `uploads/cursos/${cursoSlug}/topicos`,
    avaliacaoUrlPath: `uploads/cursos/${cursoSlug}/avaliacao`
  };
};

/**
 * Cria diretorias para tópicos de curso
 * @param {Object} curso - Dados do curso
 * @param {Object} topico - Dados do tópico
 * @returns {Object} Caminhos criados
 */
const criarDiretoriosTopico = (curso, topico) => {
  const cursoSlug = normalizarNome(curso.nome);
  const topicoSlug = normalizarNome(topico.nome);
  
  const topicosDir = path.join(BASE_UPLOAD_DIR, 'cursos', cursoSlug, 'topicos');
  ensureDir(topicosDir);
  
  const topicoDir = path.join(topicosDir, topicoSlug);
  ensureDir(topicoDir);

  return {
    dirPath: topicoDir,
    urlPath: `uploads/cursos/${cursoSlug}/topicos/${topicoSlug}`
  };
};

/**
 * Cria diretorias para avaliações
 * @param {Object} curso - Dados do curso
 * @param {Object} topico - Dados do tópico de avaliação
 * @returns {Object} Caminhos criados
 */
const criarDiretoriosTopicoAvaliacao = (curso, topico) => {
  const cursoSlug = normalizarNome(curso.nome);
  const topicoSlug = normalizarNome(topico.nome);
  
  const avaliacaoDir = path.join(BASE_UPLOAD_DIR, 'cursos', cursoSlug, 'avaliacao');
  ensureDir(avaliacaoDir);
  
  const topicoDir = path.join(avaliacaoDir, topicoSlug);
  ensureDir(topicoDir);

  return {
    dirPath: topicoDir,
    urlPath: `uploads/cursos/${cursoSlug}/avaliacao/${topicoSlug}`
  };
};

/**
 * Cria diretorias especiais para pastas de avaliação
 * @param {string} cursoSlug - Slug do curso
 * @param {string} pastaSlug - Slug da pasta
 * @returns {Object} Caminhos criados
 */
const criarPastasAvaliacao = (cursoSlug, pastaSlug) => {
  const pastaDir = path.join(BASE_UPLOAD_DIR, 'cursos', cursoSlug, 'avaliacao', pastaSlug);
  ensureDir(pastaDir);
  
  const submissoesDir = path.join(pastaDir, 'submissoes');
  const conteudosDir = path.join(pastaDir, 'conteudos');
  
  ensureDir(submissoesDir);
  ensureDir(conteudosDir);
  
  return {
    pastaPath: pastaDir,
    pastaUrl: `uploads/cursos/${cursoSlug}/avaliacao/${pastaSlug}`,
    submissoesPath: submissoesDir,
    submissoesUrl: `uploads/cursos/${cursoSlug}/avaliacao/${pastaSlug}/submissoes`,
    conteudosPath: conteudosDir,
    conteudosUrl: `uploads/cursos/${cursoSlug}/avaliacao/${pastaSlug}/conteudos`
  };
};

/**
 * Cria diretorias para pastas genéricas
 * @param {Object} curso - Dados do curso
 * @param {Object} topico - Dados do tópico
 * @param {Object} pasta - Dados da pasta
 * @returns {Object} Caminhos criados
 */
const criarDiretoriosPasta = (curso, topico, pasta) => {
  if (!curso?.nome || !topico?.nome || !pasta?.nome) {
    throw new Error("Informações inválidas para criação de pasta");
  }

  const cursoSlug = normalizarNome(curso.nome);
  const topicoSlug = normalizarNome(topico.nome);
  const pastaSlug = normalizarNome(pasta.nome);
  
  const isAvaliacao = 
    topico.nome.toLowerCase() === 'avaliação' || 
    topico.nome.toLowerCase() === 'avaliacao' ||
    topico.nome.toLowerCase().includes('avalia') ||
    (topico.tipo && topico.tipo.toLowerCase() === 'avaliacao');
  
  if (isAvaliacao) {
    return criarPastasAvaliacao(cursoSlug, pastaSlug);
  } else {
    const pastaDir = path.join(BASE_UPLOAD_DIR, 'cursos', cursoSlug, 'topicos', topicoSlug, pastaSlug);
    const urlPath = `uploads/cursos/${cursoSlug}/topicos/${topicoSlug}/${pastaSlug}`;
    
    ensureDir(pastaDir);
    
    return {
      dirPath: pastaDir,
      urlPath: urlPath,
      conteudosPath: pastaDir,
      quizesPath: pastaDir,
      conteudosUrlPath: urlPath,
      quizesUrlPath: urlPath
    };
  }
};

/**
 * Cria diretorias para chat
 * @param {string} categoria - Nome da categoria
 * @param {string} topico - Nome do tópico
 * @returns {Object} Caminhos criados
 */
const criarDiretoriosChat = (categoria, topico) => {
  const categoriaSlug = normalizarNome(categoria);
  const topicoSlug = normalizarNome(topico);

  const chatDir = path.join(BASE_UPLOAD_DIR, 'chat', categoriaSlug, topicoSlug);
  const conteudosDir = path.join(chatDir, 'conteudos');

  ensureDir(chatDir);
  ensureDir(conteudosDir);

  return {
    dirPath: chatDir,
    conteudosPath: conteudosDir,
    urlPath: `uploads/chat/${categoriaSlug}/${topicoSlug}`,
    conteudosUrlPath: `uploads/chat/${categoriaSlug}/${topicoSlug}/conteudos`
  };
};

/**
 * Move ficheiro de origem para destino
 * @param {string} origem - Caminho de origem
 * @param {string} destino - Caminho de destino
 * @returns {boolean} True se a operação foi bem-sucedida
 */
const moverArquivo = (origem, destino) => {
  try {
    const origemPath = path.resolve(origem);
    const destinoPath = path.resolve(destino);
    
    if (origemPath === destinoPath) {
      return true;
    }

    if (!fs.existsSync(origemPath)) {
      console.error(`Ficheiro de origem não existe: ${origemPath}`);
      return false;
    }

    const destDir = path.dirname(destino);
    ensureDir(destDir);

    if (fs.existsSync(destino)) {
      fs.unlinkSync(destino);
    }

    fs.copyFileSync(origem, destino);

    if (!fs.existsSync(destino)) {
      console.error(`Falha na cópia: ${destino}`);
      return false;
    }

    fs.unlinkSync(origem);
    return true;
  } catch (error) {
    console.error('Erro ao mover ficheiro:', error.message);
    return false;
  }
};

// ==========================================
// CONFIGURAÇÕES ADICIONAIS
// ==========================================

/**
 * Storage modificado para utilizadores com timestamp
 */
const userStorageModificado = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!req.utilizador || !req.utilizador.email) {
      return cb(new Error('Utilizador não identificado'), null);
    }

    const userSlug = req.utilizador.email.replace(/@/g, '_at_').replace(/\./g, '_');
    const userDir = path.join(BASE_UPLOAD_DIR, 'utilizadores', userSlug);

    ensureDir(userDir);
    cb(null, userDir);
  },
  filename: (req, file, cb) => {
    if (!req.utilizador || !req.utilizador.email) {
      return cb(new Error('Utilizador não identificado'), null);
    }

    const tipoFicheiro = req.tipoImagem || 'UNKNOWN';
    const timestamp = Date.now();
    const fileName = `${req.utilizador.email}_${tipoFicheiro}_${timestamp}.png`;

    cb(null, fileName);
  }
});

const uploadUserModificado = multer({
  storage: userStorageModificado,
  limits,
  fileFilter
});

/**
 * Storage temporário com timestamp único
 */
const uploadTemporario = multer.diskStorage({
  destination: (req, file, cb) => {
    const tempDir = path.join(BASE_UPLOAD_DIR, 'temp');
    ensureDir(tempDir);
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(4).toString('hex');

    let tipoFicheiro = 'temp';
    if (req.path && req.path.includes('/img/perfil')) {
      tipoFicheiro = 'AVATAR';
    } else if (req.path && req.path.includes('/img/capa')) {
      tipoFicheiro = 'CAPA';
    }

    const fileName = `${timestamp}_${randomString}_${tipoFicheiro}.png`;
    cb(null, fileName);
  }
});

const uploadTemp = multer({
  storage: uploadTemporario,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype && file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Apenas imagens são permitidas'), false);
    }
  }
});

/**
 * Middleware para garantir directório de utilizador
 */
const ensureUserDir = (req, res, next) => {
  if (!req.utilizador || !req.utilizador.email) {
    return res.status(401).json({ message: "Utilizador não autenticado" });
  }

  const userSlug = req.utilizador.email.replace(/@/g, '_at_').replace(/\./g, '_');
  const userDir = path.join(BASE_UPLOAD_DIR, 'utilizadores', userSlug);

  ensureDir(userDir);

  req.userDir = userDir;
  req.userSlug = userSlug;

  next();
};

/**
 * Storage para registo de novos utilizadores
 */
const registerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const email = req.body.email;

    if (!email) {
      return cb(new Error('Email não fornecido'), null);
    }

    const userSlug = email.replace(/@/g, '_at_').replace(/\./g, '_');
    const userDir = path.join(BASE_UPLOAD_DIR, 'utilizadores', userSlug);

    ensureDir(userDir);
    cb(null, userDir);
  },
  filename: (req, file, cb) => {
    const email = req.body.email;

    if (!email) {
      return cb(new Error('Email não fornecido'), null);
    }

    const fileName = `${email}_AVATAR.png`;
    cb(null, fileName);
  }
});

const uploadRegister = multer({
  storage: registerStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype && file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Apenas imagens são permitidas'), false);
    }
  }
});

// Inicializar sistema na importação
ensureBaseDirs();

module.exports = {
  BASE_UPLOAD_DIR,
  upload,
  uploadUser,
  uploadCurso,
  uploadConteudo,
  uploadChat,
  ensureBaseDirs,
  ensureDir,
  normalizarNome,
  getFileType,
  gerarNomeUnico,
  criarDiretoriosCurso,
  criarDiretoriosTopico,
  criarDiretoriosTopicoAvaliacao,
  criarDiretoriosPasta,
  criarDiretoriosChat,
  moverArquivo,
  uploadUserModificado,
  uploadTemp,
  userStorageModificado,
  ensureUserDir,
  uploadRegister,
  uploadTemporario
};