const express = require("express");
const router = express.Router();
const { loginUser, verifyToken, confirmAccount, changePassword } = require("../../controllers/users/users_ctrl");


// Rota para login
router.post("/login", loginUser);

// Rota para verificar token
router.post("/verify-token", verifyToken);

// Rota para confirmar conta
router.post("/confirm-account", confirmAccount);

// Rota para alterar senha (primeira vez ou recuperação)
router.post("/change-password", changePassword);

module.exports = router;