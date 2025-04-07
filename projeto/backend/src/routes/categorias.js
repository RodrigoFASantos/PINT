// routes/categorias.js
const express = require("express");
const router = express.Router();
const verificarToken = require('../middleware/auth');
const { getAllCategorias, createCategoria, updateCategoria, deleteCategoria } = require("../controllers/categorias_ctrl");

router.get("/", getAllCategorias);
router.post("/", verificarToken, createCategoria);
router.put("/:id", verificarToken, updateCategoria);
router.delete("/:id", verificarToken, deleteCategoria);

module.exports = router;