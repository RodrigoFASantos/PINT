const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../database/models/User');

// Configuração do multer para guardar imagens
const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    const tipo = req.body.type.toUpperCase(); // AVATAR ou CAPA
    cb(null, `${tipo}.png`);
  }
});

const upload = multer({ storage });

// Upload
router.post('/upload-foto', upload.single('imagem'), async (req, res) => {
  try {
    const tipo = req.body.type.toUpperCase(); // 'AVATAR' ou 'CAPA'
    const ficheiroDestino = path.join(__dirname, `../../uploads/${tipo}.png`);

    // Apagar as imagens anteriores antes de fazer o upload
    if (fs.existsSync(ficheiroDestino)) {
      fs.unlinkSync(ficheiroDestino);
    }

    res.json({ message: 'Imagem atualizada com sucesso!', file: `${tipo}.png` });
  } catch (error) {
    console.error("Erro no upload:", error);
    res.status(500).json({ message: 'Erro ao atualizar a imagem' });
  }
});

module.exports = router;
