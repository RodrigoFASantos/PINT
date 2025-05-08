const express = require("express");
const router = express.Router();
const verificarToken = require('../../middleware/auth');
const autorizar = require('../../middleware/autorizar');
const { criarNovaOcorrencia, listarOcorrencias, getOcorrenciaById } = require("../../controllers/ocorrencias/ocorrencias_ctrl");

// Rotas protegidas para administradores e formadores
router.post("/", verificarToken, autorizar([1, 2]), criarNovaOcorrencia);
router.get("/curso/:id_curso", verificarToken, listarOcorrencias);
router.get("/:id_ocorrencia", verificarToken, getOcorrenciaById);

module.exports = router;