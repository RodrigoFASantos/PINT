const express = require("express");
const router = express.Router();
const authMiddleware = require("../../middleware/auth");
const autorizar = require("../../middleware/autorizar");

const {
  getForumTemaDenuncias,
  getForumComentarioDenuncias,
  getChatDenuncias,
  resolverForumTemaDenuncia,
  resolverForumComentarioDenuncia,
  resolverChatDenuncia,
  ocultarForumTema,
  ocultarForumComentario,
  ocultarChatMensagem
} = require("../../controllers/chat/denuncias_ctrl");

// Middleware para verificar autenticação e autorização de admin
router.use(authMiddleware);
router.use(autorizar([1])); // ID do cargo de admin

// Rotas para obter denúncias
router.get("/denuncias/forum-tema", getForumTemaDenuncias);
router.get("/denuncias/forum-comentario", getForumComentarioDenuncias);
router.get("/denuncias/chat", getChatDenuncias);

// Rotas para resolver denúncias
router.post("/denuncias/forum-tema/:id/resolver", resolverForumTemaDenuncia);
router.post("/denuncias/forum-comentario/:id/resolver", resolverForumComentarioDenuncia);
router.post("/denuncias/chat/:id/resolver", resolverChatDenuncia);

// Rotas para ocultar conteúdo denunciado
router.post("/forum-tema/ocultar", ocultarForumTema);
router.post("/forum-comentario/ocultar", ocultarForumComentario);
router.post("/chat-mensagem/ocultar", ocultarChatMensagem);

module.exports = router;