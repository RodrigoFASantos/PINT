const express = require("express");
const router = express.Router();
const verificarToken = require('../../middleware/auth');
const autorizar = require('../../middleware/autorizar');
const { getAllCategorias, getCategoriaById, getAreasByCategoria, createCategoria, updateCategoria, deleteCategoria } = require('../../controllers/cursos/categoria_ctrl.js');

// Listar todas as categorias
router.get("/", getAllCategorias);

// Obter categoria por ID
router.get("/:id", getCategoriaById);

// Listar áreas de uma categoria específica
router.get("/:id/areas", getAreasByCategoria);

// Criar categoria (apenas admin)
router.post("/", verificarToken, autorizar([1]), createCategoria);

// Atualizar categoria (apenas admin)
router.put("/:id", verificarToken, autorizar([1]), updateCategoria);

// Eliminar categoria (apenas admin)
router.delete("/:id", verificarToken, autorizar([1]), deleteCategoria);

module.exports = router;