const express = require("express");
const router = express.Router();
const verificarToken = require('../../middleware/auth');
const autorizar = require('../../middleware/autorizar');
const { getEstatisticas } = require("../../controllers/dashboard/dashboard_ctrl");

router.get("/estatisticas", verificarToken, autorizar([1]), getEstatisticas);

module.exports = router;