const express = require("express");
const router = express.Router();
const authMiddleware = require("../../middleware/auth");
const { avaliarComentario, denunciarComentario } = require("../../controllers/chat/comentarios_ctrl");

// Aplicar middleware de autenticação a todas as rotas
router.use(authMiddleware);

// Rota para avaliar comentários com like ou dislike
// POST /api/comentarios/:idComentario/avaliar
router.post("/:idComentario/avaliar", avaliarComentario);

// Rota para denunciar comentários por conteúdo inadequado
// POST /api/comentarios/:idComentario/denunciar
router.post("/:idComentario/denunciar", denunciarComentario);

module.exports = router;