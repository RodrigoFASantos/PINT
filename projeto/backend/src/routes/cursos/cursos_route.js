const express = require("express");
const router = express.Router();
const verificarToken = require('../../middleware/auth');
const autorizar = require('../../middleware/autorizar');
const { 
  getAllCursos, getCursosByCategoria, createCurso, getCursoById, 
  getInscricoesCurso, updateCurso, deleteCurso, getCursosSugeridos,
  getTopicosCurso, createTopicoCurso, updateTopicoCurso, deleteTopicoCurso
} = require("../../controllers/cursos/cursos_ctrl");
const uploadUtils = require('../../middleware/upload');

// Rotas de cursos
router.post("/", verificarToken, autorizar([1, 2]), uploadUtils.uploadCurso.single("imagem"), createCurso);
router.get("/", getAllCursos);
router.get("/por-categoria", getCursosByCategoria);
router.get("/sugeridos", verificarToken, getCursosSugeridos);
router.get("/:id", getCursoById);
router.put("/:id", verificarToken, autorizar([1, 2]), uploadUtils.uploadCurso.single("imagem"), updateCurso);
router.delete("/:id", verificarToken, autorizar([1]), deleteCurso);
router.get("/:id/inscricoes", verificarToken, getInscricoesCurso);

// Rotas para tópicos de cursos
router.get("/:id/topicos", getTopicosCurso);
router.post("/:id/topicos", verificarToken, autorizar([1, 2, 3]), createTopicoCurso);
router.put("/topicos/:id", verificarToken, autorizar([1, 2, 3]), updateTopicoCurso);
router.delete("/topicos/:id", verificarToken, autorizar([1, 2, 3]), deleteTopicoCurso);

module.exports = router;