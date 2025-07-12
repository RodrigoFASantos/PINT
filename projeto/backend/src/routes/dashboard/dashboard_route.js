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
 * === ROTAS DO DASHBOARD ADMINISTRATIVO ===
 * 
 * Este módulo define todas as rotas relacionadas com o dashboard de administração.
 * Fornece estatísticas e dados agregados para análise e visualização.
 * 
 * Acesso: Restrito apenas a utilizadores com perfil de administrador (id_cargo: 1)
 * Autenticação: Requer token JWT válido
 * Autorização: Middleware autorizar([1]) garante acesso apenas a administradores
 */

// === ROTAS DE DADOS ESTATÍSTICOS ===

/**
 * Rota: GET /dashboard/estatisticas
 * Descrição: Retorna estatísticas gerais do sistema (utilizadores, cursos, inscrições)
 * Dados: Contagens totais, distribuições por estado, métricas de atividade
 */
router.get("/estatisticas", verificarToken, autorizar([1]), getEstatisticas);

/**
 * Rota: GET /dashboard/cursos-categoria
 * Descrição: Retorna dados de cursos agrupados por categoria
 * Dados: Nome da categoria e número de cursos em cada uma
 * Uso: Gráfico de distribuição por categorias (doughnut/pie chart)
 */
router.get("/cursos-categoria", verificarToken, autorizar([1]), getCursosPorCategoria);

/**
 * Rota: GET /dashboard/inscricoes-mes
 * Descrição: Retorna evolução das inscrições ao longo dos meses do ano atual
 * Dados: Array com dados mensais de janeiro a dezembro
 * Uso: Gráfico de linha temporal mostrando tendências de inscrição
 */
router.get("/inscricoes-mes", verificarToken, autorizar([1]), getInscricoesPorMes);

/**
 * Rota: GET /dashboard/utilizadores-perfil
 * Descrição: Retorna distribuição de utilizadores por perfil/cargo
 * Dados: Contagens de administradores, formadores e formandos
 * Uso: Gráfico de barras mostrando composição da base de utilizadores
 */
router.get("/utilizadores-perfil", verificarToken, autorizar([1]), getUtilizadoresPorPerfil);

/**
 * Rota: GET /dashboard/cursos-populares
 * Descrição: Retorna lista dos cursos com maior número de inscrições
 * Dados: Top 10 cursos ordenados por popularidade (número de inscrições)
 * Uso: Gráfico de barras horizontais ou ranking de cursos mais procurados
 */
router.get("/cursos-populares", verificarToken, autorizar([1]), getCursosMaisInscritos);

// === ROTA DE DIAGNÓSTICO ===

/**
 * Rota: GET /dashboard/teste
 * Descrição: Verificação básica do estado da API do dashboard
 * Uso: Teste de conectividade e funcionamento básico do serviço
 * Acesso: Público (sem autenticação) para facilitar diagnósticos
 */
router.get("/teste", (req, res) => {
  res.json({ 
    message: "Dashboard API está operacional", 
    timestamp: new Date().toISOString(),
    version: "1.0"
  });
});

module.exports = router;