const express = require("express");
const router = express.Router();
const inscricoesCanceladasController = require("../controllers/inscricoes_cursos_canceladas_ctrl");
const { authenticateToken } = require("../middleware/authMiddleware");

// Middleware de autenticação para todas as rotas
router.use(authenticateToken);

// Obter todas as inscrições canceladas (apenas para gestores)
router.get("/", inscricoesCanceladasController.getInscricoesCanceladas);

// Obter uma inscrição cancelada específica
router.get("/:id", inscricoesCanceladasController.getInscricaoCancelada);

// Obter inscrições canceladas de um usuário específico
router.get("/usuario/:userId", inscricoesCanceladasController.getInscricoesCanceladasByUser);

// Obter inscrições canceladas de um curso específico
router.get("/curso/:cursoId", inscricoesCanceladasController.getInscricoesCanceladasByCurso);

// Obter estatísticas de cancelamentos (apenas para gestores)
router.get("/estatisticas/resumo", inscricoesCanceladasController.getEstatisticasCancelamentos);

module.exports = router;