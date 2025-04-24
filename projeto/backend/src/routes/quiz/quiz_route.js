const express = require("express");
const router = express.Router();
const verificarToken = require('../../middleware/auth');
const autorizar = require('../../middleware/autorizar');
const {
  getAllQuizzes,
  createQuiz,
  getQuizById,
  iniciarQuiz,
  responderPergunta,
  finalizarQuiz
} = require("../../controllers/quiz/quiz_ctrl");

// Rotas abertas para todos usuários autenticados
router.get("/", verificarToken, getAllQuizzes);
router.get("/:id", verificarToken, getQuizById);

// Rotas para formadores e administradores
router.post("/", verificarToken, autorizar([1, 2]), createQuiz);

// Rotas para formandos
router.post("/:id_quiz/iniciar", verificarToken, autorizar([3]), iniciarQuiz);
router.post("/responder", verificarToken, autorizar([3]), responderPergunta);
router.post("/finalizar/:id_resposta", verificarToken, autorizar([3]), finalizarQuiz);

module.exports = router;