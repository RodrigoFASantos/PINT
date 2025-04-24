const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const authMiddleware = require('../middleware/auth');

// Aplicar middleware de autenticação em todas as rotas
router.use(authMiddleware);

// Rotas para o chat
router.get('/mensagens/:topicoId', chatController.getMensagens);
router.post('/mensagens', chatController.uploadAnexo, chatController.criarMensagem);
router.delete('/mensagens/:mensagemId', chatController.excluirMensagem);

module.exports = router;