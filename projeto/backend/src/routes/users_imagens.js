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
    // Não podemos acessar req.body.type aqui porque o body ainda não foi processado
    // Vamos determinar o tipo depois que o multer processar a requisição
    const extension = path.extname(file.originalname);
    const uniqueFilename = `FILE-${uuidv4()}${extension}`;
    cb(null, uniqueFilename);
  }
});

const upload = multer({ storage });
const verificarToken = require('../middleware/auth');

router.post('/upload-foto', verificarToken, upload.single('imagem'), async (req, res) => {
  try {
    // Agora podemos acessar req.body.type porque o multer já processou o body
    if (!req.body.type) {
      return res.status(400).json({ message: 'Tipo de imagem não especificado (AVATAR ou CAPA)' });
    }
    
    const tipo = req.body.type.toUpperCase(); // 'AVATAR' ou 'CAPA'
    
    if (tipo !== 'AVATAR' && tipo !== 'CAPA') {
      return res.status(400).json({ message: 'Tipo de imagem deve ser AVATAR ou CAPA' });
    }
    
    // Renomear o arquivo para incluir o tipo
    const oldPath = req.file.path;
    const newFileName = `${tipo}-${uuidv4()}${path.extname(req.file.originalname)}`;
    const newPath = path.join('uploads', newFileName);
    
    fs.renameSync(oldPath, newPath);
    
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