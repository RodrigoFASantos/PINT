const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Garantir que o diretório de uploads existe
const uploadDir = path.join(__dirname, '../../uploads/chat');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configurar armazenamento
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Gerar nome de arquivo único para evitar colisões
    const uniqueSuffix = crypto.randomBytes(16).toString('hex');
    const fileExt = path.extname(file.originalname);
    cb(null, `${Date.now()}-${uniqueSuffix}${fileExt}`);
  }
});

// Função para filtrar tipos de arquivos
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
    cb(new Error('Tipo de arquivo não permitido. Apenas imagens, documentos, vídeos e áudios são aceitos.'), false);
  }
};

// Configurar limites
const limits = {
  fileSize: 10 * 1024 * 1024, // 10MB máximo
};

// Configurar middleware multer
const upload = multer({
  storage,
  fileFilter,
  limits,
});

// Middleware para tratamento de erros de upload
const handleUploadErrors = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // Erro Multer ocorreu durante o upload
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'Arquivo muito grande. O tamanho máximo permitido é 10MB.'
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

module.exports = upload;
module.exports.handleUploadErrors = handleUploadErrors;