const express = require('express');
const router = express.Router();
const { listarTopicos, obterTopico, criarTopico, atualizarTopico, excluirTopico } = require('../../controllers/cursos/topico_ctrl');
const verificarToken = require('../../middleware/auth');

// Aplicar middleware de autenticação em todas as rotas
router.use(verificarToken);

// Rotas para tópicos
router.get('/', listarTopicos);
router.get('/:id', obterTopico);
router.post('/', criarTopico);
router.put('/:id', atualizarTopico);
router.delete('/:id', excluirTopico);

module.exports = router;