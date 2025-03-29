const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const User = require('../database/models/User');

// Configuração do multer
const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const tipo = req.body.type;
    const userId = req.body.id_utilizador; // vem no formData
    cb(null, `${tipo}_${userId}${ext}`);
  }
});

const upload = multer({ storage });

// Upload
router.post('/upload-foto', upload.single('imagem'), async (req, res) => {
  try {
    const userId = req.body.id_utilizador;
    const tipo = req.body.type;
    const campo = tipo === 'capa' ? 'foto_capa' : 'foto_perfil';

    await User.update(
      { [campo]: req.file.filename },
      { where: { id_utilizador: userId } }
    );

    res.json({ message: 'Imagem atualizada com sucesso!', file: req.file.filename });
  } catch (error) {
    console.error("Erro no upload:", error);
    res.status(500).json({ message: 'Erro ao atualizar a imagem' });
  }
});

module.exports = router;
