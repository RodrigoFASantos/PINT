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
 * 
 * Sistema que permite aos utilizadores inscreverem-se, consultar e gerir as suas inscrições
 * Inclui verificações de permissão adequadas para cada operação
 */

// =============================================================================
// OPERAÇÕES ADMINISTRATIVAS
// =============================================================================

/**
 * Listar todas as inscrições do sistema (visão administrativa completa)
 * Acesso restrito a administradores para relatórios e estatísticas globais
 */
router.get("/", verificarToken, autorizar([1]), getAllInscricoes);

// =============================================================================
// GESTÃO DE INSCRIÇÕES PELO UTILIZADOR
// =============================================================================

/**
 * Criar nova inscrição num curso disponível
 * Todos os utilizadores autenticados podem inscrever-se em cursos abertos
 * Administradores podem inscrever outros utilizadores
 */
router.post("/", verificarToken, createInscricao);

/**
 * Consultar inscrições de um utilizador específico
 * Utilizado para ver o histórico de inscrições ativas de qualquer utilizador
 */
router.get("/usuario", verificarToken, getInscricoesUtilizador);

/**
 * Consultar as próprias inscrições do utilizador autenticado
 * Dashboard pessoal com histórico completo incluindo avaliações e progressos
 */
router.get("/minhas-inscricoes", verificarToken, getMinhasInscricoes);

// =============================================================================
// CONSULTAS ESPECÍFICAS POR CURSO
// =============================================================================

/**
 * Listar todas as inscrições de um curso específico
 * Formadores podem ver inscrições dos seus cursos, administradores veem todas
 */
router.get("/curso/:id_curso", verificarToken, getInscricoesPorCurso);

/**
 * Verificar se o utilizador atual está inscrito num curso específico
 * Essencial para determinar permissões e disponibilidade de funcionalidades
 * como marcar presenças, aceder a conteúdos, etc.
 */
router.get("/verificar/:id_curso", verificarToken, verificarInscricao);

// =============================================================================
// OPERAÇÕES DE CANCELAMENTO
// =============================================================================

/**
 * Cancelar inscrição específica
 * Utilizadores podem cancelar as próprias inscrições
 * Administradores e formadores podem cancelar qualquer inscrição
 * Atualiza automaticamente as vagas disponíveis do curso
 */
router.patch("/cancelar-inscricao/:id", verificarToken, cancelarInscricao);

module.exports = router;