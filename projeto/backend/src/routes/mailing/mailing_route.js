const express = require("express");
const router = express.Router();
const verificarToken = require('../../middleware/auth');
const autorizar = require('../../middleware/autorizar');
const { 
  enviarDivulgacaoGeral, 
  enviarDivulgacaoPorArea 
} = require("../../controllers/mailing/mailing_ctrl");

/**
 * ROTAS PARA SISTEMA DE EMAILS EM MASSA
 * Permite envio de comunicações e divulgações para diferentes segmentos de utilizadores
 * Acesso restrito exclusivamente a administradores do sistema
 */

// =============================================================================
// DIVULGAÇÕES GERAIS
// =============================================================================

// Enviar comunicação geral para todos os utilizadores registados
// Ideal para anúncios importantes, atualizações do sistema ou eventos globais
// Permissões: Apenas Administradores (1)
router.post("/divulgar", 
  verificarToken, 
  autorizar([1]), 
  enviarDivulgacaoGeral
);

// =============================================================================
// DIVULGAÇÕES SEGMENTADAS
// =============================================================================

// Enviar comunicação direcionada para utilizadores de uma área específica
// Permite marketing direcionado e comunicações relevantes por interesse
// Permissões: Apenas Administradores (1)
router.post("/divulgar/area/:id_area", 
  verificarToken, 
  autorizar([1]), 
  enviarDivulgacaoPorArea
);

module.exports = router;