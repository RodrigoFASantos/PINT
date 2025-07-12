const express = require("express");
const router = express.Router();
const verificarToken = require('../../middleware/auth');
const autorizar = require('../../middleware/autorizar');
const uploadUtils = require('../../middleware/upload');
const { 
  getAllCursos, getCursosByCategoria, getTopicoArea, createCurso, getCursoById, 
  getInscricoesCurso, updateCurso, deleteCurso, getCursosSugeridos,
  getTopicosCurso, createCurso_Topicos, updateCurso_Topicos, deleteCurso_Topicos
} = require("../../controllers/cursos/cursos_ctrl");

/**
 * Rotas para gestão completa do sistema de cursos
 * Oferece funcionalidades de listagem, criação, edição e eliminação de cursos
 * Inclui sistema de filtros, recomendações e gestão de tópicos organizacionais
 */

// Listar todos os cursos disponíveis com filtros avançados
// Acesso: Público (sem autenticação necessária)
router.get("/", getAllCursos);

// Obter cursos filtrados por categoria específica
// Acesso: Público
router.get("/por-categoria", getCursosByCategoria);

// Obter sugestões personalizadas de cursos para o utilizador autenticado
// Acesso: Utilizadores autenticados
router.get("/sugeridos", verificarToken, getCursosSugeridos);

// Obter informações de tópico de área específico
// Acesso: Público
router.get("/topico-area/:id", getTopicoArea);

// Criar novo curso com possibilidade de upload de imagem
// Acesso: Administradores (1) e Formadores (2)
router.post("/", verificarToken, autorizar([1, 2]), uploadUtils.uploadCurso.single("imagem"), createCurso);

// Obter detalhes completos de um curso específico
// Acesso: Público (com verificações de acesso para cursos terminados)
router.get("/:id", (req, res, next) => {
  if (req.headers.authorization) {
    verificarToken(req, res, (err) => {
      if (err) {
        req.user = null;
        req.utilizador = null;
      } else {
        const user = req.user || req.utilizador;
        if (user) {
          if (!req.user && req.utilizador) req.user = req.utilizador;
          if (!req.utilizador && req.user) req.utilizador = req.user;
        }
      }
      next();
    });
  } else {
    req.user = null;
    req.utilizador = null;
    next();
  }
}, getCursoById);

// Atualizar dados de curso existente com possibilidade de upload de nova imagem
// Acesso: Administradores (1) e Formadores (2)
router.put("/:id", verificarToken, autorizar([1, 2]), uploadUtils.uploadCurso.single("imagem"), updateCurso);

// Eliminar curso do sistema
// Acesso: Apenas Administradores (1)
router.delete("/:id", verificarToken, autorizar([1]), deleteCurso);

// Obter lista de inscrições ativas num curso
// Acesso: Utilizadores autenticados
router.get("/:id/inscricoes", verificarToken, getInscricoesCurso);

// Obter estrutura completa de tópicos organizacionais de um curso
// Acesso: Público
router.get("/:id/topicos", getTopicosCurso);

// Criar novo tópico para organização do conteúdo
// Acesso: Administradores (1), Formadores (2) e Estudantes (3)
router.post("/:id/topicos", verificarToken, autorizar([1, 2, 3]), createCurso_Topicos);

// Atualizar tópico organizacional existente
// Acesso: Administradores (1), Formadores (2) e Estudantes (3)
router.put("/topicos/:id", verificarToken, autorizar([1, 2, 3]), updateCurso_Topicos);

// Eliminar tópico organizacional específico
// Acesso: Administradores (1), Formadores (2) e Estudantes (3)
router.delete("/topicos/:id", verificarToken, autorizar([1, 2, 3]), deleteCurso_Topicos);

module.exports = router;