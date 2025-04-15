const express = require("express");
const router = express.Router();
const { getAllTopicos, createTopico } = require("../controllers/topicos_ctrl");

// Corrigir os caminhos para não incluir 'topicos' no path
router.get("/", getAllTopicos);
router.post("/", createTopico);

module.exports = router;