const express = require('express');
const router = express.Router();
const topicoController = require('../controllers/topicoController');
const authMiddleware = require('../middlewares/authMiddleware');

// Aplicar middleware de autenticação em todas as rotas
router.use(authMiddleware);

// Rotas para tópicos
router.get('/', topicoController.listarTopicos);
router.get('/:id', topicoController.obterTopico);
router.post('/', topicoController.criarTopico);
router.put('/:id', topicoController.atualizarTopico);
router.delete('/:id', topicoController.excluirTopico);

module.exports = router;