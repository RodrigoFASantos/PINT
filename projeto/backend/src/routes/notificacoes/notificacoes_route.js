// src/routes/notificacoes/notificacoes_route.js
const express = require('express');
const router = express.Router();
const notificacaoController = require('../../controllers/notificacoes/notificacoes_ctrl');
const verificarToken = require('../../middleware/auth');

// Middleware para validar autenticação
router.use(verificarToken);

// Obter todas as notificações do usuário logado
router.get('/', notificacaoController.getNotificacoesUsuario);

// Obter contagem de notificações não lidas
router.get('/nao-lidas/contagem', notificacaoController.getNotificacoesNaoLidasContagem);

// Marcar notificação como lida
router.put('/:id_notificacao/lida', notificacaoController.marcarComoLida);

// Marcar todas as notificações como lidas
router.put('/marcar-todas-como-lidas', notificacaoController.marcarTodasComoLidas);

// Rotas para notificações específicas
router.post("/admin-criado", notificacaoController.adminCriado);
router.post("/formador-alterado", notificacaoController.formadorAlterado); 
router.post("/curso-criado", notificacaoController.cursoCriado);
router.post("/data-curso-alterada", notificacaoController.dataCursoAlterada);

module.exports = router;