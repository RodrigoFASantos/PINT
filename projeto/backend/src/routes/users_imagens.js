const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const User = require('../database/models/User');

// Configuração do multer com nomes únicos
const storage = multer.diskStorage({
  destination: 'uploads/',

  filename: (req, file, cb) => {
    const tipo = req.body.type.toUpperCase();
    const extension = path.extname(file.originalname);
    cb(null, `${tipo}-${uuidv4()}${extension}`);
  }

});
/*A partir de filename acima, gera algo como AVATAR-<uuid>.png, ou CAPA-<uuid>.jpg. Portanto, nunca há sobrescrita por nome repetido — cada ficheiro terá um nome único*/


const upload = multer({ storage });
const verificarToken = require('../middleware/auth');

router.post('/upload-foto', verificarToken, upload.single('imagem'), async (req, res) => {
  try {
    const tipo = req.body.type.toUpperCase(); // 'AVATAR' ou 'CAPA'
    const newFileName = req.file.filename;
    
    // Aqui a autenticação implementada contém o id do utilizador.
    const userId = req.user.id_utilizador; 
    
    // Atualiza o registo do utilizador com o novo nome da imagem
    if (tipo === 'AVATAR') {
      await User.update({ foto_perfil: newFileName }, { where: { id_utilizador: userId } });
    } else if (tipo === 'CAPA') {
      await User.update({ foto_capa: newFileName }, { where: { id_utilizador: userId } });
    }

    res.json({ message: 'Imagem atualizada com sucesso!', file: newFileName });
  } catch (error) {
    console.error("Erro no upload:", error);
    res.status(500).json({ message: 'Erro ao atualizar a imagem' });
  }
});

module.exports = router;
