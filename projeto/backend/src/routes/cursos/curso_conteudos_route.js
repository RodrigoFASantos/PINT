const express = require('express');
const router = express.Router();
const { getAllConteudos, getConteudoById, getConteudosByPasta, getConteudosByCurso, createConteudo, updateConteudo, deleteConteudo, deleteConteudoPermanently, restoreConteudo, reordenarConteudos, corrigirConteudosSemCurso } = require("../../controllers/cursos/curso_conteudos_ctrl");
const authMiddleware = require('../../middleware/auth');
const uploadMiddleware = require('../../middleware/upload_middleware');

/**
 * Rotas para gestão de conteúdos dos cursos
 * Permite criar, editar, eliminar e organizar materiais didáticos
 */

/**
 * Middleware que verifica se o utilizador é administrador ou formador
 * @param {Object} req - Objeto de requisição
 * @param {Object} res - Objeto de resposta
 * @param {Function} next - Função para passar ao próximo middleware
 */
const permissionMiddleware = (req, res, next) => {
  if (req.user.id_cargo === 1 || req.user.id_cargo === 2) {
    return next();
  }
  return res.status(403).json({ message: 'Acesso negado. Apenas administradores e formadores podem executar esta ação.' });
};

/**
 * Middleware que verifica se o utilizador é administrador
 * @param {Object} req - Objeto de requisição
 * @param {Object} res - Objeto de resposta
 * @param {Function} next - Função para passar ao próximo middleware
 */
const adminMiddleware = (req, res, next) => {
  if (req.user.id_cargo === 1) {
    return next();
  }
  return res.status(403).json({ message: 'Acesso negado. Apenas administradores podem executar esta ação.' });
};

// Listar todos os conteúdos do sistema
// Acesso: Utilizadores autenticados
router.get('/', authMiddleware, getAllConteudos);

// Obter detalhes de um conteúdo específico
// Acesso: Utilizadores autenticados
router.get('/:id', authMiddleware, getConteudoById);

// Listar conteúdos organizados por pasta
// Acesso: Utilizadores autenticados
router.get('/pasta/:pastaId', authMiddleware, getConteudosByPasta);

// Listar todos os conteúdos de um curso específico
// Acesso: Utilizadores autenticados
router.get('/curso/:cursoId', authMiddleware, getConteudosByCurso);

// Criar novo conteúdo com possibilidade de upload de ficheiros
// Acesso: Administradores e Formadores
router.post('/', authMiddleware, permissionMiddleware, uploadMiddleware.uploadCursoConteudo, createConteudo);

// Atualizar conteúdo existente com possibilidade de upload de ficheiros
// Acesso: Administradores e Formadores
router.put('/:id', authMiddleware, permissionMiddleware, uploadMiddleware.uploadCursoConteudo, updateConteudo);

// Eliminar conteúdo (exclusão lógica - marca como eliminado mas mantém na base de dados)
// Acesso: Administradores e Formadores
router.delete('/:id', authMiddleware, permissionMiddleware, deleteConteudo);

// Eliminar conteúdo permanentemente da base de dados
// Acesso: Apenas Administradores
router.delete('/:id/permanent', authMiddleware, adminMiddleware, deleteConteudoPermanently);

// Restaurar conteúdo previamente eliminado logicamente
// Acesso: Administradores e Formadores
router.put('/:id/restore', authMiddleware, permissionMiddleware, restoreConteudo);

// Reordenar a sequência de conteúdos dentro de uma pasta
// Acesso: Administradores e Formadores
router.put('/pasta/:pastaId/ordenar', authMiddleware, permissionMiddleware, reordenarConteudos);

// Ferramenta administrativa para corrigir conteúdos sem associação a curso
// Acesso: Apenas Administradores
router.post('/admin/corrigir', authMiddleware, adminMiddleware, corrigirConteudosSemCurso);

module.exports = router;