const express = require("express");
const router = express.Router();
const verificarToken = require('../../middleware/auth');
const { buscarSugestoesFormandos, getPercursoFormandos, getEstatisticasGerais } = require("../../controllers/users/Percurso_Formandos_ctrl");

/**
 * Rotas para gestão de percursos e estatísticas de formandos
 * Permite consultar estatísticas, buscar formandos e gerir percursos formativos
 */

// === ROTAS PROTEGIDAS (requerem autenticação) ===

// Obter estatísticas gerais dos formandos
router.get("/estatisticas", verificarToken, getEstatisticasGerais);

// Buscar sugestões de formandos (para autocompletar, etc.)
router.get("/buscar-formandos", verificarToken, buscarSugestoesFormandos);

// Obter percurso completo dos formandos (área administrativa)
router.get("/admin/percurso-formandos", verificarToken, getPercursoFormandos);

// === ROTAS DE TESTE ===

// Verificação do estado da API
router.get("/test", (req, res) => {
  res.status(200).json({ 
    message: "API de percurso formandos está a funcionar!", 
    timestamp: new Date().toISOString() 
  });
});

module.exports = router;