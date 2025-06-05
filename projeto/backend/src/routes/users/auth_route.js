const express = require("express");
const router = express.Router();
const { loginUser, verifyToken, confirmAccount, changePassword, createUser } = require("../../controllers/users/users_ctrl");
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

module.exports = router;