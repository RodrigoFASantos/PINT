const express = require("express");
const router = express.Router();
const verificarToken = require('../middleware/auth');
const { 
  getAllUsers, 
  getFormadores, 
  getFormandos, 
  getGestores, 
  createUser, 
  loginUser, 
  perfilUser, 
  updatePerfilUser, 
  changePassword,
  uploadImagemPerfil,
  uploadImagemCapa
} = require("../controllers/users/users_ctrl");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Configuração do upload para imagens de usuários
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Assegura que o diretório existe
    const dir = "uploads/users/";
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    // Determinar o tipo de imagem (CAPA ou AVATAR)
    const tipoImagem = req.body.tipo === "capa" ? "CAPA" : "AVATAR";
    
    // Armazenar temporariamente o tipo no request para uso posterior
    req.tipoImagem = tipoImagem;
    
    // Criar um nome de arquivo temporário com timestamp
    // Será renomeado após a obtenção dos dados do usuário
    const tempFilename = `temp_${Date.now()}_${tipoImagem}.png`;
    
    cb(null, tempFilename);
  }
});

// Filtro para aceitar apenas imagens PNG
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'image/png') {
    cb(null, true);
  } else {
    cb(new Error('Apenas imagens PNG são permitidas!'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter
});

// Rota para debug - verificar se o servidor está a responder
router.get("/", (req, res) => {
  res.status(200).json({ message: "API de users está a funcionar!" });
});

// Rotas existentes
router.get("/users", getAllUsers);
router.get("/formadores", getFormadores);
router.get("/formandos", getFormandos);
router.get("/gestores", getGestores);
router.post("/register", createUser);
router.post("/login", loginUser);
router.get("/perfil", verificarToken, perfilUser);
router.put("/perfil", verificarToken, updatePerfilUser);
router.put("/users/change-password", changePassword);

// Rotas de upload de imagens - Agora usando as funções do controlador
router.post("/img/perfil", verificarToken, upload.single("imagem"), uploadImagemPerfil);
router.post("/img/capa", verificarToken, upload.single("imagem"), uploadImagemCapa);

module.exports = router;