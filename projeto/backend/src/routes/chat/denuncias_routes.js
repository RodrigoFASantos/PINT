const express = require("express");
const router = express.Router();
const authMiddleware = require("../../middleware/auth");
const autorizar = require("../../middleware/autorizar");

const {
  getForumTemaDenuncias,
  getForumComentarioDenuncias,
  criarForumTemaDenuncia,
  getUsuarioDenunciasTemas,
  getChatDenuncias,
  resolverForumTemaDenuncia,
  resolverForumComentarioDenuncia,
  resolverChatDenuncia,
  ocultarForumTema,
  ocultarForumComentario,
  ocultarChatMensagem
} = require("../../controllers/chat/denuncias_ctrl");

// Middleware para verificar autenticação em todas as rotas
router.use(authMiddleware);

// ROTAS PÚBLICAS (para qualquer usuário autenticado)
// Rota para criar denúncia de tema
router.post("/forum-tema/denunciar", criarForumTemaDenuncia);

// Rota para verificar denúncias feitas pelo utilizador
router.get("/usuario/denuncias-temas", getUsuarioDenunciasTemas);

// ROTAS ADMINISTRATIVAS (apenas para admins - cargo 1)
// Aplicar middleware de autorização apenas para as rotas administrativas
router.use("/denuncias", autorizar([1]));
router.use("/resolver", autorizar([1]));
router.use("/ocultar", autorizar([1]));

// Rotas para obter denúncias (apenas admins)
router.get("/denuncias/forum-tema", getForumTemaDenuncias);
router.get("/denuncias/forum-comentario", getForumComentarioDenuncias);
router.get("/denuncias/chat", getChatDenuncias);

// Rotas para resolver denúncias (apenas admins)
router.post("/resolver/forum-tema/:id", resolverForumTemaDenuncia);
router.post("/resolver/forum-comentario/:id", resolverForumComentarioDenuncia);
router.post("/resolver/chat/:id", resolverChatDenuncia);

// Rotas para ocultar conteúdo denunciado (apenas admins)
router.post("/ocultar/forum-tema", ocultarForumTema);
router.post("/ocultar/forum-comentario", ocultarForumComentario);
router.post("/ocultar/chat-mensagem", ocultarChatMensagem);

module.exports = router;