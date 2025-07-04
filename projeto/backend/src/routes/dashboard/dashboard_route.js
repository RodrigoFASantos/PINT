const express = require("express");
const router = express.Router();
const verificarToken = require('../../middleware/auth');
const autorizar = require('../../middleware/autorizar');
const { 
  getEstatisticas,
  getCursosPorCategoria,
  getInscricoesPorMes,
  getUtilizadoresPorPerfil,
  getCursosMaisInscritos
} = require("../../controllers/dashboard/dashboard_ctrl");

/**
 * Rotas para dashboard administrativo
 * Fornece estatísticas e dados agregados para análise
 * Acesso restrito apenas a administradores
 */

// === DADOS ESTATÍSTICOS ===

// Estatísticas gerais do sistema
router.get("/estatisticas", verificarToken, autorizar([1]), getEstatisticas);

// Dados de cursos agrupados por categoria
router.get("/cursos-categoria", verificarToken, autorizar([1]), getCursosPorCategoria);

// Dados de inscrições mensais (evolução temporal)
router.get("/inscricoes-mes", verificarToken, autorizar([1]), getInscricoesPorMes);

// Dados de utilizadores agrupados por perfil/cargo
router.get("/utilizadores-perfil", verificarToken, autorizar([1]), getUtilizadoresPorPerfil);

// Dados dos cursos mais populares (por número de inscrições)
router.get("/cursos-populares", verificarToken, autorizar([1]), getCursosMaisInscritos);

// === ROTA DE TESTE ===

// Verificação do estado da API do dashboard
router.get("/teste", (req, res) => {
  res.json({ 
    message: "Dashboard API está a funcionar!", 
    timestamp: new Date().toISOString()
  });
});

module.exports = router;