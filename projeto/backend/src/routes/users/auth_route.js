const express = require("express");
const router = express.Router();
const { loginUser, verifyToken, confirmAccount, changePassword, createUser, resendConfirmation, forgotPassword, resetPassword } = require("../../controllers/users/users_ctrl");
const uploadUtils = require('../../middleware/upload');

// Rota para debug - verificar se o servidor está a responder
router.get("/", (req, res) => {
  res.status(200).json({ message: "API de autenticação está a funcionar!" });
});

// Rota para registo de novos utilizadores com upload de imagem
router.post("/register", uploadUtils.uploadUser.single("imagem"), createUser);

// Rota para iniciar sessão
router.post("/login", (req, res) => {
  // Log detalhado da tentativa de login
  console.log('🔍 [AUTH ROUTE] ===============================');
  console.log('🔍 [AUTH ROUTE] NOVA TENTATIVA DE LOGIN');
  console.log('🔍 [AUTH ROUTE] ===============================');
  console.log('🔍 [AUTH ROUTE] IP:', req.ip);
  console.log('🔍 [AUTH ROUTE] Origin:', req.get('origin'));
  console.log('🔍 [AUTH ROUTE] User-Agent:', req.get('user-agent'));
  console.log('🔍 [AUTH ROUTE] Body:', { 
    email: req.body.email, 
    hasPassword: !!req.body.password,
    bodyKeys: Object.keys(req.body)
  });
  console.log('🔍 [AUTH ROUTE] Headers:', {
    'content-type': req.get('content-type'),
    'authorization': req.get('authorization'),
    'accept': req.get('accept')
  });
  console.log('🔍 [AUTH ROUTE] ===============================');
  
  // Chamar o controlador
  loginUser(req, res);
});

// Rota para verificar token
router.post("/verify-token", verifyToken);

// Rota para confirmar conta
router.post("/confirm-account", confirmAccount);

// Rota para alterar palavra-passe (primeira vez ou recuperação)
router.post("/change-password", changePassword);

// Rota para reenviar email de confirmação
router.post("/resend-confirmation", (req, res) => {
  console.log('📧 [AUTH ROUTE] ===============================');
  console.log('📧 [AUTH ROUTE] REENVIO DE CONFIRMAÇÃO');
  console.log('📧 [AUTH ROUTE] ===============================');
  console.log('📧 [AUTH ROUTE] Email solicitado:', req.body.email);
  console.log('📧 [AUTH ROUTE] IP:', req.ip);
  console.log('📧 [AUTH ROUTE] ===============================');
  
  resendConfirmation(req, res);
});

// Rota para solicitar recuperação de senha
router.post("/forgot-password", (req, res) => {
  console.log('🔑 [AUTH ROUTE] ===============================');
  console.log('🔑 [AUTH ROUTE] RECUPERAÇÃO DE SENHA');
  console.log('🔑 [AUTH ROUTE] ===============================');
  console.log('🔑 [AUTH ROUTE] Email solicitado:', req.body.email);
  console.log('🔑 [AUTH ROUTE] IP:', req.ip);
  console.log('🔑 [AUTH ROUTE] ===============================');
  
  forgotPassword(req, res);
});

// Rota para redefinir senha com token
router.post("/reset-password", (req, res) => {
  console.log('🔄 [AUTH ROUTE] ===============================');
  console.log('🔄 [AUTH ROUTE] REDEFINIÇÃO DE SENHA');
  console.log('🔄 [AUTH ROUTE] ===============================');
  console.log('🔄 [AUTH ROUTE] Token fornecido:', !!req.body.token);
  console.log('🔄 [AUTH ROUTE] Nova senha fornecida:', !!req.body.password);
  console.log('🔄 [AUTH ROUTE] ===============================');
  
  resetPassword(req, res);
});

module.exports = router;