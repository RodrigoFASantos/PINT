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
 * Rotas para gestão de presenças
 * Permite criar, consultar e atualizar presenças de formandos nos cursos
 */

// === CONSULTA DE PRESENÇAS ===

// Obter todas as presenças de um curso específico
router.get("/curso/:id", verificarToken, getPresencasByCurso);

// Obter presenças de um formando num curso específico
router.get("/formando/:cursoId/:userId", verificarToken, getPresencasByFormando);

// Obter horas disponíveis de um curso para marcar presenças
router.get("/horas-disponiveis/:id", verificarToken, getHorasDisponiveisCurso);

// Obter lista de formandos para uma presença específica (apenas formadores e admins)
router.get("/formandos/:presencaId", verificarToken, autorizar([1, 2]), getFormandosPresenca);

// === GESTÃO DE PRESENÇAS ===

// Criar nova presença (formadores)
router.post("/criar", verificarToken, criarPresenca);

// Marcar presença (formandos)
router.post("/marcar", verificarToken, marcarPresenca);

// Atualizar presença existente (apenas administradores)
router.put("/atualizar/:id", verificarToken, autorizar([1]), atualizarPresenca);

module.exports = router;