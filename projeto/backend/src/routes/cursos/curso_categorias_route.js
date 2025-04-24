// routes/categorias.js
const express = require("express");
const router = express.Router();
const verificarToken = require('../../middleware/auth');
const { getAllCategorias, getCategoriaById, createCategoria, updateCategoria, deleteCategoria } = require("../../controllers/cursos/curso_categorias_ctrl");


router.get("/", getAllCategorias);
router.get('/:id', getCategoriaById);
router.post("/", verificarToken, createCategoria);
router.put("/:id", verificarToken, updateCategoria);
router.delete("/:id", verificarToken, deleteCategoria);

module.exports = router;