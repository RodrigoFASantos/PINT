const express = require('express');
const router = express.Router();
const { getAllConteudos, getConteudoById, getConteudosByPasta, getConteudosByCurso, createConteudo, updateConteudo, deleteConteudo, deleteConteudoPermanently, restoreConteudo, reordenarConteudos, corrigirConteudosSemCurso } = require("../../controllers/cursos/curso_conteudos_ctrl");
const authMiddleware = require('../../middleware/auth');
const uploadMiddleware = require('../../middleware/upload_middleware');

/**
 * Rotas para gestão de conteúdos dos cursos
 * Permite criar, editar, eliminar e organizar materiais didáticos
 * 
 * Sistema de permissões:
 * - Administradores: acesso total a todas as operações
 * - Formadores: podem gerir conteúdos dos seus próprios cursos
 * - Utilizadores: apenas visualização de conteúdos dos cursos em que tão inscritos
 */

/**
 * Middleware que verifica se o utilizador é administrador ou formador
 * Usado para operações que requerem privilégios elevados
 * 
 * @param {Object} req - Objeto de requisição com dados do utilizador autenticado
 * @param {Object} res - Objeto de resposta HTTP
 * @param {Function} next - Função para passar ao próximo middleware
 * @returns {Object} Resposta de erro se não tem permissão, ou continua para o próximo middleware
 */
const permissionMiddleware = (req, res, next) => {
  if (req.user.id_cargo === 1 || req.user.id_cargo === 2) {
    return next();
  }
  return res.status(403).json({ message: 'Acesso negado. Apenas administradores e formadores podem executar esta ação.' });
};

/**
 * Middleware que verifica se o utilizador é administrador
 * Usado para operações críticas que apenas administradores podem executar
 * 
 * @param {Object} req - Objeto de requisição com dados do utilizador autenticado
 * @param {Object} res - Objeto de resposta HTTP
 * @param {Function} next - Função para passar ao próximo middleware
 * @returns {Object} Resposta de erro se não é administrador, ou continua para o próximo middleware
 */
const adminMiddleware = (req, res, next) => {
  if (req.user.id_cargo === 1) {
    return next();
  }
  return res.status(403).json({ message: 'Acesso negado. Apenas administradores podem executar esta ação.' });
};

// Listar todos os conteúdos do sistema
// Acesso: Utilizadores autenticados (filtrado conforme permissões)
router.get('/', authMiddleware, getAllConteudos);

// Obter detalhes de um conteúdo específico
// Acesso: Utilizadores autenticados (verificação de acesso no controller)
router.get('/:id', authMiddleware, getConteudoById);

// Listar conteúdos organizados por pasta
// Acesso: Utilizadores autenticados (verificação de acesso no controller)
router.get('/pasta/:pastaId', authMiddleware, getConteudosByPasta);

// Listar todos os conteúdos de um curso específico
// Acesso: Utilizadores autenticados (verificação de inscrição no controller)
router.get('/curso/:cursoId', authMiddleware, getConteudosByCurso);

// Criar novo conteúdo com possibilidade de upload de ficheiros
// Acesso: Administradores e Formadores
// Suporta upload de ficheiros através do middleware especializado
router.post('/', authMiddleware, permissionMiddleware, uploadMiddleware.uploadCursoConteudo, createConteudo);

// Atualizar conteúdo existente com possibilidade de upload de ficheiros
// Acesso: Administradores e Formadores (verificação de propriedade no controller)
// Permite alterar dados e substituir ficheiros
router.put('/:id', authMiddleware, permissionMiddleware, uploadMiddleware.uploadCursoConteudo, updateConteudo);

// Eliminar conteúdo (exclusão lógica com remoção do ficheiro físico)
// Acesso: Administradores e Formadores (verificação de propriedade no controller)
// CORRIGIDO: Agora remove tanto da base de dados como do sistema de ficheiros
router.delete('/:id', authMiddleware, permissionMiddleware, deleteConteudo);

// Eliminar conteúdo permanentemente da base de dados
// Acesso: Apenas Administradores
// Remove completamente o registo e ficheiros associados
router.delete('/:id/permanent', authMiddleware, adminMiddleware, deleteConteudoPermanently);

// Restaurar conteúdo previamente eliminado logicamente
// Acesso: Administradores e Formadores
// Reativa conteúdos marcados como inativo
router.put('/:id/restore', authMiddleware, permissionMiddleware, restoreConteudo);

// Reordenar a sequência de conteúdos dentro de uma pasta
// Acesso: Administradores e Formadores
// Permite reorganizar a ordem de apresentação dos materiais
router.put('/pasta/:pastaId/ordenar', authMiddleware, permissionMiddleware, reordenarConteudos);

// Ferramenta administrativa para corrigir conteúdos sem associação a curso
// Acesso: Apenas Administradores
// Utilitário para corrigir inconsistências de dados
router.post('/admin/corrigir', authMiddleware, adminMiddleware, corrigirConteudosSemCurso);

module.exports = router;