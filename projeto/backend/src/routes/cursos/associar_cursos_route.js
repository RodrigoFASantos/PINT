const express = require("express");
const router = express.Router();
const verificarToken = require('../../middleware/auth');
const autorizar = require('../../middleware/autorizar');
const { associarCursos, getAssociacoesCurso, removerAssociacao, getAllAssociacoes } = require("../../controllers/cursos/associar_cursos_ctrl");

// Criar uma nova associação entre cursos
// Apenas administradores e formadores podem criar associações
router.post("/", verificarToken, autorizar([1, 2]), associarCursos);

// Listar todas as associações do sistema para administração
// Apenas administradores podem ver todas as associações
router.get("/", verificarToken, autorizar([1]), getAllAssociacoes);

// Listar associações de um curso específico
// Qualquer utilizador autenticado pode ver as associações de um curso
router.get("/curso/:id_curso", verificarToken, getAssociacoesCurso);

// Remover uma associação específica
// Apenas administradores e formadores podem remover associações
router.delete("/:id_associacao", verificarToken, autorizar([1, 2]), removerAssociacao);

module.exports = router;