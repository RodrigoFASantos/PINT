const express = require("express");
const router = express.Router();
const verificarToken = require('../../middleware/auth');
const { getSubmissoes, updateSubmissaoNota } = require("../../controllers/avaliacoes/avaliar_submissoes_ctrl");

/**
 * Rotas para avaliação de submissões
 * Permite consultar e avaliar trabalhos submetidos pelos formandos
 */

// === CONSULTA DE SUBMISSÕES ===

// Obter lista de submissões para avaliação
router.get("/submissoes", verificarToken, getSubmissoes);

// === AVALIAÇÃO DE SUBMISSÕES ===

// Atualizar nota de uma submissão específica
router.put("/submissoes/:id/nota", verificarToken, updateSubmissaoNota);

module.exports = router;