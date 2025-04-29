const express = require("express");
const router = express.Router();
const verificarToken = require('../../middleware/auth');
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
router.get("/users", getAllUsers);
router.get("/formadores", getFormadores);
router.get("/formandos", getFormandos);
router.get("/gestores", getGestores);
router.post("/register", createUser);
router.post("/login", loginUser);
router.get("/perfil", verificarToken, perfilUser);
router.put("/perfil", verificarToken, updatePerfilUser);
router.put("/users/change-password", changePassword);

// Rotas de confirmação de conta
router.post("/confirm-account", confirmAccount);
router.post("/resend-confirmation", resendConfirmation);

// Rotas de upload de imagens - usando uploadUtils diretamente
router.post("/img/perfil", verificarToken, uploadUtils.uploadUser.single("imagem"), uploadImagemPerfil);
router.post("/img/capa", verificarToken, uploadUtils.uploadUser.single("imagem"), uploadImagemCapa);

module.exports = router;