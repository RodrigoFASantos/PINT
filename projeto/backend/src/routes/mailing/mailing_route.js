const express = require("express");
const router = express.Router();
const verificarToken = require('../../middleware/auth');
const autorizar = require('../../middleware/autorizar');
const { enviarDivulgacaoGeral, enviarDivulgacaoPorArea } = require("../../controllers/mailing/mailing_ctrl");

// Apenas administradores podem enviar divulgações
router.post("/divulgar", verificarToken, autorizar([1]), enviarDivulgacaoGeral);
router.post("/divulgar/area/:id_area", verificarToken, autorizar([1]), enviarDivulgacaoPorArea);

module.exports = router;