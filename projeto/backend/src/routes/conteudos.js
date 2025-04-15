const express = require("express");
const router = express.Router();
const { getAllConteudos, createConteudo } = require("../controllers/conteudos_ctrl");

// Corrigir os caminhos para não incluir 'conteudos' no path
router.get("/", getAllConteudos);
router.post("/", createConteudo);

module.exports = router;