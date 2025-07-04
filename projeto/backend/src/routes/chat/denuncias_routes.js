const express = require("express");
const router = express.Router();
const authMiddleware = require("../../middleware/auth");
const autorizar = require("../../middleware/autorizar");
const {
  getForumTemaDenuncias,
  getForumComentarioDenuncias,
  criarForumTemaDenuncia,
  getUsuarioDenunciasTemas,
  getUsuarioDenunciasComentarios,
  getChatDenuncias,
  resolverForumTemaDenuncia,
  resolverForumComentarioDenuncia,
  resolverChatDenuncia,
  ocultarForumTema,
  ocultarForumComentario,
  ocultarChatMensagem
} = require("../../controllers/chat/denuncias_ctrl");

/**
 * Rotas para gestão de denúncias
 * Permite criar, consultar e resolver denúncias de conteúdo inadequado
 * Inclui gestão de temas, comentários do fórum e mensagens de chat
 */

// Aplicar autenticação a todas as rotas
router.use(authMiddleware);

// === ROTAS PÚBLICAS (qualquer utilizador autenticado) ===

// Criar denúncia de tema do fórum
router.post("/forum-tema/denunciar", criarForumTemaDenuncia);

// Consultar denúncias feitas pelo utilizador
router.get("/usuario/denuncias-temas", getUsuarioDenunciasTemas);
router.get("/usuario/denuncias-comentarios", getUsuarioDenunciasComentarios);

// === ROTAS ADMINISTRATIVAS (apenas administradores) ===

// === CONSULTA DE DENÚNCIAS ===

// Obter denúncias de temas do fórum
router.get("/denuncias/forum-tema", autorizar([1]), getForumTemaDenuncias);

// Obter denúncias de comentários do fórum
router.get("/denuncias/forum-comentario", autorizar([1]), getForumComentarioDenuncias);

// Obter denúncias de mensagens de chat
router.get("/denuncias/chat", autorizar([1]), getChatDenuncias);

// === RESOLUÇÃO DE DENÚNCIAS ===

// Resolver denúncia de tema do fórum
router.post("/denuncias/forum-tema/:id/resolver", autorizar([1]), resolverForumTemaDenuncia);

// Resolver denúncia de comentário do fórum
router.post("/denuncias/forum-comentario/:id/resolver", autorizar([1]), resolverForumComentarioDenuncia);

// Resolver denúncia de mensagem de chat
router.post("/denuncias/chat/:id/resolver", autorizar([1]), resolverChatDenuncia);

// === OCULTAÇÃO DE CONTEÚDO ===

// Ocultar tema do fórum
router.post("/forum-tema/ocultar", autorizar([1]), ocultarForumTema);

// Ocultar comentário do fórum
router.post("/forum-comentario/ocultar", autorizar([1]), ocultarForumComentario);

// Ocultar mensagem de chat
router.post("/chat-mensagem/ocultar", autorizar([1]), ocultarChatMensagem);

module.exports = router;