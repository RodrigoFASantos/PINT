const express = require("express");
const router = express.Router();
const verificarToken = require('../../middleware/auth');
const autorizar = require('../../middleware/autorizar');
const { getAllTiposConteudo, createTipoConteudo, updateTipoConteudo, deleteTipoConteudo } = require("../../controllers/cursos/tipos_conteudo_ctrl");

// Rota aberta para todos os utilizadores
router.get("/", getAllTiposConteudo);

// Rotas protegidas para administradores
router.post("/", verificarToken, autorizar([1]), createTipoConteudo);
router.put("/:id", verificarToken, autorizar([1]), updateTipoConteudo);
router.delete("/:id", verificarToken, autorizar([1]), deleteTipoConteudo);

module.exports = router;