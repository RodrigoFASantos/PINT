const express = require('express');
const router = express.Router();
const areasController = require('../../controllers/areas/areas_ctrl');
const verificarToken = require('../../middleware/auth');
const autorizar = require('../../middleware/autorizar');
const verificarCargo = require('../../middleware/role_middleware');

/**
 * Rotas para gestão de áreas de formação
 * Permite consultar, criar, atualizar e eliminar áreas organizadas por categorias
 */

// === CONSULTA DE ÁREAS (todos os utilizadores autenticados) ===

// Obter lista de todas as áreas
router.get('/', verificarToken, areasController.getAllAreas);

// Obter áreas de uma categoria específica
router.get('/categoria/:id_categoria', verificarToken, areasController.getAreasByCategoria);

// Obter dados de uma área específica
router.get('/:id', verificarToken, areasController.getAreaById);

// === GESTÃO DE ÁREAS (apenas administradores e gestores) ===

// Criar nova área
router.post('/', 
  verificarToken, 
  verificarCargo(['admin', 'gestor']), 
  areasController.createArea
);

// Atualizar área existente
router.put('/:id', 
  verificarToken, 
  verificarCargo(['admin', 'gestor']), 
  areasController.updateArea
);

// Eliminar área
router.delete('/:id', 
  verificarToken, 
  verificarCargo(['admin', 'gestor']),
  areasController.deleteArea
);

module.exports = router;