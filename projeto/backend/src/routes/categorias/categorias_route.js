const express = require('express');
const router = express.Router();
const categoriasController = require('../../controllers/categorias/categorias_ctrl');
const verificarToken = require('../../middleware/auth');
const autorizar = require('../../middleware/autorizar');
const verificarCargo = require('../../middleware/role_middleware');

/**
 * Rotas para gestão de categorias
 * Permite consultar, criar, atualizar e eliminar categorias de cursos
 */

// === CONSULTA DE CATEGORIAS (todos os utilizadores autenticados) ===

// Obter lista de todas as categorias
router.get('/', verificarToken, categoriasController.getAllCategorias);

// Obter dados de uma categoria específica
router.get('/:id', verificarToken, categoriasController.getCategoriaById);

// === GESTÃO DE CATEGORIAS (apenas administradores e gestores) ===

// Criar nova categoria
router.post('/', 
  verificarToken, 
  verificarCargo(['admin', 'gestor']), 
  categoriasController.createCategoria
);

// Atualizar categoria existente
router.put('/:id', 
  verificarToken, 
  verificarCargo(['admin', 'gestor']), 
  categoriasController.updateCategoria
);

// Eliminar categoria
router.delete('/:id', 
  verificarToken, 
  verificarCargo(['admin', 'gestor']),
  categoriasController.deleteCategoria
);

module.exports = router;