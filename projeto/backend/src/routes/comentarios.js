const express = require("express");
const router = express.Router();
const { getAllComentarios, createComentario } = require("../controllers/comentarios_ctrl");

router.get("/comentarios", getAllComentarios);
router.post("/comentarios", createComentario);

module.exports = router;
