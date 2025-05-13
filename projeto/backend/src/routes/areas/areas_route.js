const express = require('express');
const router = express.Router();
const areasController = require('../../controllers/areas/areas_ctrl');
const verificarToken = require('../../middleware/auth');
const autorizar = require('../../middleware/autorizar');
const verificarCargo = require('../../middleware/role_middleware');

// Rota para obter todas as áreas (acessível a todos os utilizadores autenticados)
router.get('/', verificarToken, areasController.getAllAreas);

// Rota para obter todas as áreas de uma categoria específica
router.get('/categoria/:id_categoria', verificarToken, areasController.getAreasByCategoria);

// Rota para obter uma área específica pelo ID
router.get('/:id', verificarToken, areasController.getAreaById);

// Rota para criar uma nova área (apenas admin e gestor)
router.post('/', 
  verificarToken, 
  verificarCargo(['admin', 'gestor']), 
  areasController.createArea
);

// Rota para atualizar uma área existente (apenas admin e gestor)
router.put('/:id', 
  verificarToken, 
  verificarCargo(['admin', 'gestor']), 
  areasController.updateArea
);

// Rota para excluir uma área (apenas admin e gestor)
router.delete('/:id', 
  verificarToken, 
  verificarCargo(['admin', 'gestor']),
  areasController.deleteArea
);

module.exports = router;