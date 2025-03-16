const express = require("express");
const router = express.Router();
const { getAllCategorias, createCategoria } = require("../controllers/categorias_ctrl");

router.get("/categorias", getAllCategorias);
router.post("/categorias", createCategoria);

module.exports = router;
