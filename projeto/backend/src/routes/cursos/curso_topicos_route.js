const express = require("express");
const router = express.Router();
const verificarToken = require('../../middleware/auth');
const autorizar = require('../../middleware/autorizar');
const { getTopicosByCurso, createTopico, getTopicoById, updateTopico, deleteTopico } = require("../../controllers/cursos/curso_topicos_ctrl");

/**
 * Rotas para gestão de tópicos dos cursos
 * Os tópicos estruturam o conteúdo do curso em secções organizadas
 */

// Obter todos os tópicos de um curso, incluindo pastas e conteúdos associados
// Acesso: Utilizadores autenticados
router.get("/curso/:id_curso", verificarToken, getTopicosByCurso);

// Criar um novo tópico para estruturar o conteúdo do curso
// Acesso: Administradores (id_cargo: 1) e Formadores (id_cargo: 2)
router.post("/", verificarToken, autorizar([1, 2]), createTopico);

// Obter detalhes de um tópico específico pelo seu ID
// Acesso: Utilizadores autenticados
router.get("/:id", verificarToken, getTopicoById);

// Atualizar informações de um tópico existente
// Acesso: Administradores (id_cargo: 1) e Formadores (id_cargo: 2)
router.put("/:id", verificarToken, autorizar([1, 2]), updateTopico);

// Eliminar um tópico do sistema
// Acesso: Administradores (id_cargo: 1) e Formadores (id_cargo: 2)
router.delete("/:id", verificarToken, autorizar([1, 2]), deleteTopico);

module.exports = router;