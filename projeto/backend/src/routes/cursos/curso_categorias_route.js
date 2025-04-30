const express = require("express");
const router = express.Router();
const verificarToken = require('../../middleware/auth');
const autorizar = require('../../middleware/autorizar');
const categoriaController = require('../../controllers/cursos/categoria_ctrl.js');

// Listar todas as categorias
router.get("/", categoriaController.getAllCategorias);

// Obter categoria por ID
router.get("/:id", categoriaController.getCategoriaById);

// Listar áreas de uma categoria específica
router.get("/:id/areas", categoriaController.getAreasByCategoria);

// Criar categoria (apenas admin)
router.post("/", verificarToken, autorizar([1]), categoriaController.createCategoria);

// Atualizar categoria (apenas admin)
router.put("/:id", verificarToken, autorizar([1]), categoriaController.updateCategoria);

// Deletar categoria (apenas admin)
router.delete("/:id", verificarToken, autorizar([1]), categoriaController.deleteCategoria);

module.exports = router;