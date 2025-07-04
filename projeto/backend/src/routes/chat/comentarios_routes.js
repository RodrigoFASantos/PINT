const express = require("express");
const router = express.Router();
const authMiddleware = require("../../middleware/auth");
const { avaliarComentario, denunciarComentario } = require("../../controllers/chat/comentarios_ctrl");

/**
 * Rotas para interação com comentários
 * Permite avaliar (like/dislike) e denunciar comentários
 */

// Aplicar autenticação a todas as rotas
router.use(authMiddleware);

// === AVALIAÇÃO DE COMENTÁRIOS ===

// Avaliar comentário com like ou dislike
router.post("/:idComentario/avaliar", avaliarComentario);

// === DENÚNCIA DE COMENTÁRIOS ===

// Denunciar comentário por conteúdo inadequado
router.post("/:idComentario/denunciar", denunciarComentario);

module.exports = router;