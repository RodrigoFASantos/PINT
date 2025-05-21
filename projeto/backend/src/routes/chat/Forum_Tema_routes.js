const express = require("express");
const router = express.Router();
const authMiddleware = require("../../middleware/auth");
const { uploadChatFile } = require('../../middleware/upload_middleware');
const { 
  getTemasByTopico, 
  getTemaById, 
  createTema, 
  updateTema, 
  deleteTema, 
  avaliarTema, 
  denunciarTema, 
  getComentariosByTema, 
  createComentario,
  updateComentario,
  deleteComentario,
  avaliarComentario,
  denunciarComentario
} = require("../../controllers/chat/Forum_Tema_ctrl");

// Middleware para verificar autenticação
router.use(authMiddleware);

// Rotas para Temas
router.get("/topico/:topicoId/temas", getTemasByTopico);
router.get("/tema/:temaId", getTemaById);
router.post("/topico/:topicoId/tema", uploadChatFile, createTema);
router.put("/tema/:temaId", updateTema); // Editar tema
router.delete("/tema/:temaId", deleteTema); // ESTA LINHA ESTAVA EM FALTA!
router.post("/tema/:temaId/avaliar", avaliarTema);
router.post("/tema/:temaId/denunciar", denunciarTema);

// Rotas para Comentários
router.get("/tema/:temaId/comentarios", getComentariosByTema);
router.post("/tema/:temaId/comentario", uploadChatFile, createComentario);
router.put("/comentario/:comentarioId", updateComentario); // Editar comentário
router.delete("/comentario/:comentarioId", deleteComentario); // Apagar comentário
router.post("/comentario/:comentarioId/avaliar", avaliarComentario); // Avaliar comentário
router.post("/comentario/:comentarioId/denunciar", denunciarComentario); // Denunciar comentário

module.exports = router;