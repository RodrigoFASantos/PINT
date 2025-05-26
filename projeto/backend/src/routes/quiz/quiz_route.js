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

// Rotas abertas para todos utilizadores autenticados
router.get("/", verificarToken, getAllQuizzes);
router.get("/:id", verificarToken, getQuizById);

// Obter notas de quizzes por curso para avaliação
router.get("/notas-curso/:cursoId", verificarToken, autorizar([1, 2]), getNotasQuizzesPorCurso);

// Rotas apenas para administradores (formadores não podem criar/editar quizzes)
router.post("/", verificarToken, autorizar([1]), createQuiz);
router.put("/:id", verificarToken, autorizar([1]), updateQuiz);
router.put("/:id/completo", verificarToken, autorizar([1]), updateQuizCompleto);
router.delete("/:id", verificarToken, autorizar([1]), deleteQuiz);

// Rotas apenas para formandos (formadores não fazem quizzes)
router.post("/:id/iniciar", verificarToken, autorizar([3]), iniciarQuiz);
router.post("/:id/submeter", verificarToken, autorizar([3]), submeterQuiz);

module.exports = router;