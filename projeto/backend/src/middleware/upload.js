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
    .replace(/[^a-z0-9]+/g, '_')     // Substitui caracteres não alfanuméricos por UNDERSCORES
    .replace(/^_+|_+$/g, '');        // Remove underscores no início ou fim
};

// Função para gerar nome de ficheiro único
const gerarNomeUnico = (originalname) => {
  const extension = path.extname(originalname);
  const basename = path.basename(originalname, extension);
  return `${normalizarNome(basename)}${extension}`;
};

// Função para garantir que um diretório exista
const ensureDir = (dirPath) => {
  console.log(`Tentando criar diretório: ${dirPath}`);
  
  // Verificar duplicações indesejadas
  if (dirPath.includes('avaliacao')) {
    if ((dirPath.includes('submissoes') && dirPath.includes('Submissoes')) ||
        (dirPath.includes('conteudos') && dirPath.includes('Conteudos')) ||
        dirPath.includes('enunciado')) {  // Bloquear qualquer pasta com "enunciado"
      console.log(`⛔ Bloqueando criação de pasta indesejada: ${dirPath}`);
      return false;
    }
  }
  
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`Diretório criado: ${dirPath}`);
    return true;
  }
  
  console.log(`Diretório já existe: ${dirPath}`);
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
  
  // Criar explicitamente apenas as pastas principais
  const topicosDir = path.join(cursoDir, 'topicos');
  const avaliacaoDir = path.join(cursoDir, 'avaliacao');
  
  console.log(`A criar pasta 'topicos': ${topicosDir}`);
  ensureDir(topicosDir);
  
  console.log(`A criar pasta 'avaliacao': ${avaliacaoDir}`);
  ensureDir(avaliacaoDir);
  
  // Verificar se as pastas foram criadas
  if (fs.existsSync(topicosDir) && fs.existsSync(avaliacaoDir)) {
    console.log(`✅ Estrutura base criada com sucesso para o curso: ${curso.nome}`);
  } else {
    console.error(`❌ Falha ao criar estrutura base para o curso: ${curso.nome}`);
  }

  return {
    dirPath: cursoDir,
    topicosPath: topicosDir,
    avaliacaoPath: avaliacaoDir,
    urlPath: `uploads/cursos/${cursoSlug}`,
    topicosUrlPath: `uploads/cursos/${cursoSlug}/topicos`,
    avaliacaoUrlPath: `uploads/cursos/${cursoSlug}/avaliacao`
  };
};





const criarPastasAvaliacao = (cursoSlug, pastaSlug) => {
  // Caminho principal da pasta de avaliação
  const pastaDir = path.join(BASE_UPLOAD_DIR, 'cursos', cursoSlug, 'avaliacao', pastaSlug);
  
  // Criar a pasta principal
  console.log(`Criando pasta principal de avaliação: ${pastaDir}`);
  if (!fs.existsSync(pastaDir)) {
    fs.mkdirSync(pastaDir, { recursive: true });
  }
  
  // Criar APENAS as pastas submissoes e conteudos (sem enunciado)
  const submissoesDir = path.join(pastaDir, 'submissoes');
  const conteudosDir = path.join(pastaDir, 'conteudos');
  
  console.log(`Criando pasta submissoes: ${submissoesDir}`);
  if (!fs.existsSync(submissoesDir)) {
    fs.mkdirSync(submissoesDir, { recursive: true });
  }
  
  console.log(`Criando pasta conteudos: ${conteudosDir}`);
  if (!fs.existsSync(conteudosDir)) {
    fs.mkdirSync(conteudosDir, { recursive: true });
  }
  
  return {
    pastaPath: pastaDir,
    pastaUrl: `uploads/cursos/${cursoSlug}/avaliacao/${pastaSlug}`,
    submissoesPath: submissoesDir,
    submissoesUrl: `uploads/cursos/${cursoSlug}/avaliacao/${pastaSlug}/submissoes`,
    conteudosPath: conteudosDir,
    conteudosUrl: `uploads/cursos/${cursoSlug}/avaliacao/${pastaSlug}/conteudos`
  };
};







const criarDiretorosAvaliacaoCurso = (curso, topico) => {
  const cursoSlug = normalizarNome(curso.nome);
  const topicoSlug = 'avaliacao'; // Nome fixo para a pasta de avaliação
  
  // Garantir que a pasta do curso exista
  const cursoDir = path.join(BASE_UPLOAD_DIR, 'cursos', cursoSlug);
  console.log(`Verificando se o diretório do curso existe: ${cursoDir}`);
  ensureDir(cursoDir);
  
  // Criar pasta de avaliação
  const avaliacaoDir = path.join(cursoDir, topicoSlug);
  console.log(`A criar pasta de avaliação: ${avaliacaoDir}`);
  ensureDir(avaliacaoDir);
  
  // Verificar se foi criada
  if (fs.existsSync(avaliacaoDir)) {
    console.log(`✅ Pasta de avaliação criada com sucesso`);
  } else {
    console.error(`❌ Falha ao criar pasta de avaliação`);
  }

  return {
    dirPath: avaliacaoDir,
    urlPath: `uploads/cursos/${cursoSlug}/${topicoSlug}`
  };
};

const criarDiretoriosTopicoAvaliacao = (curso, topico) => {
  const cursoSlug = normalizarNome(curso.nome);
  const topicoSlug = normalizarNome(topico.nome);
  
  // Garantir que a pasta avaliacao exista
  const avaliacaoDir = path.join(BASE_UPLOAD_DIR, 'cursos', cursoSlug, 'avaliacao');
  console.log(`Verificando se a pasta 'avaliacao' existe: ${avaliacaoDir}`);
  ensureDir(avaliacaoDir);
  
  // Criar a pasta do tópico dentro de avaliacao
  const topicoDir = path.join(avaliacaoDir, topicoSlug);
  console.log(`A criar pasta para o tópico de avaliação: ${topicoDir}`);
  ensureDir(topicoDir);
  
  if (fs.existsSync(topicoDir)) {
    console.log(`✅ Pasta do tópico de avaliação criada com sucesso: ${topicoSlug}`);
  } else {
    console.error(`❌ Falha ao criar pasta do tópico de avaliação: ${topicoSlug}`);
  }

  return {
    dirPath: topicoDir,
    urlPath: `uploads/cursos/${cursoSlug}/avaliacao/${topicoSlug}`
  };
};

// Função para criar estrutura de diretórios para um tópico
const criarDiretoriosTopico = (curso, topico) => {
  const cursoSlug = normalizarNome(curso.nome);
  const topicoSlug = normalizarNome(topico.nome);
  
  // Garantir que a pasta topicos exista
  const topicosDir = path.join(BASE_UPLOAD_DIR, 'cursos', cursoSlug, 'topicos');
  console.log(`Verificando se a pasta 'topicos' existe: ${topicosDir}`);
  ensureDir(topicosDir);
  
  // Colocar o tópico dentro da pasta 'topicos'
  const topicoDir = path.join(topicosDir, topicoSlug);
  console.log(`A criar pasta para o tópico: ${topicoDir}`);
  ensureDir(topicoDir);
  
  if (fs.existsSync(topicoDir)) {
    console.log(`✅ Pasta do tópico criada com sucesso: ${topicoSlug}`);
  } else {
    console.error(`❌ Falha ao criar pasta do tópico: ${topicoSlug}`);
  }

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
  
  if (isAvaliacao) {
    console.log(`[CRIAR_DIRETORIOS_PASTA] Usando função específica para pasta de avaliação`);
    return criarPastasAvaliacao(cursoSlug, pastaSlug);
  } else {
    // Para pastas normais (não avaliação), usar a estrutura padrão
    const pastaDir = path.join(BASE_UPLOAD_DIR, 'cursos', cursoSlug, 'topicos', topicoSlug, pastaSlug);
    const urlPath = `uploads/cursos/${cursoSlug}/topicos/${topicoSlug}/${pastaSlug}`;
    
    // Criar diretório principal da pasta
    console.log(`[CRIAR_DIRETORIOS_PASTA] Criando diretório principal: ${pastaDir}`);
    ensureDir(pastaDir);
    
    // Construir objeto de resultado com todos os caminhos
    const result = {
      dirPath: pastaDir,
      urlPath: urlPath,
      conteudosPath: pastaDir,
      quizesPath: pastaDir,
      conteudosUrlPath: urlPath,
      quizesUrlPath: urlPath
    };
    
    console.log(`[CRIAR_DIRETORIOS_PASTA] Estrutura criada com sucesso:`, result);
    return result;
  }
};











const criarDiretoriosPastaAvaliacao = (curso, topico, pasta) => {
  const cursoSlug = normalizarNome(curso.nome);
  const topicoSlug = normalizarNome(topico.nome);
  const pastaSlug = normalizarNome(pasta.nome);
  
  const cursoDir = path.join(BASE_UPLOAD_DIR, 'cursos', cursoSlug);
  const avaliacaoDir = path.join(cursoDir, 'avaliacao');
  const topicoDir = path.join(avaliacaoDir, topicoSlug);

  // Garantir que a pasta do curso exista
  console.log(`Verificando se o diretório do curso existe: ${cursoDir}`);
  ensureDir(cursoDir);
  
  // Garantir que a pasta avaliacao exista
  console.log(`Verificando se o diretório de avaliação existe: ${avaliacaoDir}`);
  ensureDir(avaliacaoDir);
  
  // Garantir que a pasta do tópico exista dentro de avaliacao
  console.log(`Verificando se o diretório do tópico de avaliação existe: ${topicoDir}`);
  ensureDir(topicoDir);
  
  // Estrutura correta para pastas de avaliação
  const pastaDir = path.join(topicoDir, pastaSlug);
  
  // Criar o diretório principal da pasta (sem subpastas)
  console.log(`A criar diretório da pasta: ${pastaDir}`);
  ensureDir(pastaDir);
  
  // URLs relativas para acesso web
  const urlPath = `uploads/cursos/${cursoSlug}/avaliacao/${topicoSlug}/${pastaSlug}`;
  
  return {
    dirPath: pastaDir,
    urlPath: urlPath
    // Removida a criação das propriedades submissoesPath e submissoesUrlPath
  };
};

// Função para criar estrutura de diretórios para mensagens de chat
const criarDiretoriosChat = (categoria, topico) => {
  const categoriaSlug = normalizarNome(categoria);
  const topicoSlug = normalizarNome(topico);

  const chatDir = path.join(BASE_UPLOAD_DIR, 'chat', categoriaSlug, topicoSlug);
  const conteudosDir = path.join(chatDir, 'conteudos');

  console.log(`A criar diretório para chat: ${chatDir}`);
  ensureDir(chatDir);
  
  console.log(`A criar diretório para conteúdos de chat: ${conteudosDir}`);
  ensureDir(conteudosDir);
  
  // Verificar se foram criados
  if (fs.existsSync(chatDir) && fs.existsSync(conteudosDir)) {
    console.log(`✅ Diretórios de chat criados com sucesso`);
  } else {
    console.error(`❌ Falha ao criar diretórios de chat`);
  }

  return {
    dirPath: chatDir,
    conteudosPath: conteudosDir,
    urlPath: `uploads/chat/${categoriaSlug}/${topicoSlug}`,
    conteudosUrlPath: `uploads/chat/${categoriaSlug}/${topicoSlug}/conteudos`
  };
};

// Função para mover ficheiro temporário para o destino final
const moverArquivo = (origem, destino) => {
  try {
    // Normalizar caminhos para comparação
    const origemPath = path.resolve(origem);
    const destinoPath = path.resolve(destino);
    
    console.log(`Movendo arquivo de "${origemPath}" para "${destinoPath}"`);

    // Se origem e destino são iguais, não precisamos fazer nada
    if (origemPath === destinoPath) {
      console.log('Origem e destino são iguais, não é necessário mover');
      return true;
    }

    // Verificar se o ficheiro de origem existe
    if (!fs.existsSync(origemPath)) {
      console.error(`Erro: Ficheiro de origem não existe: ${origemPath}`);
      return false;
    }

    // Garantir que o diretório de destino exista
    const destDir = path.dirname(destino);
    console.log(`Verificando diretório de destino: ${destDir}`);
    ensureDir(destDir);

    // Se o ficheiro de destino já existir, remover primeiro
    if (fs.existsSync(destino)) {
      try {
        console.log(`Removendo ficheiro de destino existente: ${destino}`);
        fs.unlinkSync(destino);
      } catch (deleteError) {
        console.error('Erro ao remover ficheiro existente:', deleteError);
        // Continuar mesmo com erro ao remover
      }
    }

    // Copiar o ficheiro
    console.log(`Copiando de ${origem} para ${destino}`);
    fs.copyFileSync(origem, destino);

    // Verificar se a cópia foi bem-sucedida
    if (!fs.existsSync(destino)) {
      console.error(`Erro: A cópia não foi bem-sucedida - ficheiro de destino não existe: ${destino}`);
      return false;
    }

    // Tentar remover o ficheiro de origem
    try {
      console.log(`Removendo ficheiro de origem: ${origem}`);
      fs.unlinkSync(origem);
    } catch (unlinkError) {
      console.error('Erro ao remover ficheiro de origem:', unlinkError);
      // Não falhar a operação se não conseguir remover o ficheiro de origem
    }

    console.log(`✅ Ficheiro movido com sucesso`);
    return true;
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
  criarDiretoriosTopicoAvaliacao,
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