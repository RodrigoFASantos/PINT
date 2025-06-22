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

// Middleware para verificar autenticação em todas as rotas
router.use(authMiddleware);

// ========================================
// ROTAS PÚBLICAS (para qualquer usuário autenticado)
// ========================================

// Rota para criar denúncia de tema
router.post("/forum-tema/denunciar", criarForumTemaDenuncia);

// Rota para verificar denúncias feitas pelo utilizador
router.get("/usuario/denuncias-temas", getUsuarioDenunciasTemas);

// Rota para verificar comentários denunciados pelo utilizador
router.get("/usuario/denuncias-comentarios", getUsuarioDenunciasComentarios);

// ========================================
// ROTAS ADMINISTRATIVAS (apenas para admins - cargo 1)
// ========================================

// Middleware de debug para rotas administrativas
router.use((req, res, next) => {
  console.log(`🔍 [DENUNCIAS] Rota administrativa acessada: ${req.method} ${req.originalUrl}`);
  console.log(`🔍 [DENUNCIAS] Utilizador: ${req.utilizador?.nome} (Cargo: ${req.utilizador?.id_cargo})`);
  next();
});

// ========================================
// ROTAS PARA OBTER DENÚNCIAS (URL corrigidas para coincidir com frontend)
// ========================================

// Frontend chama: /api/denuncias/denuncias/forum-tema
router.get("/denuncias/forum-tema", autorizar([1]), (req, res, next) => {
  console.log(`🔍 [DENUNCIAS] Obtendo denúncias de temas do fórum`);
  next();
}, getForumTemaDenuncias);

// Frontend chama: /api/denuncias/denuncias/forum-comentario
router.get("/denuncias/forum-comentario", autorizar([1]), (req, res, next) => {
  console.log(`🔍 [DENUNCIAS] Obtendo denúncias de comentários do fórum`);
  next();
}, getForumComentarioDenuncias);

// Frontend chama: /api/denuncias/denuncias/chat
router.get("/denuncias/chat", autorizar([1]), (req, res, next) => {
  console.log(`🔍 [DENUNCIAS] Obtendo denúncias de chat`);
  next();
}, getChatDenuncias);

// ========================================
// ROTAS PARA RESOLVER DENÚNCIAS (URL corrigidas)
// ========================================

// Frontend chama: /api/denuncias/denuncias/forum-tema/${id}/resolver
router.post("/denuncias/forum-tema/:id/resolver", autorizar([1]), (req, res, next) => {
  console.log(`🔍 [DENUNCIAS] Resolvendo denúncia de tema ID: ${req.params.id}`);
  console.log(`🔍 [DENUNCIAS] Ação tomada: ${req.body.acao_tomada}`);
  next();
}, resolverForumTemaDenuncia);

// Frontend chama: /api/denuncias/denuncias/forum-comentario/${id}/resolver
router.post("/denuncias/forum-comentario/:id/resolver", autorizar([1]), (req, res, next) => {
  console.log(`🔍 [DENUNCIAS] Resolvendo denúncia de comentário ID: ${req.params.id}`);
  console.log(`🔍 [DENUNCIAS] Ação tomada: ${req.body.acao_tomada}`);
  next();
}, resolverForumComentarioDenuncia);

// Frontend chama: /api/denuncias/denuncias/chat/${id}/resolver
router.post("/denuncias/chat/:id/resolver", autorizar([1]), (req, res, next) => {
  console.log(`🔍 [DENUNCIAS] Resolvendo denúncia de chat ID: ${req.params.id}`);
  console.log(`🔍 [DENUNCIAS] Ação tomada: ${req.body.acao_tomada}`);
  next();
}, resolverChatDenuncia);

// ========================================
// ROTAS PARA OCULTAR CONTEÚDO (URL corrigidas)
// ========================================

// Frontend chama: /api/denuncias/forum-tema/ocultar
router.post("/forum-tema/ocultar", autorizar([1]), (req, res, next) => {
  console.log(`🔍 [DENUNCIAS] Ocultando tema ID: ${req.body.id}`);
  next();
}, ocultarForumTema);

// Frontend chama: /api/denuncias/forum-comentario/ocultar
router.post("/forum-comentario/ocultar", autorizar([1]), (req, res, next) => {
  console.log(`🔍 [DENUNCIAS] Ocultando comentário ID: ${req.body.id}`);
  next();
}, ocultarForumComentario);

// Frontend chama: /api/denuncias/chat-mensagem/ocultar
router.post("/chat-mensagem/ocultar", autorizar([1]), (req, res, next) => {
  console.log(`🔍 [DENUNCIAS] Ocultando mensagem de chat ID: ${req.body.id}`);
  next();
}, ocultarChatMensagem);

// ========================================
// ROTA DE DEBUG PARA VERIFICAR TODAS AS ROTAS DISPONÍVEIS
// ========================================
router.get("/debug/rotas", autorizar([1]), (req, res) => {
  const rotas = [
    'GET /denuncias/forum-tema',
    'GET /denuncias/forum-comentario', 
    'GET /denuncias/chat',
    'POST /denuncias/forum-tema/:id/resolver',
    'POST /denuncias/forum-comentario/:id/resolver',
    'POST /denuncias/chat/:id/resolver',
    'POST /forum-tema/ocultar',
    'POST /forum-comentario/ocultar',
    'POST /chat-mensagem/ocultar'
  ];
  
  res.json({
    success: true,
    message: "Rotas de denúncias disponíveis",
    rotas: rotas,
    baseUrl: "/api/denuncias"
  });
});

module.exports = router;