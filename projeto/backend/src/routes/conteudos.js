const express = require("express");
const router = express.Router();
const { getAllConteudos, createConteudo } = require("../controllers/conteudos_ctrl");

router.get("/conteudos", getAllConteudos);
router.post("/conteudos", createConteudo);

module.exports = router;
