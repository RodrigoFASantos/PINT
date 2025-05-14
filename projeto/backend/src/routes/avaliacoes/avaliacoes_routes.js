const express = require('express');
const router = express.Router();
const { getAllAvaliacoes, createAvaliacao, getAvaliacaoById, updateAvaliacao, deleteAvaliacao } = require('../../controllers/avaliacoes/avaliacoes_ctrl');
const verificarToken = require('../../middleware/auth');
const autorizar = require('../../middleware/autorizar');

// Aplicar middleware de autenticação em todas as rotas
router.use(verificarToken);

// Rotas para avaliações
router.get('/', getAllAvaliacoes);
router.get('/:id', getAvaliacaoById);
router.post('/', autorizar([1, 2]), createAvaliacao);
router.put('/:id', autorizar([1, 2]), updateAvaliacao);
router.delete('/:id', autorizar([1]), deleteAvaliacao);

module.exports = router;