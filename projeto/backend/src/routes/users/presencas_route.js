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

// Rota para obter presenças de um curso
router.get("/curso/:id", verificarToken, getPresencasByCurso);

// Rota para obter presenças de um formando em um curso
router.get("/formando/:cursoId/:userId", verificarToken, getPresencasByFormando);

// Rota para criar presença (formador)
router.post("/criar", verificarToken, criarPresenca);

// Rota para marcar presença (formando)
router.post("/marcar", verificarToken, marcarPresenca);

// Rota para obter horas disponíveis de um curso
router.get("/horas-disponiveis/:id", verificarToken, getHorasDisponiveisCurso);

// Rota para atualizar presença (admin)
router.put("/atualizar/:id", verificarToken, autorizar([1]), atualizarPresenca);

// NOVA ROTA: Obter lista de formandos para uma presença específica (apenas formadores)
router.get("/formandos/:presencaId", verificarToken, autorizar([1, 2]), getFormandosPresenca);
                                                                      
module.exports = router;