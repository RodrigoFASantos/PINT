const express = require("express");
const router = express.Router();
const verificarToken = require('../../middleware/auth');
const autorizar = require('../../middleware/autorizar');
const { associarCursos, getAssociacoesCurso, removerAssociacao } = require("../../controllers/cursos/associar_cursos_ctrl");

// Criar uma associação entre cursos
router.post("/", verificarToken, autorizar([1, 2]), associarCursos);

// Listar associações de um curso
router.get("/curso/:id_curso", getAssociacoesCurso);

// Remover uma associação
router.delete("/:id_associacao", verificarToken, autorizar([1, 2]), removerAssociacao);

module.exports = router;