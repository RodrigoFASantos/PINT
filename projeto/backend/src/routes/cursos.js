const express = require("express");
const router = express.Router();
const { getAllCursos, createCurso } = require("../controllers/cursos_ctrl");

router.get("/cursos", getAllCursos);
router.post("/cursos", createCurso);

module.exports = router;
