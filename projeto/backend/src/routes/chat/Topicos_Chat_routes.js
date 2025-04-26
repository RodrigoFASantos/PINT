const express = require('express');
const router = express.Router();
const topicosChatCtrl = require('../../controllers/chat/Topicos_Chat_ctrl');
const authMiddleware = require('../../middleware/auth');
const upload = require('../../middleware/upload');

// Middleware de autenticação para todas as rotas
router.use(authMiddleware);

// Rota para obter detalhes de um tópico
router.get('/topico/:id', topicosChatCtrl.getTopico);

// Rota para obter mensagens de um tópico
router.get('/topico/:id/comentarios', topicosChatCtrl.getMensagens);

// Rota para enviar mensagem (com ou sem anexo)
router.post('/topico/:id/comentarios', upload.single('anexo'), topicosChatCtrl.enviarMensagem);

// Rotas para avaliar/denunciar mensagens
router.post('/topico/:id/comentarios/:idComentario/avaliar', topicosChatCtrl.avaliarMensagem);
router.post('/topico/:id/comentarios/:idComentario/denunciar', topicosChatCtrl.denunciarMensagem);


module.exports = router;