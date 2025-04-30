const express = require("express");
const router = express.Router();
const { loginUser, verifyToken, confirmAccount, changePassword, createUser } = require("../../controllers/users/users_ctrl");
const uploadUtils = require('../../middleware/upload');

// Rota para debug - verificar se o servidor está respondendo
router.get("/", (req, res) => {
  res.status(200).json({ message: "API de autenticação está funcionando!" });
});

// Rota para registro de novos usuários com upload de imagem
router.post("/register", uploadUtils.uploadUser.single("imagem"), createUser);

// Rota para login
router.post("/login", loginUser);

// Rota para verificar token
router.post("/verify-token", verifyToken);

// Rota para confirmar conta
router.post("/confirm-account", confirmAccount);

// Rota para alterar senha (primeira vez ou recuperação)
router.post("/change-password", changePassword);

module.exports = router;