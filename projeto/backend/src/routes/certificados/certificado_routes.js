const express = require("express");
const router = express.Router();
const verificarToken = require('../../middleware/auth');
const { gerarCertificado, getCertificado } = require("../../controllers/certificados/certificados_ctrl");

router.get("/:id_avaliacao", verificarToken, getCertificado);
router.post("/:id_avaliacao", verificarToken, gerarCertificado);

module.exports = router;