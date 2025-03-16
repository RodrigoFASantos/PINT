const express = require("express");
const router = express.Router();
const { getAllInscricoes, createInscricao } = require("../controllers/inscricoes_ctrl");

router.get("/inscricoes", getAllInscricoes);
router.post("/inscricoes", createInscricao);

module.exports = router;
