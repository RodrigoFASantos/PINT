const express = require('express');
const router = express.Router();
const topicoController = require('../../controllers/cursos/topico_area_ctrl');
const authMiddleware = require('../../middleware/authMiddleware');

/**
 * Rotas para gestão de tópicos por área de conhecimento
 * Organiza os temas de estudo dentro de áreas específicas
 */

// Aplicar middleware de autenticação a todas as rotas deste módulo
router.use(authMiddleware);

// Listar todos os tópicos disponíveis no sistema
// Acesso: Utilizadores autenticados
router.get('/', topicoController.listarTopicos);

// Obter detalhes de um tópico específico pelo seu ID
// Acesso: Utilizadores autenticados
router.get('/:id', topicoController.obterTopico);

// Criar novo tópico numa área de conhecimento
// Acesso: Utilizadores autenticados (permissões verificadas no controller)
router.post('/', topicoController.criarTopico);

// Atualizar informações de um tópico existente
// Acesso: Utilizadores autenticados (permissões verificadas no controller)
router.put('/:id', topicoController.atualizarTopico);

// Eliminar tópico do sistema
// Acesso: Utilizadores autenticados (permissões verificadas no controller)
router.delete('/:id', topicoController.excluirTopico);

module.exports = router;