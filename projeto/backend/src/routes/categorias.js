const express = require("express");
const router = express.Router();
const { getAllCategorias, createCategoria, updateCategoria, deleteCategoria } = require("../controllers/categorias_ctrl");

router.get("/categorias", getAllCategorias);
router.post("/categorias", createCategoria);
router.post("/categorias", updateCategoria);
router.post("/categorias", deleteCategoria);

module.exports = router;
