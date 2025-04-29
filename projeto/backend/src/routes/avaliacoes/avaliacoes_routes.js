const express = require("express");
const router = express.Router();
const verificarToken = require('../../middleware/auth');
const autorizar = require('../../middleware/autorizar');
const { getAllAvaliacoes, createAvaliacao } = require("../../controllers/avaliacoes/avaliacoes_ctrl");

// Rotas protegidas - adicionar autenticação e autorização
router.get("/", verificarToken, getAllAvaliacoes);
router.post("/", verificarToken, autorizar([1, 2]), createAvaliacao);

module.exports = router;