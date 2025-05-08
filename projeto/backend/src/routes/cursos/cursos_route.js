const express = require("express");
const router = express.Router();
const verificarToken = require('../../middleware/auth');
const autorizar = require('../../middleware/autorizar');
const { getAllCursos, getCursosByCategoria, createCurso, getCursoById, getInscricoesCurso, updateCurso, deleteCurso, getCursosSugeridos } = require("../../controllers/cursos/cursos_ctrl");
const uploadUtils = require('../../middleware/upload');

// Criar curso (com upload de imagem)
router.post("/", verificarToken, autorizar([1, 2]), uploadUtils.uploadCurso.single("imagem"), createCurso);

// Listar todos os cursos
router.get("/", getAllCursos);

// Listar cursos filtrados por categoria (para seleção ao criar formador)
router.get("/por-categoria", getCursosByCategoria);

// Procurar cursos sugeridos
router.get("/sugeridos", verificarToken, getCursosSugeridos);

// Obter curso por ID
router.get("/:id", getCursoById);

// Atualizar curso (pode incluir nova imagem)
router.put("/:id", verificarToken, autorizar([1, 2]), uploadUtils.uploadCurso.single("imagem"), updateCurso);

// Eliminar curso
router.delete("/:id", verificarToken, autorizar([1]), deleteCurso);

// Listar inscrições do curso
router.get("/:id/inscricoes", verificarToken, getInscricoesCurso);

module.exports = router;