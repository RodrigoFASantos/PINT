const express = require("express");
const router = express.Router();
const verificarToken = require('../../middleware/auth');
const autorizar = require('../../middleware/autorizar');
const {
  getAllInscricoes,
  getInscricoesPorCurso,
  createInscricao,
  cancelarInscricao,
  getInscricoesUtilizador,
  getMinhasInscricoes,
  verificarInscricao
} = require("../../controllers/cursos/curso_inscricoes_ctrl");

// Rotas das inscrições
router.get("/", verificarToken, autorizar([1]), getAllInscricoes);
router.get("/usuario", verificarToken, getInscricoesUtilizador);
router.get("/minhas-inscricoes", verificarToken, getMinhasInscricoes);
router.get("/curso/:id_curso", verificarToken, getInscricoesPorCurso);
router.get("/verificar/:id_curso", verificarToken, verificarInscricao);
router.post("/", verificarToken, createInscricao);

// ROTA CORRIGIDA - Cancelar inscrição (apenas formadores e admins)
router.patch("/cancelar-inscricao/:id", verificarToken, cancelarInscricao);

module.exports = router;