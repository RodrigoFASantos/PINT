const express = require('express');
const router = express.Router();
const conteudoCursoController = require('../controllers/conteudos_curso_ctrl');
const authMiddleware = require('../middleware/auth');

// Middleware para verificar se o usuário é admin ou formador
const permissionMiddleware = (req, res, next) => {
  if (req.user.id_cargo === 1 || req.user.id_cargo === 2) {
    return next();
  }
  return res.status(403).json({ message: 'Acesso negado. Apenas administradores e formadores podem executar esta ação.' });
};

// Middleware para verificar se é admin
const adminMiddleware = (req, res, next) => {
  if (req.user.id_cargo === 1) {
    return next();
  }
  return res.status(403).json({ message: 'Acesso negado. Apenas administradores podem executar esta ação.' });
};

// Rotas para gerenciamento de conteúdos
router.get('/', authMiddleware, conteudoCursoController.getAllConteudos);
router.get('/:id', authMiddleware, conteudoCursoController.getConteudoById);
router.get('/pasta/:pastaId', authMiddleware, conteudoCursoController.getConteudosByPasta);

// Rota para obter conteúdos por curso
router.get('/curso/:cursoId', authMiddleware, conteudoCursoController.getConteudosByCurso);

// Rota para criar um novo conteúdo
router.post('/', 
  authMiddleware, 
  permissionMiddleware,
  conteudoCursoController.uploadMiddleware,
  conteudoCursoController.createConteudo
);

// Rota para atualizar um conteúdo existente
router.put('/:id', 
  authMiddleware, 
  permissionMiddleware, 
  conteudoCursoController.uploadMiddleware,
  conteudoCursoController.updateConteudo
);

// Rota para excluir um conteúdo (exclusão lógica)
router.delete('/:id', 
  authMiddleware, 
  permissionMiddleware, 
  conteudoCursoController.deleteConteudo
);

// Rota para excluir permanentemente um conteúdo
router.delete('/:id/permanent', 
  authMiddleware, 
  adminMiddleware, 
  conteudoCursoController.deleteConteudoPermanently
);

// Rota para restaurar um conteúdo excluído logicamente
router.put('/:id/restore', 
  authMiddleware, 
  permissionMiddleware, 
  conteudoCursoController.restoreConteudo
);

// Rota para reordenar conteúdos em uma pasta
router.put('/pasta/:pastaId/ordenar', 
  authMiddleware, 
  permissionMiddleware, 
  conteudoCursoController.reordenarConteudos
);

// Rota para corrigir conteúdos sem id_curso (apenas admin)
router.post('/admin/corrigir', 
  authMiddleware, 
  adminMiddleware, 
  conteudoCursoController.corrigirConteudosSemCurso
);

module.exports = router;