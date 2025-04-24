const express = require("express");
const router = express.Router();

const verificarToken = require('../../middleware/auth');
const autorizar = require('../../middleware/autorizar');
const { 
  getTopicosByCurso, 
  createTopico, 
  getTopicoById, 
  updateTopico, 
  deleteTopico 
} = require("../../controllers/cursos/curso_topicos_ctrl");

// Rota para obter todos os tópicos de um curso com suas pastas e conteúdos
router.get("/curso/:id_curso", verificarToken, getTopicosByCurso);

// Rota para criar um novo tópico
router.post("/", verificarToken, autorizar([1, 2]), createTopico);

// Rotas para operações com um tópico específico
router.get("/:id", verificarToken, getTopicoById);
router.put("/:id", verificarToken, autorizar([1, 2]), updateTopico);
router.delete("/:id", verificarToken, autorizar([1, 2]), deleteTopico);

module.exports = router;