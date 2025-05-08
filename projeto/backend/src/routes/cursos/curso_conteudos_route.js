const express = require('express');
const router = express.Router();
const { getAllConteudos, getConteudoById, getConteudosByPasta, getConteudosByCurso, createConteudo, updateConteudo, deleteConteudo, deleteConteudoPermanently, restoreConteudo, reordenarConteudos, corrigirConteudosSemCurso } = require("../../controllers/cursos/curso_conteudos_ctrl");
const authMiddleware = require('../../middleware/auth');
const uploadMiddleware = require('../../middleware/upload_middleware');

// Middleware para verificar se o utilizador é admin ou formador
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

// Rotas para gestão de conteúdos
router.get('/', authMiddleware, getAllConteudos);
router.get('/:id', authMiddleware, getConteudoById);
router.get('/pasta/:pastaId', authMiddleware, getConteudosByPasta);

// Rota para obter conteúdos por curso
router.get('/curso/:cursoId', authMiddleware, getConteudosByCurso);

// Rota para criar um novo conteúdo
router.post('/', authMiddleware, permissionMiddleware, uploadMiddleware.uploadCursoConteudo, createConteudo);

// Rota para atualizar um conteúdo existente
router.put('/:id', authMiddleware, permissionMiddleware, uploadMiddleware.uploadCursoConteudo, updateConteudo);

// Rota para excluir um conteúdo (exclusão lógica)
router.delete('/:id', authMiddleware, permissionMiddleware, deleteConteudo);

// Rota para excluir permanentemente um conteúdo
router.delete('/:id/permanent', authMiddleware, adminMiddleware, deleteConteudoPermanently);

// Rota para restaurar um conteúdo excluído logicamente
router.put('/:id/restore', authMiddleware, permissionMiddleware, restoreConteudo);

// Rota para reordenar conteúdos numa pasta
router.put('/pasta/:pastaId/ordenar', authMiddleware, permissionMiddleware, reordenarConteudos);

// Rota para corrigir conteúdos sem id_curso (apenas admin)
router.post('/admin/corrigir', authMiddleware, adminMiddleware, corrigirConteudosSemCurso);

module.exports = router;