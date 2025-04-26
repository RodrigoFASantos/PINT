const multer = require('multer');
const path = require('path');

// Configuração do armazenamento
const storage = multer.memoryStorage(); // Armazena temporariamente na memória

// Limites de upload
const limits = {
  fileSize: 10 * 1024 * 1024, // 10MB
};

// Filtro de arquivos
const fileFilter = (req, file, cb) => {
  // Lista de mimetypes permitidos
  const allowedMimeTypes = [
    // Imagens
    'image/jpeg', 'image/png', 'image/gif', 'image/svg+xml',
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
        `Tipo de arquivo não permitido. Formatos aceitos: ${allowedMimeTypes.join(', ')}`
      ),
      false
    );
  }
};

// Configuração do Multer
const upload = multer({
  storage,
  limits,
  fileFilter
});

module.exports = upload;