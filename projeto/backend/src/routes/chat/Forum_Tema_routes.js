const express = require("express");
const router = express.Router();
const authMiddleware = require("../../middleware/auth");
const { uploadChatFile } = require('../../middleware/upload_middleware');
const { getTemasByTopico, getTemaById, createTema, avaliarTema, denunciarTema, getComentariosByTema, createComentario } = require("../../controllers/chat/Forum_Tema_ctrl");

// Middleware para verificar autenticação
router.use(authMiddleware);

// Rotas para Temas
router.get("/topico/:topicoId/temas", getTemasByTopico);
router.get("/tema/:temaId", getTemaById);
router.post("/topico/:topicoId/tema", uploadChatFile, createTema);
router.post("/tema/:temaId/avaliar", avaliarTema);
router.post("/tema/:temaId/denunciar", denunciarTema);

// Rotas para Comentários
router.get("/tema/:temaId/comentarios", getComentariosByTema);
router.post("/tema/:temaId/comentario", uploadChatFile, createComentario);

module.exports = router;