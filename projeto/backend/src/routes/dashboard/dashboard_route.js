const express = require("express");
const router = express.Router();
const verificarToken = require('../../middleware/auth');
const autorizar = require('../../middleware/autorizar');

// Importar todas as funções do controller
const { 
  getEstatisticas,
  getCursosPorCategoria,
  getInscricoesPorMes,
  getUtilizadoresPorPerfil,
  getDenunciasPorTopico,
  getCursosMaisInscritos,
  getEvolucaoUtilizadores,
  getTopFormadores,
  getTaxaConclusaoCursos,
  getAtividadeRecente,
  getInscritucoesRecentesPorCurso,
  getPresencasHoje,
  getCursosTerminandoEmBreve
} = require("../../controllers/dashboard/dashboard_ctrl");

console.log('[DEBUG] A carregar rotas do dashboard...');

// ==== ROTAS PRINCIPAIS ====

// Rota principal de estatísticas gerais
router.get("/estatisticas", verificarToken, autorizar([1]), getEstatisticas);

// Rotas específicas para gráficos e dados
router.get("/cursos-categoria", verificarToken, autorizar([1]), getCursosPorCategoria);
router.get("/inscricoes-mes", verificarToken, autorizar([1]), getInscricoesPorMes);
router.get("/utilizadores-perfil", verificarToken, autorizar([1]), getUtilizadoresPorPerfil);
router.get("/denuncias-topico", verificarToken, autorizar([1]), getDenunciasPorTopico);
router.get("/cursos-populares", verificarToken, autorizar([1]), getCursosMaisInscritos);
router.get("/evolucao-utilizadores", verificarToken, autorizar([1]), getEvolucaoUtilizadores);
router.get("/top-formadores", verificarToken, autorizar([1]), getTopFormadores);
router.get("/taxa-conclusao", verificarToken, autorizar([1]), getTaxaConclusaoCursos);
router.get("/atividade-recente", verificarToken, autorizar([1]), getAtividadeRecente);

// Rotas para dados específicos
router.get("/inscricoes-recentes", verificarToken, autorizar([1]), getInscritucoesRecentesPorCurso);
router.get("/presencas-hoje", verificarToken, autorizar([1]), getPresencasHoje);
router.get("/cursos-terminando", verificarToken, autorizar([1]), getCursosTerminandoEmBreve);

// ==== ROTA DE TESTE ====

// Rota de teste (sem autenticação para debug)
router.get("/teste", (req, res) => {
  console.log('[DEBUG] Rota de teste do dashboard chamada');
  res.json({ 
    message: "Dashboard API está funcionando!", 
    timestamp: new Date().toISOString(),
    rotas_disponiveis: [
      '/estatisticas',
      '/cursos-categoria', 
      '/inscricoes-mes',
      '/utilizadores-perfil',
      '/denuncias-topico',
      '/cursos-populares',
      '/evolucao-utilizadores',
      '/top-formadores',
      '/taxa-conclusao',
      '/atividade-recente'
    ]
  });
});

console.log('[DEBUG] Rotas do dashboard carregadas com sucesso');

module.exports = router;