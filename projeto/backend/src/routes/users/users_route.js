const express = require("express");
const router = express.Router();
const verificarToken = require('../../middleware/auth');
const verificarTokenComEmail = require('../../utils/verificarTokenComEmail');
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
  uploadImagemCapa,
  confirmAccount,
  resendConfirmation
} = require("../../controllers/users/users_ctrl");
const uploadUtils = require('../../middleware/upload');

// Rota para debug - verificar se o servidor está a responder
router.get("/", (req, res) => {
  res.status(200).json({ message: "API de users está a funcionar!" });
});

// Rotas existentes
router.get("/users", verificarToken, getAllUsers);
router.get("/formadores", verificarToken, getFormadores);
router.get("/formandos", verificarToken, getFormandos);
router.get("/gestores", verificarToken, getGestores);
router.post("/register", createUser);
router.post("/login", loginUser);
router.get("/perfil", verificarToken, perfilUser);
router.put("/perfil", verificarToken, updatePerfilUser);
router.put("/users/change-password", changePassword);

// Rotas de confirmação de conta
router.post("/confirm-account", confirmAccount);
router.post("/resend-confirmation", resendConfirmation);

// Rotas de upload de imagens - usando o middleware verificarTokenComEmail da pasta utils
router.post("/img/perfil", verificarTokenComEmail, (req, res, next) => {
  // Middleware de pré-processamento
  console.log('Middleware de pré-processamento para upload de imagem de perfil');
  
  // Definir tipo como AVATAR
  req.body.tipo = 'AVATAR';
  
  console.log('Dados do usuário após processamento:', req.user);
  next();
}, uploadUtils.uploadUser.single("imagem"), uploadImagemPerfil);

router.post("/img/capa", verificarTokenComEmail, (req, res, next) => {
  // Middleware de pré-processamento
  console.log('Middleware de pré-processamento para upload de imagem de capa');
  
  // Definir tipo como CAPA
  req.body.tipo = 'CAPA';
  
  console.log('Dados do usuário após processamento:', req.user);
  next();
}, uploadUtils.uploadUser.single("imagem"), uploadImagemCapa);

module.exports = router;