const express = require('express');
const router = express.Router();
const { getAllAvaliacoes, createAvaliacao, getAvaliacaoById, updateAvaliacao, deleteAvaliacao } = require('../../controllers/avaliacoes/avaliacoes_ctrl');
const verificarToken = require('../../middleware/auth');
const autorizar = require('../../middleware/autorizar');

/**
 * Rotas para gestão de avaliações
 * Permite criar, consultar, atualizar e eliminar avaliações de cursos
 */

// Aplicar autenticação a todas as rotas
router.use(verificarToken);

// === CONSULTA DE AVALIAÇÕES ===

// Obter lista de todas as avaliações
router.get('/', getAllAvaliacoes);

// Obter dados de uma avaliação específica
router.get('/:id', getAvaliacaoById);

// === GESTÃO DE AVALIAÇÕES (administradores e formadores) ===

// Criar nova avaliação
router.post('/', autorizar([1, 2]), createAvaliacao);

// Atualizar avaliação existente
router.put('/:id', autorizar([1, 2]), updateAvaliacao);

// === ELIMINAÇÃO DE AVALIAÇÕES (apenas administradores) ===

// Eliminar avaliação
router.delete('/:id', autorizar([1]), deleteAvaliacao);

module.exports = router;