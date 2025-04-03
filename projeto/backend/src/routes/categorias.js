const express = require("express");
const router = express.Router();
const { getAllCategorias, createCategoria, updateCategoria, deleteCategoria } = require("../controllers/categorias_ctrl");

router.get("/categorias", getAllCategorias);
router.post("/Createcategorias", createCategoria);
router.post("/Updatecategorias", updateCategoria);
router.post("/Deletecategorias", deleteCategoria);

module.exports = router;
