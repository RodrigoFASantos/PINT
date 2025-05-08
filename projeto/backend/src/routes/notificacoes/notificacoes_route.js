// src/routes/notificacoes/notificacoes_route.js
const express = require('express');
const router = express.Router();
const { getNotificacoesUtilizador, getNotificacoesNaoLidasContagem, marcarComoLida, marcarTodasComoLidas, adminCriado, formadorAlterado, cursoCriado, dataCursoAlterada } = require('../../controllers/notificacoes/notificacoes_ctrl');
const verificarToken = require('../../middleware/auth');

// Middleware para validar autenticação
router.use(verificarToken);

// Obter todas as notificações do utilizador com sessão iniciada
router.get('/', getNotificacoesUtilizador);

// Obter contagem de notificações não lidas
router.get('/nao-lidas/contagem', getNotificacoesNaoLidasContagem);

// Marcar notificação como lida
router.put('/:id_notificacao/lida', marcarComoLida);

// Marcar todas as notificações como lidas
router.put('/marcar-todas-como-lidas', marcarTodasComoLidas);

// Rotas para notificações específicas
router.post("/admin-criado", adminCriado);
router.post("/formador-alterado", formadorAlterado);
router.post("/curso-criado", cursoCriado);
router.post("/data-curso-alterada", dataCursoAlterada);

module.exports = router;