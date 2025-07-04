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

/**
 * Rotas para gestão de temas e comentários do fórum
 * Permite criar, consultar, editar e interagir com temas e comentários
 */

// Aplicar autenticação a todas as rotas
router.use(authMiddleware);

// === GESTÃO DE TEMAS ===

// Obter temas de um tópico específico
router.get("/topico/:topicoId/temas", getTemasByTopico);

// Obter dados de um tema específico
router.get("/tema/:temaId", getTemaById);

// Criar novo tema (com possibilidade de anexo)
router.post("/topico/:topicoId/tema", uploadChatFile, createTema);

// Editar tema existente
router.put("/tema/:temaId", updateTema);

// Eliminar tema
router.delete("/tema/:temaId", deleteTema);

// === INTERAÇÃO COM TEMAS ===

// Avaliar tema (like/dislike)
router.post("/tema/:temaId/avaliar", avaliarTema);

// Denunciar tema por conteúdo inadequado
router.post("/tema/:temaId/denunciar", denunciarTema);

// === GESTÃO DE COMENTÁRIOS ===

// Obter comentários de um tema
router.get("/tema/:temaId/comentarios", getComentariosByTema);

// Criar novo comentário (com possibilidade de anexo)
router.post("/tema/:temaId/comentario", uploadChatFile, createComentario);

// Editar comentário existente
router.put("/comentario/:comentarioId", updateComentario);

// Eliminar comentário
router.delete("/comentario/:comentarioId", deleteComentario);

// === INTERAÇÃO COM COMENTÁRIOS ===

// Avaliar comentário (like/dislike)
router.post("/comentario/:comentarioId/avaliar", avaliarComentario);

// Denunciar comentário por conteúdo inadequado
router.post("/comentario/:comentarioId/denunciar", denunciarComentario);

module.exports = router;