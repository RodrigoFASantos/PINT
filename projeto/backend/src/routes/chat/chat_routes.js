const express = require('express');
const router = express.Router();
const chatController = require('../../controllers/chat/chat_ctrl');
const authMiddleware = require('../../middleware/auth');

/**
 * Rotas para sistema de chat
 * Permite envio, consulta e eliminação de mensagens em tópicos
 */

// Aplicar autenticação a todas as rotas
router.use(authMiddleware);

// === GESTÃO DE MENSAGENS ===

// Obter mensagens de um tópico específico
router.get('/mensagens/:topicoId', chatController.getMensagens);

// Criar nova mensagem (com possibilidade de anexo)
router.post('/mensagens', chatController.uploadAnexo, chatController.criarMensagem);

// Eliminar mensagem específica
router.delete('/mensagens/:mensagemId', chatController.excluirMensagem);

module.exports = router;