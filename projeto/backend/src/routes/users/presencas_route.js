const express = require("express");
const router = express.Router();
const verificarToken = require('../../middleware/auth');
const autorizar = require('../../middleware/autorizar');
const { 
  getPresencasByCurso, 
  getPresencasByFormando, 
  criarPresenca, 
  marcarPresenca,
  getHorasDisponiveisCurso,
  atualizarPresenca,
  getFormandosPresenca
} = require("../../controllers/users/presencas_ctrl");

/**
 * ROTAS PARA GESTÃO COMPLETA DE PRESENÇAS EM CURSOS
 * 
 * Sistema que permite criar sessões de presença, marcar presenças 
 * e consultar estatísticas de participação nos cursos
 */

// =============================================================================
// CONSULTA DE PRESENÇAS E ESTATÍSTICAS
// =============================================================================

/**
 * Obter todas as presenças de um curso específico
 * Retorna lista completa com estatísticas de participação
 * Formadores veem todas as presenças, formandos apenas as que já começaram
 */
router.get("/curso/:id", verificarToken, getPresencasByCurso);

/**
 * Obter presenças marcadas por um formando específico num curso
 * Permite consultar o histórico de participação individual
 * Útil para relatórios de frequência e cálculo de horas
 */
router.get("/formando/:cursoId/:userId", verificarToken, getPresencasByFormando);

/**
 * Obter informações sobre horas disponíveis de um curso
 * Calcula horas utilizadas vs horas totais do curso
 * Essencial para validar se ainda é possível criar mais presenças
 */
router.get("/horas-disponiveis/:id", verificarToken, getHorasDisponiveisCurso);

/**
 * Obter lista detalhada de formandos para uma presença específica
 * Mostra quem estava presente/ausente numa sessão
 * Acesso restrito a formadores e administradores
 */
router.get("/formandos/:presencaId", verificarToken, autorizar([1, 2]), getFormandosPresenca);

// =============================================================================
// GESTÃO DE PRESENÇAS
// =============================================================================

/**
 * Criar nova sessão de presença
 * Apenas formadores podem criar presenças para os seus cursos
 * Inclui validações de horários e limites de duração do curso
 */
router.post("/criar", verificarToken, criarPresenca);

/**
 * Marcar presença numa sessão ativa
 * Todos os utilizadores inscritos podem marcar presença
 * Requer código válido e sessão dentro do período permitido
 */
router.post("/marcar", verificarToken, marcarPresenca);

/**
 * Atualizar dados de uma presença existente
 * Funcionalidade administrativa para correção de horários ou códigos
 * Acesso restrito apenas a administradores
 */
router.put("/atualizar/:id", verificarToken, autorizar([1]), atualizarPresenca);

module.exports = router;