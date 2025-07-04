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
 * ROTAS PARA GESTÃO COMPLETA DE INSCRIÇÕES EM CURSOS
 * Sistema que permite aos utilizadores inscreverem-se, consultar e gerir as suas inscrições
 */

// =============================================================================
// OPERAÇÕES ADMINISTRATIVAS
// =============================================================================

// Listar todas as inscrições do sistema (visão administrativa completa)
// Permissões: Apenas Administradores (1)
router.get("/", verificarToken, autorizar([1]), getAllInscricoes);

// =============================================================================
// GESTÃO DE INSCRIÇÕES PELO UTILIZADOR
// =============================================================================

// Criar nova inscrição num curso disponível
// Permissões: Todos os utilizadores autenticados
router.post("/", verificarToken, createInscricao);

// Consultar inscrições de um utilizador específico
// Permissões: Todos os utilizadores autenticados
router.get("/usuario", verificarToken, getInscricoesUtilizador);

// Consultar as próprias inscrições do utilizador autenticado
// Permissões: Todos os utilizadores autenticados
router.get("/minhas-inscricoes", verificarToken, getMinhasInscricoes);

// =============================================================================
// CONSULTAS ESPECÍFICAS POR CURSO
// =============================================================================

// Listar todas as inscrições de um curso específico
// Permissões: Todos os utilizadores autenticados
router.get("/curso/:id_curso", verificarToken, getInscricoesPorCurso);

// Verificar se o utilizador atual está inscrito num curso específico
// Permissões: Todos os utilizadores autenticados
router.get("/verificar/:id_curso", verificarToken, verificarInscricao);

// =============================================================================
// OPERAÇÕES DE CANCELAMENTO
// =============================================================================

// Cancelar inscrição específica (própria ou administrativa)
// Permissões: Todos os utilizadores autenticados (validação no controller)
router.patch("/cancelar-inscricao/:id", verificarToken, cancelarInscricao);

module.exports = router;