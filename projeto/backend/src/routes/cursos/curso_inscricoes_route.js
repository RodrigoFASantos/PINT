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

/**
 * Rotas para gestão completa de inscrições em cursos
 * Permite criar, consultar, verificar e cancelar inscrições
 * Inclui funcionalidades administrativas e de utilizador
 */

// Listar todas as inscrições do sistema (visão administrativa completa)
// Acesso: Apenas Administradores (1)
router.get("/", verificarToken, autorizar([1]), getAllInscricoes);

// Criar nova inscrição num curso disponível
// Acesso: Utilizadores autenticados
router.post("/", verificarToken, createInscricao);

// Consultar inscrições de um utilizador específico
// Acesso: Utilizadores autenticados
router.get("/usuario", verificarToken, getInscricoesUtilizador);

// Consultar as próprias inscrições do utilizador autenticado
// Acesso: Utilizadores autenticados
router.get("/minhas-inscricoes", verificarToken, getMinhasInscricoes);

// Listar todas as inscrições de um curso específico
// Acesso: Utilizadores autenticados
router.get("/curso/:id_curso", verificarToken, getInscricoesPorCurso);

// Verificar se o utilizador atual está inscrito num curso específico
// Acesso: Utilizadores autenticados
router.get("/verificar/:id_curso", verificarToken, verificarInscricao);

// Cancelar inscrição específica
// Acesso: Utilizadores autenticados
router.patch("/cancelar-inscricao/:id", verificarToken, cancelarInscricao);

module.exports = router;