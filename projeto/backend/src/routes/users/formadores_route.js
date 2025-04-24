const express = require('express');
const router = express.Router();
const formadorController = require('../../controllers/users/formador_ctrl');

// Importar o middleware de autenticação existente
const verificarToken = require('../../middleware/auth');

// Função de verificação de cargos baseada no middleware existente
const verificarCargo = (cargosPermitidos) => {
  return async (req, res, next) => {
    try {
      // Verificar se o usuário tem o cargo necessário
      const cargo = req.user.id_cargo || 0;
      
      // Mapear ID do cargo para nome do cargo
      const cargoMap = {
        1: 'admin',
        2: 'formador',
        3: 'formando'
      };
      
      const cargoNome = cargoMap[cargo] || 'desconhecido';
      
      if (!cargosPermitidos.includes(cargoNome)) {
        return res.status(403).json({ 
          message: "Acesso negado. Você não tem permissão para acessar este recurso." 
        });
      }
      
      next();
    } catch (error) {
      console.error("Erro ao verificar permissões:", error);
      return res.status(500).json({ message: "Erro ao verificar permissões", error: error.message });
    }
  };
};

// Rotas públicas (sem autenticação)
router.get('/', formadorController.getAllFormadores);
router.get('/:id', formadorController.getFormadorById);
router.get('/:id/cursos', formadorController.getCursosFormador);

// Rotas protegidas - apenas administradores podem criar/atualizar/excluir formadores
router.post('/', verificarToken, verificarCargo(['admin']), formadorController.createFormador);
router.put('/:id', verificarToken, verificarCargo(['admin']), formadorController.updateFormador);
router.delete('/:id', verificarToken, verificarCargo(['admin']), formadorController.deleteFormador);

module.exports = router;