const express = require("express");
const router = express.Router();
const { getAllAvaliacoes, createAvaliacao } = require("../controllers/avaliacoes_ctrl");

// Corrigir os caminhos para não incluir 'avaliacoes' no path
router.get("/", getAllAvaliacoes);
router.post("/", createAvaliacao);

module.exports = router;