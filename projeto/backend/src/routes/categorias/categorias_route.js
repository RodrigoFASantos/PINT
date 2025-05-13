const express = require('express');
const router = express.Router();
const categoriasController = require('../../controllers/categorias/categorias_ctrl');
const verificarToken = require('../../middleware/auth');
const autorizar = require('../../middleware/autorizar');
const verificarCargo = require('../../middleware/role_middleware');

// Rota para obter todas as categorias (acessível a todos os utilizadores autenticados)
router.get('/', verificarToken, categoriasController.getAllCategorias);

// Rota para obter uma categoria específica pelo ID
router.get('/:id', verificarToken, categoriasController.getCategoriaById);

// Rota para criar uma nova categoria (apenas admin e gestor)
router.post('/', 
  verificarToken, 
  verificarCargo(['admin', 'gestor']), 
  categoriasController.createCategoria
);

// Rota para atualizar uma categoria existente (apenas admin e gestor)
router.put('/:id', 
  verificarToken, 
  verificarCargo(['admin', 'gestor']), 
  categoriasController.updateCategoria
);

// Rota para excluir uma categoria (apenas admin e gestor)
router.delete('/:id', 
  verificarToken, 
  verificarCargo(['admin', 'gestor']),
  categoriasController.deleteCategoria
);

module.exports = router;