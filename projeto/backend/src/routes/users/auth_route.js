const express = require("express");
const router = express.Router();
const { loginUser } = require("../../controllers/users/users_ctrl");

// Rota de login
router.post("/login", loginUser);

module.exports = router;