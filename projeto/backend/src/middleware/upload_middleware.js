const multer = require('multer');
const path = require('path');
const uploadUtils = require('./upload');

/**
 * Middleware especializado para upload de ficheiros
 * Fornece configurações específicas para diferentes tipos de upload
 * Integra-se com o sistema principal de uploads para gestão consistente
 * 
 * Funcionalidades:
 * - Upload temporário seguro para posterior movimentação
 * - Validação robusta de tipos de ficheiros
 * - Tratamento de erros especializado
 * - Suporte para diferentes contextos (chat, curso, avaliação)
 */

const {
  BASE_UPLOAD_DIR,
  ensureDir,
  normalizarNome,
  getFileType,
  gerarNomeUnico
} = uploadUtils;

/**
 * Configuração de armazenamento temporário para todos os uploads
 * Estratégia: todos os ficheiros são guardados temporariamente e depois movidos
 * Isto permite validação completa antes da localização final
 */
const tempStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const tempDir = path.join(BASE_UPLOAD_DIR, 'temp');
    ensureDir(tempDir);
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    // Gerar nome único para evitar colisões na pasta temporária
    const uniqueName = gerarNomeUnico(file.originalname);
    cb(null, uniqueName);
  }
});

/**
 * Filtro de validação abrangente para tipos de ficheiros
 * Define rigorosamente quais tipos são aceites no sistema
 * Essencial para manter a segurança e integridade
 * 
 * @param {Object} req - Requisição HTTP
 * @param {Object} file - Objeto do ficheiro enviado
 * @param {Function} cb - Callback de validação
 */
const fileFilter = (req, file, cb) => {
  // Lista completa de tipos MIME permitidos no sistema
  const allowedMimeTypes = [
    // Imagens - formatos comuns e modernos
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    
    // Documentos - Office e formatos padrão
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    
    // Vídeos - formatos web-friendly
    'video/mp4', 'video/webm', 'video/quicktime',
    
    // Áudios - formatos comuns
    'audio/mpeg', 'audio/wav', 'audio/ogg'
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Tipo de ficheiro não permitido (${file.mimetype}). Apenas imagens, documentos, vídeos e áudios são aceites.`), false);
  }
};

// Configuração de limites generosa para conteúdos educativos
const limits = {
  fileSize: 15 * 1024 * 1024 * 1024, // 15GB máximo - adequado para vídeos longos
};

// Configuração principal do multer com storage temporário
const upload = multer({
  storage: tempStorage,
  fileFilter,
  limits,
});

/**
 * Middleware para upload de ficheiros de chat
 * Processa anexos enviados em mensagens de conversação
 * Inclui validação e preparação para movimentação posterior
 * 
 * @param {Object} req - Requisição HTTP
 * @param {Object} res - Resposta HTTP
 * @param {Function} next - Próximo middleware na cadeia
 */
const uploadChatFile = (req, res, next) => {
  upload.single('anexo')(req, res, async (err) => {
    if (err) {
      return handleUploadErrors(err, req, res, next);
    }

    // Se não há ficheiro anexado, continuar normalmente
    if (!req.file) {
      return next();
    }

    try {
      // Marcar como upload de chat para processamento posterior
      req.isChatUpload = true;
      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Erro ao processar o ficheiro de chat'
      });
    }
  });
};

/**
 * Middleware para upload de conteúdos de curso
 * Processa materiais didáticos (documentos, vídeos, etc.)
 * Preparado para posterior organização hierárquica
 * 
 * @param {Object} req - Requisição HTTP
 * @param {Object} res - Resposta HTTP
 * @param {Function} next - Próximo middleware na cadeia
 */
const uploadCursoConteudo = (req, res, next) => {
  upload.single('ficheiro')(req, res, async (err) => {
    if (err) {
      return handleUploadErrors(err, req, res, next);
    }

    // Upload de ficheiro é opcional para alguns tipos de conteúdo
    if (!req.file) {
      return next();
    }

    try {
      // Marcar como upload de conteúdo para processamento posterior
      req.isCursoUpload = true;
      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Erro ao processar o ficheiro de conteúdo'
      });
    }
  });
};

/**
 * Middleware para upload de conteúdos de avaliação
 * Processa ficheiros específicos para testes, exames e submissões
 * Marcado especialmente para tratamento diferenciado
 * 
 * @param {Object} req - Requisição HTTP
 * @param {Object} res - Resposta HTTP
 * @param {Function} next - Próximo middleware na cadeia
 */
const uploadAvaliacaoConteudo = (req, res, next) => {
  upload.single('ficheiro')(req, res, async (err) => {
    if (err) {
      return handleUploadErrors(err, req, res, next);
    }

    // Upload é opcional para algumas operações de avaliação
    if (!req.file) {
      return next();
    }

    try {
      // Marcar esta requisição como upload de avaliação
      req.isAvaliacaoUpload = true;
      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Erro ao processar o ficheiro de avaliação'
      });
    }
  });
};

/**
 * Tratamento centralizado de erros de upload
 * Fornece mensagens específicas e úteis baseadas no tipo de erro
 * Essencial para diagnóstico e experiência do utilizador
 * 
 * @param {Error} err - Erro ocorrido durante o upload
 * @param {Object} req - Requisição HTTP
 * @param {Object} res - Resposta HTTP
 * @param {Function} next - Próximo middleware
 */
const handleUploadErrors = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // Erros específicos do Multer com mensagens amigáveis
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'Ficheiro muito grande. O tamanho máximo permitido é 15GB.'
      });
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Campo de ficheiro inesperado. Verifica o formulário de envio.'
      });
    } else if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Demasiados ficheiros. Envia apenas um ficheiro de cada vez.'
      });
    }
    
    // Outros erros do Multer
    return res.status(400).json({
      success: false,
      message: `Erro no upload: ${err.message}`
    });
  } else if (err) {
    // Erros de validação personalizada (ex: tipo de ficheiro)
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }

  // Se não há erro, continuar para o próximo middleware
  next();
};

module.exports = {
  upload,
  uploadChatFile,
  uploadCursoConteudo,
  uploadAvaliacaoConteudo,
  handleUploadErrors
};