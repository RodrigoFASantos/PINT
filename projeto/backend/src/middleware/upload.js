const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Configuração do caminho base para uploads
const BASE_UPLOAD_DIR = path.join(process.cwd(), process.env.CAMINHO_PASTA_UPLOADS || 'uploads');

// Garantir que a estrutura de diretórios base existe
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

  // Garantir que os ficheiros base existam
  const avatarPath = path.join(BASE_UPLOAD_DIR, 'AVATAR.png');
  const capaPath = path.join(BASE_UPLOAD_DIR, 'CAPA.png');

  if (!fs.existsSync(avatarPath)) {
    fs.writeFileSync(
      avatarPath,
      'Este é um espaço reservado para AVATAR.png. Substitua por uma imagem real.'
    );
  }

  if (!fs.existsSync(capaPath)) {
    fs.writeFileSync(
      capaPath,
      'Este é um espaço reservado para CAPA.png. Substitua por uma imagem real.'
    );
  }
};

// Chamar a função para garantir que os diretórios existam
ensureBaseDirs();

// Funções auxiliares para normalização de nomes de ficheiros
const normalizarNome = (nome) => {
  if (!nome) return '';
  return nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9]+/g, '-')     // Substitui caracteres não alfanuméricos por hífens
    .replace(/^-+|-+$/g, '');        // Remove hífens no início ou fim
};

// Função para garantir que um diretório exista
const ensureDir = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    return true;
  }
  return false;
};

// Função para determinar o tipo de ficheiro
const getFileType = (mimetype) => {
  if (mimetype.startsWith('image/')) return 'imagem';
  if (mimetype.startsWith('video/')) return 'vídeo';
  if (mimetype.startsWith('audio/')) return 'áudio';
  if (mimetype.startsWith('application/pdf')) return 'pdf';
  if (mimetype.startsWith('application/') || mimetype.startsWith('text/')) return 'documento';
  return 'ficheiro';
};

// Função para gerar nome de ficheiro único
const gerarNomeUnico = (originalname) => {
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(8).toString('hex');
  const extension = path.extname(originalname);
  return `${timestamp}-${randomString}${extension}`;
};

// Configuração do armazenamento de utilizadores
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

    const tipoFicheiro = req.body.tipo || 'AVATAR'; // AVATAR ou CAPA
    const fileName = `${req.utilizador.email}_${tipoFicheiro}.png`;
    cb(null, fileName);
  }
});

// Configuração do armazenamento de cursos
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

// Configuração do armazenamento de conteúdos do curso
const conteudoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Guardar temporariamente e mover mais tarde
    const tempDir = path.join(BASE_UPLOAD_DIR, 'temp');
    ensureDir(tempDir);
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    cb(null, gerarNomeUnico(file.originalname));
  }
});

// Configuração do armazenamento de chat
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

// Limites de upload
const limits = {
  fileSize: 10 * 1024 * 1024, // 10MB
};

// Filtro de ficheiros
const fileFilter = (req, file, cb) => {
  // Lista de mimetypes permitidos
  const allowedMimeTypes = [
    // Imagens
    'image/jpeg', 'image/png', 'image/gif', 'image/svg+xml', 'image/webp',
    // Documentos
    'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    // Vídeos
    'video/mp4', 'video/mpeg', 'video/quicktime', 'video/webm',
    // Áudio
    'audio/mpeg', 'audio/wav', 'audio/ogg'
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Tipo de ficheiro não permitido. Formatos aceites: ${allowedMimeTypes.join(', ')}`
      ),
      false
    );
  }
};

// Configuração principal do Multer para uso temporário
const upload = multer({
  storage: multer.memoryStorage(), // Usar armazenamento em memória para flexibilidade
  limits,
  fileFilter
});

// Configurações específicas para diferentes tipos de upload
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

// Middleware para garantir que o diretório de destino do upload exista
const ensureDestDir = (dirPath) => (req, res, next) => {
  try {
    ensureDir(dirPath);
    next();
  } catch (error) {
    next(error);
  }
};

// Função para criar estrutura de diretórios para um curso
const criarDiretoriosCurso = (curso) => {
  const cursoSlug = normalizarNome(curso.nome);
  const cursoDir = path.join(BASE_UPLOAD_DIR, 'cursos', cursoSlug);
  
  // Criar o diretório do curso
  console.log(`A criar diretório do curso: ${cursoDir}`);
  ensureDir(cursoDir);
  
  // Criar explicitamente a pasta 'topicos' dentro do curso
  const topicosDir = path.join(cursoDir, 'topicos');
  console.log(`A criar pasta 'topicos': ${topicosDir}`);
  ensureDir(topicosDir);

  // Verificar se a pasta foi criada
  if (fs.existsSync(topicosDir)) {
    console.log(`✅ Pasta 'topicos' criada com sucesso em: ${topicosDir}`);
  } else {
    console.error(`❌ Falha ao criar pasta 'topicos' em: ${topicosDir}`);
  }

  return {
    dirPath: cursoDir,
    topicosPath: topicosDir,
    urlPath: `uploads/cursos/${cursoSlug}`,
    topicosUrlPath: `uploads/cursos/${cursoSlug}/topicos`
  };
};

const criarDiretorosAvaliacaoCurso = (curso, topico) => {
  const cursoSlug = normalizarNome(curso.nome);
  const topicoSlug = 'avaliacao'; // Nome fixo para a pasta de avaliação
  
  const avaliacaoDir = path.join(BASE_UPLOAD_DIR, 'cursos', cursoSlug, topicoSlug);
  ensureDir(avaliacaoDir);

  return {
    dirPath: avaliacaoDir,
    urlPath: `uploads/cursos/${cursoSlug}/${topicoSlug}`
  };
};

// Função para criar estrutura de diretórios para um tópico
const criarDiretoriosTopico = (curso, topico) => {
  const cursoSlug = normalizarNome(curso.nome);
  const topicoSlug = normalizarNome(topico.nome);
  
  // Colocar o tópico dentro da pasta 'topicos'
  const topicoDir = path.join(BASE_UPLOAD_DIR, 'cursos', cursoSlug, 'topicos', topicoSlug);
  ensureDir(topicoDir);

  return {
    dirPath: topicoDir,
    urlPath: `uploads/cursos/${cursoSlug}/topicos/${topicoSlug}`
  };
};

// Função para criar estrutura de diretórios para uma pasta
const criarDiretoriosPasta = (curso, topico, pasta) => {
  if (!curso || !curso.nome) {
    console.error("Erro: Informações do curso inválidas");
    throw new Error("Informações do curso inválidas");
  }
  
  if (!topico || !topico.nome) {
    console.error("Erro: Informações do tópico inválidas");
    throw new Error("Informações do tópico inválidas");
  }
  
  if (!pasta || !pasta.nome) {
    console.error("Erro: Informações da pasta inválidas");
    throw new Error("Informações da pasta inválidas");
  }

  const cursoSlug = normalizarNome(curso.nome);
  const topicoSlug = normalizarNome(topico.nome);
  const pastaSlug = normalizarNome(pasta.nome);
  
  // Verificar se é um tópico de avaliação
  const isAvaliacao = 
    topico.nome.toLowerCase() === 'avaliação' || 
    topico.nome.toLowerCase() === 'avaliacao' ||
    topico.nome.toLowerCase().includes('avalia') ||
    (topico.tipo && topico.tipo.toLowerCase() === 'avaliacao');
  
  console.log(`[CRIAR_DIRETORIOS_PASTA] Curso: ${curso.nome}, Tópico: ${topico.nome}, Pasta: ${pasta.nome}`);
  console.log(`[CRIAR_DIRETORIOS_PASTA] É avaliação? ${isAvaliacao ? 'SIM' : 'NÃO'}`);
  
  let pastaDir;
  let urlPath;
  
  if (isAvaliacao) {
    // Para tópicos de avaliação, usar o diretório "avaliacao" diretamente sob o curso
    pastaDir = path.join(BASE_UPLOAD_DIR, 'cursos', cursoSlug, 'avaliacao', pastaSlug);
    urlPath = `uploads/cursos/${cursoSlug}/avaliacao/${pastaSlug}`;
    console.log(`[CRIAR_DIRETORIOS_PASTA] Pasta de avaliação em: ${pastaDir}`);
  } else {
    // Para outros tópicos, colocar na nova estrutura dentro de "topicos"
    pastaDir = path.join(BASE_UPLOAD_DIR, 'cursos', cursoSlug, 'topicos', topicoSlug, pastaSlug);
    urlPath = `uploads/cursos/${cursoSlug}/topicos/${topicoSlug}/${pastaSlug}`;
    console.log(`[CRIAR_DIRETORIOS_PASTA] Pasta normal em: ${pastaDir}`);
  }
  
  // Criar diretório principal da pasta
  console.log(`[CRIAR_DIRETORIOS_PASTA] Criando diretório principal: ${pastaDir}`);
  ensureDir(pastaDir);
  
  // Criar diretórios para conteúdos e quizes
  const conteudosDir = path.join(pastaDir, 'conteudos');
  const quizesDir = path.join(pastaDir, 'quizes');
  
  console.log(`[CRIAR_DIRETORIOS_PASTA] Criando diretório conteúdos: ${conteudosDir}`);
  ensureDir(conteudosDir);
  
  console.log(`[CRIAR_DIRETORIOS_PASTA] Criando diretório quizes: ${quizesDir}`);
  ensureDir(quizesDir);
  
  // Para avaliações, criar também um diretório de submissões
  let submissoesDir = null;
  let submissoesUrlPath = null;
  
  if (isAvaliacao) {
    submissoesDir = path.join(pastaDir, 'submissoes');
    submissoesUrlPath = `${urlPath}/submissoes`;
    console.log(`[CRIAR_DIRETORIOS_PASTA] Criando diretório submissões: ${submissoesDir}`);
    ensureDir(submissoesDir);
  }
  
  // Construir objeto de resultado com todos os caminhos
  const result = {
    dirPath: pastaDir,
    conteudosPath: conteudosDir,
    quizesPath: quizesDir,
    urlPath: urlPath,
    conteudosUrlPath: `${urlPath}/conteudos`,
    quizesUrlPath: `${urlPath}/quizes`,
  };
  
  // Adicionar caminhos de submissões apenas para avaliações
  if (isAvaliacao) {
    result.submissoesPath = submissoesDir;
    result.submissoesUrlPath = submissoesUrlPath;
  }
  
  console.log(`[CRIAR_DIRETORIOS_PASTA] Estrutura criada com sucesso:`, result);
  return result;
};

const criarDiretoriosPastaAvaliacao = (curso, pasta) => {
  const cursoSlug = normalizarNome(curso.nome);
  const pastaSlug = normalizarNome(pasta.nome);
  
  // Estrutura correta para pastas de avaliação
  const pastaDir = path.join(BASE_UPLOAD_DIR, 'cursos', cursoSlug, 'avaliacao', pastaSlug);
  const conteudosDir = path.join(pastaDir, 'conteudos');
  const quizesDir = path.join(pastaDir, 'quizes');
  const submissoesDir = path.join(pastaDir, 'submissoes');
  
  // Criar os diretórios
  ensureDir(pastaDir);
  ensureDir(conteudosDir);
  ensureDir(quizesDir);
  ensureDir(submissoesDir);
  
  // URLs relativas para acesso web
  const urlPath = `uploads/cursos/${cursoSlug}/avaliacao/${pastaSlug}`;
  
  return {
    dirPath: pastaDir,
    conteudosPath: conteudosDir,
    quizesPath: quizesDir,
    submissoesPath: submissoesDir,
    urlPath: urlPath,
    conteudosUrlPath: `${urlPath}/conteudos`,
    quizesUrlPath: `${urlPath}/quizes`,
    submissoesUrlPath: `${urlPath}/submissoes`
  };
};

// Função para criar estrutura de diretórios para mensagens de chat
const criarDiretoriosChat = (categoria, topico) => {
  const categoriaSlug = normalizarNome(categoria);
  const topicoSlug = normalizarNome(topico);

  const chatDir = path.join(BASE_UPLOAD_DIR, 'chat', categoriaSlug, topicoSlug);
  const conteudosDir = path.join(chatDir, 'conteudos');
  // Normalizar nomes para evitar caracteres especiais e espaços

  ensureDir(chatDir);
  ensureDir(conteudosDir);
  // Definir caminhos para diretórios de avaliação

  return {
    dirPath: chatDir,
    conteudosPath: conteudosDir,
    urlPath: `uploads/chat/${categoriaSlug}/${topicoSlug}`,
    conteudosUrlPath: `uploads/chat/${categoriaSlug}/${topicoSlug}/conteudos`
  // Criar cada diretório necessário
  };
};

// Função para mover ficheiro temporário para o destino final
const moverArquivo = (origem, destino) => {
  try {
  // Criar URLs relativas para acesso web
    // Normalizar caminhos para comparação
    const origemPath = path.resolve(origem);
    const destinoPath = path.resolve(destino);
  // Retornar objeto com caminhos físicos e URLs

    // Se origem e destino são iguais, não precisamos fazer nada
    if (origemPath === destinoPath) {
      console.log('Origem e destino são iguais, não é necessário mover');
      return true;
    }

    // Garantir que o diretório de destino exista
    const destDir = path.dirname(destino);
    ensureDir(destDir);

    // Se o ficheiro de origem existir, copiá-lo e depois removê-lo
    if (fs.existsSync(origem)) {
      // Se o ficheiro de destino já existir, remover primeiro
      if (fs.existsSync(destino)) {
        try {
          fs.unlinkSync(destino);
        } catch (deleteError) {
          console.error('Erro ao remover ficheiro existente:', deleteError);
          // Continuar mesmo com erro ao remover
        }
      }

      fs.copyFileSync(origem, destino);

      // Tentar remover o ficheiro de origem
      try {
        fs.unlinkSync(origem);
      } catch (unlinkError) {
        console.error('Erro ao remover ficheiro de origem:', unlinkError);
        // Não falhar a operação se não conseguir remover o ficheiro de origem
      }

      return true;
    }
    return false;
  } catch (error) {
    console.error('Erro ao mover ficheiro:', error);
    return false;
  }
};

const userStorageModificado = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!req.utilizador || !req.utilizador.email) {
      return cb(new Error('Utilizador não identificado'), null);
    }

    const userSlug = req.utilizador.email.replace(/@/g, '_at_').replace(/\./g, '_');
    const userDir = path.join(BASE_UPLOAD_DIR, 'utilizadores', userSlug);

    console.log(`Storage: A guardar em ${userDir}`);
    ensureDir(userDir);
    cb(null, userDir);
  },
  filename: (req, file, cb) => {
    if (!req.utilizador || !req.utilizador.email) {
      return cb(new Error('Utilizador não identificado'), null);
    }

    // Usar req.tipoImagem em vez de req.body.tipo
    // Adicionar timestamp para evitar conflitos de cache
    const tipoFicheiro = req.tipoImagem || 'UNKNOWN';
    const timestamp = Date.now();
    const fileName = `${req.utilizador.email}_${tipoFicheiro}_${timestamp}.png`;

    console.log(`Storage: A gerar nome de ficheiro ${fileName} (tipo: ${tipoFicheiro})`);
    cb(null, fileName);
  }
});

const uploadUserModificado = multer({
  storage: userStorageModificado,
  limits,
  fileFilter
});

const uploadTemporario = multer.diskStorage({
  destination: (req, file, cb) => {
    // Sempre guardar na pasta temp primeiro
    const tempDir = path.join(BASE_UPLOAD_DIR, 'temp');
    console.log(`⏱️ UPLOAD TEMP: A guardar temporariamente em ${tempDir}`);
    ensureDir(tempDir);
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    // Gerar um nome único com timestamp para evitar colisões
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(4).toString('hex');

    // Detectar tipo de upload baseado na rota
    let tipoFicheiro = 'temp';
    if (req.path.includes('/img/perfil')) {
      tipoFicheiro = 'AVATAR';
    } else if (req.path.includes('/img/capa')) {
      tipoFicheiro = 'CAPA';
    }

    const fileName = `${timestamp}_${randomString}_${tipoFicheiro}.png`;
    console.log(`⏱️ UPLOAD TEMP: A gerar nome temporário: ${fileName}`);
    cb(null, fileName);
  }
});

// Configuração principal do Multer para upload temporário
const uploadTemp = multer({
  storage: uploadTemporario,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    // Verificar o tipo MIME
    if (file.mimetype.startsWith('image/')) {
      console.log(`⏱️ UPLOAD TEMP: Tipo de ficheiro válido: ${file.mimetype}`);
      cb(null, true);
    } else {
      console.log(`⏱️ UPLOAD TEMP: Tipo de ficheiro inválido: ${file.mimetype}`);
      cb(new Error('Apenas imagens são permitidas'), false);
    }
  }
});

// Middleware para garantir diretórios dos utilizadores
const ensureUserDir = (req, res, next) => {
  if (!req.utilizador || !req.utilizador.email) {
    return res.status(401).json({ message: "Utilizador não autenticado" });
  }

  const userSlug = req.utilizador.email.replace(/@/g, '_at_').replace(/\./g, '_');
  const userDir = path.join(BASE_UPLOAD_DIR, 'utilizadores', userSlug);

  ensureDir(userDir);

  // Adicionar informações ao request para uso nos controladores
  req.userDir = userDir;
  req.userSlug = userSlug;

  next();
};

const registerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    // No registo, o email vem do corpo da requisição, não do req.utilizador
    const email = req.body.email;

    if (!email) {
      return cb(new Error('Email não fornecido no corpo da requisição'), null);
    }

    const userSlug = email.replace(/@/g, '_at_').replace(/\./g, '_');
    const userDir = path.join(BASE_UPLOAD_DIR, 'utilizadores', userSlug);

    console.log(`Storage para registo: A guardar em ${userDir}`);
    ensureDir(userDir);
    cb(null, userDir);
  },
  filename: (req, file, cb) => {
    // No registo, o email vem do corpo da requisição
    const email = req.body.email;

    if (!email) {
      return cb(new Error('Email não fornecido no corpo da requisição'), null);
    }

    // Usar nome fixo para imagem de perfil
    const fileName = `${email}_AVATAR.png`;

    console.log(`Storage para registo: A gerar nome de ficheiro ${fileName}`);
    cb(null, fileName);
  }
});

// Criar um middleware de upload específico para registo
const uploadRegister = multer({
  storage: registerStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    // Verificar o tipo MIME
    if (file.mimetype.startsWith('image/')) {
      console.log(`Upload para registo: Tipo de ficheiro válido: ${file.mimetype}`);
      cb(null, true);
    } else {
      console.log(`Upload para registo: Tipo de ficheiro inválido: ${file.mimetype}`);
      cb(new Error('Apenas imagens são permitidas'), false);
    }
  }
});


// Exportações
module.exports = {
  BASE_UPLOAD_DIR,
  upload,
  uploadUser,
  uploadCurso,
  uploadConteudo,
  uploadChat,
  ensureBaseDirs,
  ensureDir,
  ensureDestDir,
  normalizarNome,
  getFileType,
  gerarNomeUnico,
  criarDiretoriosCurso,
  criarDiretoriosTopico,
  criarDiretoriosPasta,
  criarDiretoriosPastaAvaliacao,
  criarDiretoriosChat,
  criarDiretorosAvaliacaoCurso,
  moverArquivo,
  uploadUserModificado,
  uploadTemp,
  userStorageModificado,
  ensureUserDir,
  uploadRegister,
  uploadTemporario
};