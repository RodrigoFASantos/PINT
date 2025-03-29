const express = require("express");
const router = express.Router();
const { getAllUsers, getFormadores, getFormandos, getGestores, createUser, loginUser, perfilUser, changePassword } = require("../controllers/users_ctrl");

router.get("/users", getAllUsers);
router.get("/formadores", getFormadores);
router.get("/formandos", getFormandos);
router.get("/gestores", getGestores);
router.post("/users/register", createUser);
router.post("/login", loginUser);
router.get("/perfil", perfilUser);
router.put("/users/change-password", changePassword);

module.exports = router;
