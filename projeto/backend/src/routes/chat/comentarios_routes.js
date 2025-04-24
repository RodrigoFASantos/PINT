const express = require("express");
const router = express.Router();
const { getAllComentarios, createComentario } = require("../../controllers/chat/comentarios_ctrl");

// Corrigir os caminhos para não incluir 'comentarios' no path
router.get("/", getAllComentarios);
router.post("/", createComentario);

module.exports = router;