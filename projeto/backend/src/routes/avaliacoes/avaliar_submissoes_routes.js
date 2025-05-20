const express = require("express");
const router = express.Router();
const verificarToken = require('../../middleware/auth');
const { getSubmissoes, updateSubmissaoNota } = require("../../controllers/avaliacoes/avaliar_submissoes_ctrl");

// Obter submissões para avaliação
router.get("/submissoes", verificarToken, getSubmissoes);

// Atualizar nota de uma submissão
router.put("/submissoes/:id/nota", verificarToken, updateSubmissaoNota);

module.exports = router;