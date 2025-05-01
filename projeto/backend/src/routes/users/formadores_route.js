const express = require('express');
const router = express.Router();
const formadorController = require('../../controllers/users/formador_ctrl');
const uploadUtils = require('../../middleware/upload');
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

// Adicionadas novas rotas de registro com confirmação 
router.post('/register', formadorController.registerFormador);

// Mantendo a rota antiga para compatibilidade, mas implementando o mesmo fluxo
router.post('/', formadorController.createFormador);

// Rotas para gerenciar categorias de formadores
router.get('/:id/categorias', formadorController.getCategoriasFormador);
router.post('/:id/categorias', verificarToken, verificarCargo(['admin', 'formador']), formadorController.addCategoriasFormador);
router.delete('/:id/categorias/:categoriaId', verificarToken, verificarCargo(['admin', 'formador']), formadorController.removeFormadorCategoria);

// Rotas para gerenciar áreas de formadores
router.get('/:id/areas', formadorController.getAreasFormador);
router.post('/:id/areas', verificarToken, verificarCargo(['admin', 'formador']), formadorController.addAreasFormador);
router.delete('/:id/areas/:areaId', verificarToken, verificarCargo(['admin', 'formador']), formadorController.removeFormadorArea);

// Rotas protegidas - apenas administradores podem atualizar/excluir formadores
router.put('/:id', verificarToken, verificarCargo(['admin']), formadorController.updateFormador);
router.delete('/:id', verificarToken, verificarCargo(['admin']), formadorController.deleteFormador);


router.get("/profile", verificarToken, formadorController.getFormadorProfile);

module.exports = router;