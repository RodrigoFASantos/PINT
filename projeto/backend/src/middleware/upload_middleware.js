const multer = require('multer');
const path = require('path');
const uploadUtils = require('./upload');

/**
 * Middleware especializado para upload de ficheiros
 * Fornece configurações específicas para diferentes tipos de upload
 * Integra com o sistema principal de uploads
 */

const {
  BASE_UPLOAD_DIR,
  ensureDir,
  normalizarNome,
  getFileType,
  gerarNomeUnico
} = uploadUtils;

/**
 * Configuração de armazenamento temporário
 * Todos os ficheiros são inicialmente guardados numa pasta temp
 */
const tempStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const tempDir = path.join(BASE_UPLOAD_DIR, 'temp');
    ensureDir(tempDir);
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    // Gerar nome único para evitar colisões
    const uniqueName = gerarNomeUnico(file.originalname);
    cb(null, uniqueName);
  }
});

/**
 * Filtro de validação de tipos de ficheiros
 * Define quais tipos são aceites no sistema
 * @param {Object} req - Requisição HTTP
 * @param {Object} file - Ficheiro enviado
 * @param {Function} cb - Callback de resposta
 */
const fileFilter = (req, file, cb) => {
  // Lista abrangente de tipos MIME permitidos
  const allowedMimeTypes = [
    // Imagens
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    
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
    'video/mp4', 'video/webm', 'video/quicktime',
    
    // Áudios
    'audio/mpeg', 'audio/wav', 'audio/ogg'
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Tipo de ficheiro não permitido (${file.mimetype}). Apenas imagens, documentos, vídeos e áudios são aceites.`), false);
  }
};

// Configuração de limites para uploads
const limits = {
  fileSize: 15 * 1024 * 1024 * 1024, // 15GB máximo
};

// Configuração principal do multer
const upload = multer({
  storage: tempStorage,
  fileFilter,
  limits,
});

/**
 * Middleware para upload de ficheiros de chat
 * Processa anexos enviados em mensagens de chat
 * @param {Object} req - Requisição HTTP
 * @param {Object} res - Resposta HTTP
 * @param {Function} next - Próximo middleware
 */
const uploadChatFile = (req, res, next) => {
  upload.single('anexo')(req, res, async (err) => {
    if (err) {
      return handleUploadErrors(err, req, res, next);
    }

    // Se não há ficheiro, continuar normalmente
    if (!req.file) {
      return next();
    }

    try {
      console.log(`Ficheiro de chat recebido: ${req.file.originalname}`);
      next();
    } catch (error) {
      console.error('Erro ao processar upload de chat:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Erro ao processar o ficheiro'
      });
    }
  });
};

/**
 * Middleware para upload de conteúdos de curso
 * Processa ficheiros de materiais educativos
 * @param {Object} req - Requisição HTTP
 * @param {Object} res - Resposta HTTP
 * @param {Function} next - Próximo middleware
 */
const uploadCursoConteudo = (req, res, next) => {
  upload.single('ficheiro')(req, res, async (err) => {
    if (err) {
      return handleUploadErrors(err, req, res, next);
    }

    // Se não há ficheiro, continuar normalmente
    if (!req.file) {
      return next();
    }

    try {
      console.log(`Conteúdo de curso recebido: ${req.file.originalname}`);
      next();
    } catch (error) {
      console.error('Erro ao processar conteúdo:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Erro ao processar o ficheiro'
      });
    }
  });
};

/**
 * Middleware para upload de conteúdos de avaliação
 * Processa ficheiros específicos para avaliações e testes
 * @param {Object} req - Requisição HTTP
 * @param {Object} res - Resposta HTTP
 * @param {Function} next - Próximo middleware
 */
const uploadAvaliacaoConteudo = (req, res, next) => {
  upload.single('ficheiro')(req, res, async (err) => {
    if (err) {
      return handleUploadErrors(err, req, res, next);
    }

    // Se não há ficheiro, continuar normalmente
    if (!req.file) {
      return next();
    }

    try {
      // Marcar como upload de avaliação para processamento especial
      req.isAvaliacaoUpload = true;
      console.log(`Ficheiro de avaliação recebido: ${req.file.originalname}`);
      next();
    } catch (error) {
      console.error('Erro ao processar avaliação:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Erro ao processar o ficheiro de avaliação'
      });
    }
  });
};

/**
 * Tratamento centralizado de erros de upload
 * Fornece mensagens de erro específicas e úteis
 * @param {Error} err - Erro ocorrido
 * @param {Object} req - Requisição HTTP
 * @param {Object} res - Resposta HTTP
 * @param {Function} next - Próximo middleware
 */
const handleUploadErrors = (err, req, res, next) => {
  console.error('Erro no upload:', err.message);

  if (err instanceof multer.MulterError) {
    // Erros específicos do Multer
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'Ficheiro muito grande. O tamanho máximo permitido é 15MB.'
      });
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Campo de ficheiro inesperado. Verifique o formulário.'
      });
    }
    return res.status(400).json({
      success: false,
      message: `Erro no upload: ${err.message}`
    });
  } else if (err) {
    // Outros tipos de erro
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }

  // Se não há erro, continuar
  next();
};

module.exports = {
  upload,
  uploadChatFile,
  uploadCursoConteudo,
  uploadAvaliacaoConteudo,
  handleUploadErrors
};