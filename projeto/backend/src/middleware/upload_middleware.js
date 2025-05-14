const multer = require('multer');
const path = require('path');
const uploadUtils = require('./upload');

// Usar as funções do uploadUtils
const {
  BASE_UPLOAD_DIR,
  ensureDir,
  normalizarNome,
  getFileType,
  gerarNomeUnico
} = uploadUtils;

// Configurar armazenamento temporário
const tempStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const tempDir = path.join(BASE_UPLOAD_DIR, 'temp');
    ensureDir(tempDir);
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    // Gerar nome de ficheiro único para evitar colisões
    const uniqueName = gerarNomeUnico(file.originalname);
    cb(null, uniqueName);
  }
});

// Função para filtrar tipos de ficheiros
const fileFilter = (req, file, cb) => {
  // Lista de tipos MIME permitidos
  const allowedMimeTypes = [
    // Imagens
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    // Documentos
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    // Vídeos
    'video/mp4',
    'video/webm',
    'video/quicktime',
    // Áudios
    'audio/mpeg',
    'audio/wav',
    'audio/ogg'
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Tipo de ficheiro não permitido (${file.mimetype}). Apenas imagens, documentos, vídeos e áudios são aceites.`), false);
  }
};

// Configurar limites
const limits = {
  fileSize: 15 * 1024 * 1024 * 1024, // 15GB máximo
};

// Configurar middleware multer
const upload = multer({
  storage: tempStorage,
  fileFilter,
  limits,
});

// Middleware para tratar uploads de chat
const uploadChatFile = (req, res, next) => {
  upload.single('anexo')(req, res, async (err) => {
    if (err) {
      return handleUploadErrors(err, req, res, next);
    }

    // Se não houver ficheiro, continue
    if (!req.file) {
      return next();
    }

    try {
      // Registar informações do ficheiro para depuração
      console.log(`Ficheiro de chat recebido: ${req.file.originalname}, guardado temporariamente como: ${req.file.filename}`);
      next();
    } catch (error) {
      console.error('Erro ao processar upload de chat:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao processar o ficheiro'
      });
    }
  });
};

// Middleware para tratar uploads de conteúdo de curso
const uploadCursoConteudo = (req, res, next) => {
  upload.single('ficheiro')(req, res, async (err) => {
    if (err) {
      return handleUploadErrors(err, req, res, next);
    }

    // Se não houver ficheiro, continue
    if (!req.file) {
      return next();
    }

    try {
      // Registar informações do ficheiro para depuração
      console.log(`Ficheiro de curso recebido: ${req.file.originalname}, guardado temporariamente como: ${req.file.filename}`);
      next();
    } catch (error) {
      console.error('Erro ao processar upload de conteúdo:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao processar o ficheiro'
      });
    }
  });
};

// Middleware para tratamento de erros de upload
const handleUploadErrors = (err, req, res, next) => {
  console.error('Erro no upload:', err);

  if (err instanceof multer.MulterError) {
    // Erro Multer ocorreu durante o upload
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'Ficheiro muito grande. O tamanho máximo permitido é 15MB.'
      });
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Campo de ficheiro inesperado. Verifique o nome do campo no formulário.'
      });
    }
    return res.status(400).json({
      success: false,
      message: `Erro no upload: ${err.message}`
    });
  } else if (err) {
    // Outro erro ocorreu
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }

  // Se não houver erro, continua
  next();
};

const uploadAvaliacaoConteudo = (req, res, next) => {
  upload.single('ficheiro')(req, res, async (err) => {
    if (err) {
      return handleUploadErrors(err, req, res, next);
    }

    // Se não houver ficheiro, continue
    if (!req.file) {
      return next();
    }

    try {
      // Marcamos explicitamente que este ficheiro pertence a uma avaliação
      req.isAvaliacaoUpload = true;
      console.log(`Ficheiro de avaliação recebido: ${req.file.originalname}, guardado temporariamente como: ${req.file.filename}`);
      next();
    } catch (error) {
      console.error('Erro ao processar upload de avaliação:', error);
      return res.status(500).json({
        success: false,
        message: 'Erro ao processar o ficheiro de avaliação'
      });
    }
  });
};

module.exports = {
  upload,
  uploadChatFile,
  uploadCursoConteudo,
  uploadAvaliacaoConteudo,
  handleUploadErrors
};