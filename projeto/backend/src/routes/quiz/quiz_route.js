const express = require("express");
const router = express.Router();
const verificarToken = require('../../middleware/auth');
const autorizar = require('../../middleware/autorizar');
const { 
  getAllQuizzes, 
  createQuiz, 
  getQuizById, 
  updateQuiz,
  updateQuizCompleto,
  deleteQuiz,
  iniciarQuiz, 
  submeterQuiz,
  getNotasQuizzesPorCurso
} = require("../../controllers/quiz/quiz_ctrl");

/**
 * Rotas para gestão de quizzes
 * Controla criação, edição, realização e avaliação de quizzes
 */

// === ROTAS GERAIS (todos os utilizadores autenticados) ===

// Listar todos os quizzes disponíveis
router.get("/", verificarToken, getAllQuizzes);

// Obter dados de um quiz específico
router.get("/:id", verificarToken, getQuizById);

// === ROTAS PARA FORMADORES E ADMINISTRADORES ===

// Obter notas de quizzes por curso (para avaliação)
router.get("/notas-curso/:cursoId", verificarToken, autorizar([1, 2]), getNotasQuizzesPorCurso);

// === ROTAS ADMINISTRATIVAS (apenas administradores) ===

// Criar novo quiz
router.post("/", verificarToken, autorizar([1]), createQuiz);

// Atualizar quiz existente
router.put("/:id", verificarToken, autorizar([1]), updateQuiz);

// Atualização completa de quiz
router.put("/:id/completo", verificarToken, autorizar([1]), updateQuizCompleto);

// Eliminar quiz
router.delete("/:id", verificarToken, autorizar([1]), deleteQuiz);

// === ROTAS PARA FORMANDOS (realização de quizzes) ===

// Iniciar um quiz (apenas formandos)
router.post("/:id/iniciar", verificarToken, autorizar([3]), iniciarQuiz);

// Submeter respostas do quiz (apenas formandos)
router.post("/:id/submeter", verificarToken, autorizar([3]), submeterQuiz);

module.exports = router;