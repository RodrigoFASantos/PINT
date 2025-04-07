const express = require("express");
const router = express.Router();
const verificarToken = require('../middleware/auth');
const { getAllUsers, getFormadores, getFormandos, getGestores, createUser, loginUser, perfilUser, updatePerfilUser, changePassword } = require("../controllers/users_ctrl");

// Rota para debug - verificar se o servidor está a responder
router.get("/", (req, res) => {
  res.status(200).json({ message: "API de users está a funcionar!" });
});

// Rotas existentes
router.get("/users", getAllUsers);
router.get("/formadores", getFormadores);
router.get("/formandos", getFormandos);
router.get("/gestores", getGestores);

router.post("/users/register", createUser);

router.post("/login", loginUser);

router.get("/perfil", verificarToken, perfilUser);
router.put("/perfil", verificarToken, updatePerfilUser);
router.put("/users/change-password", changePassword);

module.exports = router;