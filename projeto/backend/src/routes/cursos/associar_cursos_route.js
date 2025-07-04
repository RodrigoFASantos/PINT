const express = require("express");
const router = express.Router();
const verificarToken = require('../../middleware/auth');
const autorizar = require('../../middleware/autorizar');
const { associarCursos, getAssociacoesCurso, removerAssociacao, getAllAssociacoes } = require("../../controllers/cursos/associar_cursos_ctrl");

/**
 * Rotas para gestão de associações entre cursos
 * Permite criar, listar e remover associações que ligam diferentes cursos
 */

// Criar uma nova associação entre cursos
// Acesso: Administradores (id_cargo: 1) e Formadores (id_cargo: 2)
router.post("/", verificarToken, autorizar([1, 2]), associarCursos);

// Listar todas as associações do sistema para fins administrativos
// Acesso: Apenas Administradores (id_cargo: 1)
router.get("/", verificarToken, autorizar([1]), getAllAssociacoes);

// Listar associações de um curso específico
// Acesso: Qualquer utilizador autenticado
router.get("/curso/:id_curso", verificarToken, getAssociacoesCurso);

// Remover uma associação específica entre cursos
// Acesso: Administradores (id_cargo: 1) e Formadores (id_cargo: 2)
router.delete("/:id_associacao", verificarToken, autorizar([1, 2]), removerAssociacao);

module.exports = router;