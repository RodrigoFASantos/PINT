const express = require("express");
const router = express.Router();
const verificarToken = require('../../middleware/auth');
const autorizar = require('../../middleware/autorizar');
const { criarNovaOcorrencia, listarOcorrencias, getOcorrenciaById } = require("../../controllers/ocorrencias/ocorrencias_ctrl");

/**
 * Rotas para gestão de ocorrências
 * Permite criar, listar e consultar ocorrências nos cursos
 */

// Criar nova ocorrência (apenas administradores e formadores)
router.post("/", verificarToken, autorizar([1, 2]), criarNovaOcorrencia);

// Listar ocorrências de um curso específico
router.get("/curso/:id_curso", verificarToken, listarOcorrencias);

// Obter detalhes de uma ocorrência específica
router.get("/:id_ocorrencia", verificarToken, getOcorrenciaById);

module.exports = router;