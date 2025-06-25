const express = require("express");
const router = express.Router();
const verificarToken = require('../../middleware/auth');
const autorizar = require('../../middleware/autorizar');

// Importar apenas as funções necessárias do controller
const { 
  getEstatisticas,
  getCursosPorCategoria,
  getInscricoesPorMes,
  getUtilizadoresPorPerfil,
  getCursosMaisInscritos
} = require("../../controllers/dashboard/dashboard_ctrl");

// Rota principal de estatísticas gerais do dashboard
router.get("/estatisticas", verificarToken, autorizar([1]), getEstatisticas);

// Rota para dados de cursos agrupados por categoria
router.get("/cursos-categoria", verificarToken, autorizar([1]), getCursosPorCategoria);

// Rota para dados de inscrições mensais
router.get("/inscricoes-mes", verificarToken, autorizar([1]), getInscricoesPorMes);

// Rota para dados de utilizadores agrupados por perfil
router.get("/utilizadores-perfil", verificarToken, autorizar([1]), getUtilizadoresPorPerfil);

// Rota para dados dos cursos mais populares
router.get("/cursos-populares", verificarToken, autorizar([1]), getCursosMaisInscritos);

// Rota de teste para verificar se a API está funcionando
router.get("/teste", (req, res) => {
  res.json({ 
    message: "Dashboard API está funcionando!", 
    timestamp: new Date().toISOString(),
    rotas_disponiveis: [
      '/estatisticas',
      '/cursos-categoria', 
      '/inscricoes-mes',
      '/utilizadores-perfil',
      '/cursos-populares'
    ]
  });
});

module.exports = router;