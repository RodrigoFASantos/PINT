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
  deleteUser,
  loginUser, 
  perfilUser, 
  updatePerfilUser, 
  changePassword,
  uploadImagemPerfil,
  uploadImagemCapa,
  confirmAccount,
  resendConfirmation,
  getUserById
} = require("../../controllers/users/users_ctrl");
const uploadUtils = require('../../middleware/upload');

// Rota para debug - verificar se o servidor está a responder
router.get("/debug-check", (req, res) => {
  res.status(200).json({ message: "API de users está a funcionar!" });
});

// Rotas específicas devem vir PRIMEIRO
router.get("/formadores", verificarToken, getFormadores);
router.get("/formandos", verificarToken, getFormandos);
router.get("/gestores", verificarToken, getGestores);
router.get("/perfil", verificarToken, perfilUser);

// Rotas de autenticação
router.post("/register", createUser);
router.post("/login", loginUser);
router.put("/perfil", verificarToken, updatePerfilUser);

// Rota para mudança de senha
router.put("/change-password", verificarToken, changePassword);

// Rotas de confirmação de conta
router.post("/confirm-account", confirmAccount);
router.post("/resend-confirmation", resendConfirmation);

// Rotas de upload
router.post("/img/perfil", verificarTokenComEmail, uploadUtils.ensureUserDir, uploadUtils.uploadTemp.single("imagem"), uploadImagemPerfil);
router.post("/img/capa", verificarTokenComEmail, uploadUtils.ensureUserDir, uploadUtils.uploadTemp.single("imagem"), uploadImagemCapa);

// Rotas com parâmetros dinâmicos POR ÚLTIMO (rotas para os admins tratarem de utilizadores)
router.get("/:id", verificarToken, getUserById);
router.put("/:id", verificarToken, updatePerfilUser);
router.delete("/:id", (req, res, next) => {
  console.log('===== DEBUG DELETE USER =====');
  console.log('Requisição DELETE recebida para ID:', req.params.id);
  console.log('Headers:', req.headers);
  console.log('Token presente:', !!req.headers.authorization);
  next();
}, verificarToken, deleteUser);

// Rota genérica (deve ser a última)
router.get("/", verificarToken, getAllUsers);

module.exports = router;