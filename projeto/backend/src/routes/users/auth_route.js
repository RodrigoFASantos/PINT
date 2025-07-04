const express = require("express");
const router = express.Router();
const { loginUser, verifyToken, confirmAccount, changePassword, createUser, resendConfirmation, forgotPassword, resetPassword } = require("../../controllers/users/users_ctrl");
const uploadUtils = require('../../middleware/upload');

/**
 * Rotas de autenticação e gestão de contas
 * Inclui registo, login, confirmação de conta e recuperação de palavra-passe
 */

// Rota de verificação do estado da API
router.get("/", (req, res) => {
  res.status(200).json({ message: "API de autenticação está a funcionar!" });
});

// Rota para registo de novos utilizadores com possibilidade de upload de imagem
router.post("/register", uploadUtils.uploadUser.single("imagem"), createUser);

// Rota para iniciar sessão
router.post("/login", (req, res) => {
  // Log básico de segurança para tentativas de login
  console.log('🔍 [AUTH] Tentativa de login:', {
    email: req.body.email,
    ip: req.ip,
    timestamp: new Date().toISOString()
  });
  
  loginUser(req, res);
});

// Rota para verificar validade do token
router.post("/verify-token", verifyToken);

// Rota para confirmar conta através de email
router.post("/confirm-account", confirmAccount);

// Rota para alterar palavra-passe (primeira vez ou recuperação)
router.post("/change-password", changePassword);

// Rota para reenviar email de confirmação
router.post("/resend-confirmation", (req, res) => {
  console.log('📧 [AUTH] Reenvio de confirmação solicitado:', req.body.email);
  resendConfirmation(req, res);
});

// Rota para solicitar recuperação de palavra-passe
router.post("/forgot-password", (req, res) => {
  console.log('🔑 [AUTH] Recuperação de senha solicitada:', req.body.email);
  forgotPassword(req, res);
});

// Rota para redefinir palavra-passe com token
router.post("/reset-password", (req, res) => {
  console.log('🔄 [AUTH] Redefinição de senha em curso');
  resetPassword(req, res);
});

module.exports = router;